/**
 * Migration Script per AgriAI Database
 * 
 * Gestisce migration incrementali del database con:
 * - Backup automatico prima della migration
 * - Rollback in caso di errore
 * - Logging dettagliato
 * - Verifica integrità post-migration
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const BACKUP_DIR = path.join(__dirname, '../backups')
const LOG_FILE = path.join(__dirname, '../logs/migration.log')

// Assicura che le directory esistano
function ensureDirectories() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
  
  const logDir = path.dirname(LOG_FILE)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
}

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${level}: ${message}\n`
  
  console.log(logMessage.trim())
  
  if (fs.existsSync(path.dirname(LOG_FILE))) {
    fs.appendFileSync(LOG_FILE, logMessage)
  }
}

// Crea backup del database
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`)
  
  try {
    log('Creating database backup...')
    
    // Estrai parametri di connessione dall'URL del database
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found in environment variables')
    }
    
    const url = new URL(dbUrl)
    const host = url.hostname
    const port = url.port || 5432
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password
    
    // Comando pg_dump
    const pgDumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupFile}"`
    
    execSync(pgDumpCmd, { 
      stdio: 'pipe',
      env: { ...process.env, PGPASSWORD: password }
    })
    
    log(`✅ Backup created successfully: ${backupFile}`)
    return backupFile
  } catch (error) {
    log(`❌ Backup creation failed: ${error.message}`, 'ERROR')
    throw error
  }
}

// Esegue migration Prisma
async function runMigration(migrationName) {
  return new Promise((resolve, reject) => {
    log(`🚀 Starting migration: ${migrationName || 'auto-generated'}`)
    
    const args = ['prisma', 'migrate', 'deploy']
    if (migrationName) {
      args.push('--name', migrationName)
    }
    
    const child = spawn('npx', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    })
    
    let stdout = ''
    let stderr = ''
    
    child.stdout.on('data', (data) => {
      stdout += data.toString()
      log(`STDOUT: ${data.toString().trim()}`)
    })
    
    child.stderr.on('data', (data) => {
      stderr += data.toString()
      log(`STDERR: ${data.toString().trim()}`, 'WARN')
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        log('✅ Migration completed successfully')
        resolve({ success: true, stdout, stderr })
      } else {
        log(`❌ Migration failed with exit code ${code}`, 'ERROR')
        reject(new Error(`Migration failed: ${stderr || stdout}`))
      }
    })
    
    child.on('error', (error) => {
      log(`❌ Migration process error: ${error.message}`, 'ERROR')
      reject(error)
    })
  })
}

// Verifica integrità database
async function verifyDatabaseIntegrity() {
  return new Promise((resolve, reject) => {
    log('🔍 Verifying database integrity...')
    
    const child = spawn('npx', ['prisma', 'validate'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    })
    
    let stdout = ''
    let stderr = ''
    
    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        log('✅ Database schema is valid')
        resolve(true)
      } else {
        log(`❌ Database schema validation failed: ${stderr}`, 'ERROR')
        reject(new Error(`Schema validation failed: ${stderr || stdout}`))
      }
    })
  })
}

// Rollback in caso di errore
function rollbackDatabase(backupFile) {
  try {
    log(`🔄 Rolling back database from backup: ${backupFile}`)
    
    const dbUrl = process.env.DATABASE_URL
    const url = new URL(dbUrl)
    const host = url.hostname
    const port = url.port || 5432
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password
    
    // Prima droppa e ricrea il database
    const dropCmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d postgres -c "DROP DATABASE IF EXISTS ${database}"`
    const createCmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d postgres -c "CREATE DATABASE ${database}"`
    const restoreCmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupFile}"`
    
    execSync(dropCmd, { stdio: 'pipe' })
    execSync(createCmd, { stdio: 'pipe' })
    execSync(restoreCmd, { stdio: 'pipe' })
    
    log('✅ Database rollback completed successfully')
  } catch (error) {
    log(`❌ Rollback failed: ${error.message}`, 'ERROR')
    throw error
  }
}

// Funzione principale
async function migrate() {
  const migrationName = process.argv[2]
  let backupFile = null
  
  try {
    ensureDirectories()
    log('🌱 Starting AgriAI database migration process')
    
    // Crea backup
    backupFile = createBackup()
    
    // Esegui migration
    await runMigration(migrationName)
    
    // Verifica integrità
    await verifyDatabaseIntegrity()
    
    log('🎉 Migration process completed successfully!')
    
    // Cleanup vecchi backup (mantieni solo ultimi 10)
    cleanupOldBackups()
    
  } catch (error) {
    log(`❌ Migration process failed: ${error.message}`, 'ERROR')
    
    if (backupFile && fs.existsSync(backupFile)) {
      try {
        log('⚠️  Attempting database rollback...')
        rollbackDatabase(backupFile)
        log('✅ Rollback completed successfully')
      } catch (rollbackError) {
        log(`❌ Rollback failed: ${rollbackError.message}`, 'ERROR')
      }
    }
    
    process.exit(1)
  }
}

// Cleanup vecchi backup
function cleanupOldBackups() {
  try {
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stat: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
    
    // Mantieni solo i più recenti 10 backup
    const toDelete = backupFiles.slice(10)
    
    toDelete.forEach(backup => {
      fs.unlinkSync(backup.path)
      log(`🗑️  Deleted old backup: ${backup.name}`)
    })
    
    if (toDelete.length > 0) {
      log(`🧹 Cleaned up ${toDelete.length} old backup(s)`)
    }
  } catch (error) {
    log(`⚠️  Backup cleanup warning: ${error.message}`, 'WARN')
  }
}

// Esegui migration se script chiamato direttamente
if (require.main === module) {
  migrate()
}

module.exports = {
  migrate,
  createBackup,
  rollbackDatabase,
  verifyDatabaseIntegrity
}