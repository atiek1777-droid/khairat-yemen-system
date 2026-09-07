/** Generates a readable random temporary password, e.g. "kyf-73921". */
export function generateTempPassword(): string {
  const n = Math.floor(10000 + Math.random() * 89999);
  return `kyf-${n}`;
}
