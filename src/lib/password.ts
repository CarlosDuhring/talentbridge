export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "Pelo menos 8 caracteres", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Um número", test: (p) => /[0-9]/.test(p) },
  {
    id: "symbol",
    label: "Um caractere especial (!@#$%...)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export function validateStrongPassword(password: string): string | null {
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password));
  if (failed.length === 0) return null;
  return `A senha precisa ter: ${failed.map((r) => r.label.toLowerCase()).join(", ")}.`;
}
