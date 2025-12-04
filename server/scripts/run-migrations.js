const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { Pool } = require('pg')

// Debug: Show what's being loaded
console.log('Current working directory:', process.cwd())
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
console.log('DATABASE_URL value:', process.env.DATABASE_URL)
console.log('Loading .env from:', path.join(__dirname, '..', '.env'))

const migrationsDir = path.resolve(__dirname, '..', 'migrations')

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl || '')
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  })
  try {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      console.log(`Running migration: ${file}`)
      await pool.query(sql)
    }
    console.log('Migrations completed.')
  } finally {
    await pool.end()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
