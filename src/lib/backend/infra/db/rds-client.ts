import pg from "pg";

let poolSingleton: pg.Pool | null = null;

function getRdsConfig() {
  const host = process.env.RDS_HOST;
  const database = process.env.RDS_DATABASE;
  const user = process.env.RDS_USERNAME;
  const password = process.env.RDS_PASSWORD;

  if (!host || !database || !user || !password) {
    return null;
  }

  return {
    host,
    port: parseInt(process.env.RDS_PORT || "5432", 10),
    database,
    user,
    password,
  };
}

export function isRdsConfigured(): boolean {
  return Boolean(getRdsConfig());
}

export function getRdsPool(): pg.Pool | null {
  if (poolSingleton) {
    return poolSingleton;
  }

  const config = getRdsConfig();
  if (!config) {
    return null;
  }

  poolSingleton = new pg.Pool({
    ...config,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  return poolSingleton;
}
