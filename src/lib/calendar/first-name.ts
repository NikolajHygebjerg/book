export function extractFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Gæst";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}
