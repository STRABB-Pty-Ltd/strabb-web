// Fixed reference date shared by mock data modules so SSR and client
// evaluations produce identical output (no hydration mismatch from new Date()).
export const REFERENCE_NOW = new Date("2026-04-14T00:00:00Z");
