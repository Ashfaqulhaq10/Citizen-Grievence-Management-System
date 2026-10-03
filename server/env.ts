export function isDbConfigured() {
  return !!(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);
}

export function isDemoMode() {
  // Demo mode if explicitly set or DB is not configured
  return process.env.DEMO_MODE === "1" || !isDbConfigured();
}
