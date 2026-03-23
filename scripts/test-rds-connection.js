/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

/** Keep in sync with src/lib/backend/infra/db/pg-ssl.ts */
function getPgSslOption() {
  const v = process.env.RDS_SSL?.toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') {
    return false;
  }
  if (v === 'true' || v === '1' || v === 'yes') {
    return { rejectUnauthorized: false };
  }
  const host = process.env.RDS_HOST ?? '';
  if (host.includes('.rds.amazonaws.com') || host.includes('.rds.amazonaws.com.cn')) {
    return { rejectUnauthorized: false };
  }
  return false;
}

async function main() {
  const client = new Client({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '5432', 10),
    database: process.env.RDS_DATABASE,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    ssl: getPgSslOption(),
  });

  try {
    await client.connect();
    const res = await client.query('SELECT version()');
    console.log(res.rows[0].version);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(console.error);
