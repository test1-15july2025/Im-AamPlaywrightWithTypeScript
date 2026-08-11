
export function generateRandomEmail(): string {
  const ts = Date.now();
  return `testuser_${ts}@example.com`;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}