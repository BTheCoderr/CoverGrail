export function isMockGradeEnabled(): boolean {
  const value = (process.env.MOCK_GRADE ?? "").trim().toLowerCase();
  return value === "1" || value === "true";
}
