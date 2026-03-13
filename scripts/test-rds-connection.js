/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
AWS.config.update({ region: 'us-east-2' });

async function main() {
  let password = 'gamma_db';

  const client = new Client({
    host: 'gamma-db-dev.c5o4mgsmkcvz.us-east-2.rds.amazonaws.com',
    port: 5432,
    database: 'master',
    user: 'postgres',
    password,
    ssl: {
      rejectUnauthorized: false,
      ca: fs
        .readFileSync(path.resolve(process.cwd(), 'certs/global-bundle.pem'))
        .toString(),
    },
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
