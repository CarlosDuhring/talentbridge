import { execFile } from "child_process";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

export type RunResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
};

const HOST_TIMEOUT_MS = 5000;
const DOCKER_TIMEOUT_MS = 20000;
const MAX_OUTPUT = 20000;

type LanguageSpec = {
  file: string;
  hostCmd: () => string;
  hostArgs: (dir: string) => string[];
  image: string;
  containerArgs: string[];
};

const RUNNERS: Record<string, LanguageSpec> = {
  php: {
    file: "main.php",
    hostCmd: () => "php",
    hostArgs: (dir) => [join(dir, "main.php")],
    image: "php:8.3-cli",
    containerArgs: ["php", "/app/main.php"],
  },
  javascript: {
    file: "main.js",
    hostCmd: () => "node",
    hostArgs: (dir) => [join(dir, "main.js")],
    image: "node:20-alpine",
    containerArgs: ["node", "/app/main.js"],
  },
  python: {
    file: "main.py",
    hostCmd: () => (process.platform === "win32" ? "python" : "python3"),
    hostArgs: (dir) => [join(dir, "main.py")],
    image: "python:3.12-alpine",
    containerArgs: ["python", "/app/main.py"],
  },
  java: {
    file: "Main.java",
    hostCmd: () => "java",
    hostArgs: (dir) => [join(dir, "Main.java")],
    image: "eclipse-temurin:21-jdk",
    containerArgs: ["java", "/app/Main.java"],
  },
};

export function supportedLanguages() {
  return Object.keys(RUNNERS);
}

let dockerCheck: Promise<boolean> | null = null;

function dockerAvailable(): Promise<boolean> {
  if (!dockerCheck) {
    dockerCheck = new Promise((resolve) => {
      execFile(
        "docker",
        ["info", "--format", "{{.ServerVersion}}"],
        { timeout: 5000, windowsHide: true },
        (error, stdout, stderr) => {
          if (error) return resolve(false);
          const version = String(stdout).trim();
          const failed =
            /error during connect|cannot connect|is not recognized/i.test(
              `${version}\n${stderr}`
            );
          resolve(version.length > 0 && !failed);
        }
      );
    });
  }
  return dockerCheck;
}

async function resolveRunnerMode(): Promise<"docker" | "host" | null> {
  const pref = (process.env.CODE_RUNNER ?? "auto").toLowerCase();
  if (pref === "host") return "host";
  const hasDocker = await dockerAvailable();
  if (pref === "docker") return hasDocker ? "docker" : null;
  return hasDocker ? "docker" : "host";
}

function dockerArgs(dir: string, name: string, spec: LanguageSpec): string[] {
  return [
    "run",
    "--rm",
    "-i",
    "--name",
    name,
    "--network",
    "none",
    "--memory",
    "256m",
    "--cpus",
    "0.5",
    "--pids-limit",
    "128",
    "-v",
    `${dir}:/app:ro`,
    "-w",
    "/app",
    spec.image,
    ...spec.containerArgs,
  ];
}

export async function runCode(
  language: string,
  code: string,
  stdin: string
): Promise<RunResult> {
  const spec = RUNNERS[language];
  if (!spec) {
    return {
      ok: false,
      stdout: "",
      stderr: `Linguagem não suportada: ${language}`,
      timedOut: false,
      durationMs: 0,
    };
  }

  const mode = await resolveRunnerMode();
  if (!mode) {
    return {
      ok: false,
      stdout: "",
      stderr:
        "Execução isolada indisponível: Docker não encontrado. Instale o Docker ou defina CODE_RUNNER=host.",
      timedOut: false,
      durationMs: 0,
    };
  }

  const useDocker = mode === "docker";
  const dir = await mkdtemp(join(tmpdir(), "tb-run-"));
  const containerName = useDocker
    ? `tb-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    : null;
  const started = Date.now();

  try {
    await writeFile(join(dir, spec.file), code, "utf8");
    const result = await new Promise<RunResult>((resolve) => {
      const child = execFile(
        useDocker ? "docker" : spec.hostCmd(),
        useDocker ? dockerArgs(dir, containerName!, spec) : spec.hostArgs(dir),
        {
          cwd: dir,
          timeout: useDocker ? DOCKER_TIMEOUT_MS : HOST_TIMEOUT_MS,
          killSignal: "SIGKILL",
          maxBuffer: 1024 * 1024,
          windowsHide: true,
          env: useDocker
            ? process.env
            : {
                PATH: process.env.PATH,
                HOME: dir,
                LANG: "C.UTF-8",
                NODE_ENV: process.env.NODE_ENV,
              },
        },
        (error, stdout, stderr) => {
          const timedOut =
            !!error && (error as NodeJS.ErrnoException & { killed?: boolean }).killed === true;
          resolve({
            ok: !error,
            stdout: String(stdout).slice(0, MAX_OUTPUT),
            stderr: String(stderr).slice(0, MAX_OUTPUT),
            timedOut,
            durationMs: Date.now() - started,
          });
        }
      );
      child.stdin?.write(stdin);
      child.stdin?.end();
    });
    return result;
  } finally {
    if (containerName) {
      await new Promise<void>((resolve) => {
        execFile(
          "docker",
          ["rm", "-f", containerName],
          { timeout: 5000, windowsHide: true },
          () => resolve()
        );
      });
    }
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export type TestCase = {
  input: string;
  expectedOutput: string;
  description?: string;
};

export type TestRunSummary = {
  passed: number;
  total: number;
  failures: string[];
  results: {
    index: number;
    passed: boolean;
    input: string;
    expected: string;
    received: string;
    stderr?: string;
    timedOut: boolean;
  }[];
};

export async function runTestCases(
  language: string,
  code: string,
  cases: TestCase[]
): Promise<TestRunSummary> {
  const results: TestRunSummary["results"] = [];
  let passed = 0;
  const failures: string[] = [];

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const run = await runCode(language, code, tc.input + "\n");
    const received = run.stdout.trim();
    const expected = tc.expectedOutput.trim();
    const ok = run.ok && received === expected;
    if (ok) passed++;
    else {
      failures.push(
        `Caso ${i + 1}${tc.description ? ` (${tc.description})` : ""}: esperado "${expected}", recebido "${received || run.stderr.trim().slice(0, 120) || "sem saída"}"`
      );
    }
    results.push({
      index: i,
      passed: ok,
      input: tc.input,
      expected,
      received,
      stderr: run.stderr.trim().slice(0, 300) || undefined,
      timedOut: run.timedOut,
    });
  }

  return { passed, total: cases.length, failures, results };
}
