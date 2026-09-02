export const MIN_PASSWORD_LENGTH = 8;

export function meetsPasswordPolicy(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}
