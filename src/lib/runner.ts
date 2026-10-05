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

const TIMEOUT_MS = 5000;
const MAX_OUTPUT = 20000;

const RUNNERS: Record<
  string,
  { file: string; cmd: string; args: (dir: string) => string[] }
> = {
  php: {
    file: "main.php",
    cmd: "php",
    args: (dir) => [join(dir, "main.php")],
  },
  javascript: {
    file: "main.js",
    cmd: "node",
    args: (dir) => [join(dir, "main.js")],
  },
  python: {
    file: "main.py",
    cmd: "python3",
    args: (dir) => [join(dir, "main.py")],
  },
  java: {
    file: "Main.java",
    cmd: "java",
    args: (dir) => [join(dir, "Main.java")],
  },
};

export function supportedLanguages() {
  return Object.keys(RUNNERS);
}

export async function runCode(
  language: string,
  code: string,
  stdin: string
): Promise<RunResult> {
  const runner = RUNNERS[language];
  if (!runner) {
    return {
      ok: false,
      stdout: "",
      stderr: `Linguagem não suportada: ${language}`,
      timedOut: false,
      durationMs: 0,
    };
  }

  const dir = await mkdtemp(join(tmpdir(), "tb-run-"));
  const started = Date.now();
  try {
    await writeFile(join(dir, runner.file), code, "utf8");
    const result = await new Promise<RunResult>((resolve) => {
      const child = execFile(
        runner.cmd,
        runner.args(dir),
        {
          cwd: dir,
          timeout: TIMEOUT_MS,
          killSignal: "SIGKILL",
          maxBuffer: 1024 * 1024,
          env: {
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
