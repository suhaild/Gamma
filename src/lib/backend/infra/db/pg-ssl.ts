/**
 * AWS RDS Postgres requires TLS; local/dev Postgres often has SSL off.
 * - Default: SSL on for hosts matching `*.rds.amazonaws.com` (and .cn).
 * - Override: `RDS_SSL=true` / `false` / `1` / `0` / `yes` / `no`.
 */
export function getPgSslOption():
  | false
  | { rejectUnauthorized: boolean } {
  const v = process.env.RDS_SSL?.toLowerCase();
  if (v === "false" || v === "0" || v === "no") {
    return false;
  }
  if (v === "true" || v === "1" || v === "yes") {
    return { rejectUnauthorized: false };
  }
  const host = process.env.RDS_HOST ?? "";
  if (
    host.includes(".rds.amazonaws.com") ||
    host.includes(".rds.amazonaws.com.cn")
  ) {
    return { rejectUnauthorized: false };
  }
  return false;
}
