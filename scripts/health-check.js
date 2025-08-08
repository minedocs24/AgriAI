/**
 * Database Health Check Script per AgriAI
 * 
 * Esegue un health check completo del database e ritorna il risultato.
 * Può essere utilizzato per monitoring, CI/CD, o debugging.
 */

import dotenv from 'dotenv'
dotenv.config()

async function runHealthCheck() {
  try {
    // Import dinamico per ESM compatibility
    const { healthCheck } = await import('../src/lib/database.ts')
    
    console.log('🔍 Running AgriAI database health check...\n')
    
    const result = await healthCheck()
    
    // Colori per output console
    const colors = {
      green: '\x1b[32m',
      yellow: '\x1b[33m', 
      red: '\x1b[31m',
      blue: '\x1b[34m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    }
    
    // Status con colori
    const statusColor = result.status === 'healthy' ? colors.green :
                       result.status === 'degraded' ? colors.yellow : colors.red
    
    console.log(`${colors.bold}Database Health Status:${colors.reset} ${statusColor}${result.status.toUpperCase()}${colors.reset}`)
    console.log(`${colors.bold}Timestamp:${colors.reset} ${result.timestamp.toISOString()}`)
    console.log(`${colors.bold}Response Time:${colors.reset} ${result.responseTime}ms`)
    
    if (result.error) {
      console.log(`${colors.bold}Error:${colors.reset} ${colors.red}${result.error}${colors.reset}`)
    }
    
    console.log(`\n${colors.bold}Database Info:${colors.reset}`)
    console.log(`  Connected: ${result.database.connected ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`)
    console.log(`  Version: ${result.database.version || 'Unknown'}`)
    console.log(`  Active Connections: ${result.database.activeConnections}`)
    
    console.log(`\n${colors.bold}Test Results:${colors.reset}`)
    
    // Connection Test
    const connIcon = result.tests.connection.success ? colors.green + '✓' : colors.red + '✗'
    console.log(`  Connection: ${connIcon}${colors.reset} ${result.tests.connection.success ? 'PASS' : 'FAIL'}`)
    if (result.tests.connection.error) {
      console.log(`    Error: ${colors.red}${result.tests.connection.error}${colors.reset}`)
    }
    
    // Query Test
    const queryIcon = result.tests.query.success ? colors.green + '✓' : colors.red + '✗'
    console.log(`  Query: ${queryIcon}${colors.reset} ${result.tests.query.success ? 'PASS' : 'FAIL'}`)
    if (result.tests.query.error) {
      console.log(`    Error: ${colors.red}${result.tests.query.error}${colors.reset}`)
    }
    
    // Transaction Test
    const txIcon = result.tests.transaction.success ? colors.green + '✓' : colors.red + '✗'
    console.log(`  Transaction: ${txIcon}${colors.reset} ${result.tests.transaction.success ? 'PASS' : 'FAIL'}`)
    if (result.tests.transaction.error) {
      console.log(`    Error: ${colors.red}${result.tests.transaction.error}${colors.reset}`)
    }
    
    // Performance Test
    const perfIcon = result.tests.performance.success ? colors.green + '✓' : colors.red + '✗'
    console.log(`  Performance: ${perfIcon}${colors.reset} ${result.tests.performance.success ? 'PASS' : 'FAIL'} (${result.tests.performance.responseTime}ms)`)
    if (result.tests.performance.error) {
      console.log(`    Error: ${colors.red}${result.tests.performance.error}${colors.reset}`)
    }
    
    console.log(`\n${colors.bold}Metrics:${colors.reset}`)
    console.log(`  Uptime: ${Math.round(result.metrics.uptime / 1000)}s`)
    console.log(`  Health Status: ${statusColor}${result.metrics.healthStatus}${colors.reset}`)
    console.log(`  Last Health Check: ${result.metrics.lastHealthCheck?.toISOString() || 'Never'}`)
    console.log(`  Recent Errors: ${result.metrics.errors.length}`)
    
    if (result.metrics.errors.length > 0) {
      console.log(`\n${colors.bold}Recent Errors:${colors.reset}`)
      result.metrics.errors.slice(-3).forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.timestamp.toISOString()}] ${error.operation}: ${colors.red}${error.error}${colors.reset}`)
      })
    }
    
    // Exit code basato sul risultato
    if (result.status === 'healthy') {
      console.log(`\n${colors.green}${colors.bold}✅ Database is healthy!${colors.reset}`)
      process.exit(0)
    } else if (result.status === 'degraded') {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  Database is degraded but functional${colors.reset}`)
      process.exit(1)
    } else {
      console.log(`\n${colors.red}${colors.bold}❌ Database is unhealthy!${colors.reset}`)
      process.exit(2)
    }
    
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(3)
  }
}

// Supporto per output JSON
if (process.argv.includes('--json')) {
  runHealthCheck()
    .then(() => {})
    .catch(async (error) => {
      try {
        const { healthCheck } = await import('../src/lib/database.ts')
        const result = await healthCheck()
        console.log(JSON.stringify(result, null, 2))
      } catch (e) {
        console.log(JSON.stringify({ 
          status: 'unhealthy', 
          error: error.message,
          timestamp: new Date().toISOString()
        }, null, 2))
      }
    })
} else {
  runHealthCheck()
}

export { runHealthCheck }