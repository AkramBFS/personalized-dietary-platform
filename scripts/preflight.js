/**
 * scripts/preflight.js
 * Preflight health check & bootstrap script for Nutriplatform dev stack.
 *
 * Checks:
 *   1. PostgreSQL on port 5432 (clear error if unreachable)
 *   2. Redis on port 6379 (skips if listening; auto-starts Docker container if offline)
 *   3. Synchronous database migrations (prevents startup race conditions)
 *   4. Demo accounts and fixture seeding (client, nutritionist, admin)
 *   5. Outputs an aggregated readiness banner with URLs and credentials
 */

const net = require('net');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend', 'nutriplatform');

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(msg) {
  console.log(msg);
}

function logSuccess(msg) {
  console.log(`${c.green} [✓] ${msg}${c.reset}`);
}

function logInfo(msg) {
  console.log(`${c.cyan} [*] ${msg}${c.reset}`);
}

function logWarn(msg) {
  console.log(`${c.yellow} [!] ${msg}${c.reset}`);
}

function logErrorBox(title, lines) {
  console.error(`\n${c.red}${c.bold}====================================================================${c.reset}`);
  console.error(`${c.red}${c.bold} [PREFLIGHT ERROR] ${title}${c.reset}`);
  console.error(`${c.red}${c.bold}====================================================================${c.reset}`);
  lines.forEach((l) => console.error(l));
  console.error(`${c.red}${c.bold}====================================================================${c.reset}\n`);
}

/**
 * Tests if a TCP port is accepting connections.
 */
function isPortListening(port, host = '127.0.0.1', timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let hasResolved = false;

    const cleanup = (result) => {
      if (!hasResolved) {
        hasResolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => cleanup(true));
    socket.once('timeout', () => cleanup(false));
    socket.once('error', () => cleanup(false));

    try {
      socket.connect(port, host);
    } catch {
      cleanup(false);
    }
  });
}

/**
 * Checks if the Docker daemon is responding.
 */
function isDockerRunning() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures Redis is running on port 6379.
 */
async function ensureRedis() {
  const isUp = await isPortListening(6379);
  if (isUp) {
    logSuccess('Redis is already active on port 6379 (skipping start).');
    return;
  }

  logWarn('Redis is not listening on port 6379. Checking Docker...');

  if (!isDockerRunning()) {
    logErrorBox('Redis is down and Docker Desktop is not running!', [
      `${c.yellow}Why this matters:${c.reset}`,
      ' Nutriplatform enforces fail-closed rate-limiting (settings.py: IGNORE_EXCEPTIONS: False).',
      ' Without Redis, throttled API endpoints and the AI worker queue will fail immediately.\n',
      `${c.yellow}Action required:${c.reset}`,
      ` 1. Start ${c.bold}Docker Desktop${c.reset} to allow automatic Redis container startup, OR`,
      ` 2. Start a local Redis instance on port 6379 natively or in WSL.`,
    ]);
    process.exit(1);
  }

  const containerName = 'nutriplatform_dev_redis';
  try {
    let existingStatus = '';
    try {
      existingStatus = execSync(
        `docker ps -a --filter "name=^/${containerName}$" --format "{{.Status}}"`,
        { encoding: 'utf8' }
      ).trim();
    } catch {
      existingStatus = '';
    }

    if (existingStatus) {
      logInfo(`Restarting existing container '${containerName}'...`);
      execSync(`docker start ${containerName}`, { stdio: 'ignore' });
    } else {
      logInfo(`Spawning fresh Redis container '${containerName}' on port 6379...`);
      execSync(`docker run -d --name ${containerName} -p 6379:6379 redis:7-alpine`, {
        stdio: 'ignore',
      });
    }
  } catch (err) {
    logErrorBox(`Failed to start Redis container '${containerName}'`, [
      `Docker command error: ${err.message}`,
      'Check if port 6379 is occupied or if Docker encountered a permission error.',
    ]);
    process.exit(1);
  }

  // Poll port 6379 for up to 10 seconds
  logInfo('Waiting for Redis to accept connections...');
  let ready = false;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isPortListening(6379)) {
      ready = true;
      break;
    }
  }

  if (!ready) {
    logErrorBox('Redis container started but port 6379 did not respond', [
      'The Redis container started, but port 6379 remained unreachable after 10 seconds.',
    ]);
    process.exit(1);
  }

  logSuccess(`Redis is active on port 6379 (container: ${containerName}).`);
}

/**
 * Checks PostgreSQL connectivity.
 */
async function ensurePostgres() {
  const isUp = await isPortListening(5432);
  if (!isUp) {
    logErrorBox('PostgreSQL is NOT reachable on 127.0.0.1:5432!', [
      `${c.yellow}Remedies:${c.reset}`,
      ' 1. If running PostgreSQL as a Windows service, start it in PowerShell:',
      `    ${c.cyan}Start-Service postgresql-x64-18${c.reset}`,
      ' 2. If using Docker, start your database container:',
      `    ${c.cyan}docker start nutriplatform_postgres${c.reset}`,
      ' 3. Verify database configuration in backend/nutriplatform/.env',
    ]);
    process.exit(1);
  }
  logSuccess('PostgreSQL is listening on port 5432.');
}

/**
 * Runs database migrations synchronously before servers launch.
 */
function runMigrations() {
  logInfo('Verifying and applying database migrations (python manage.py migrate)...');
  try {
    execSync('python manage.py migrate --noinput', {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
    });
    logSuccess('Database migrations verified and up to date.');
  } catch (err) {
    logErrorBox('Database migration failed!', [
      'Failed to apply Django migrations.',
      'Check database connectivity, user credentials, and permissions in backend/nutriplatform/.env.',
    ]);
    process.exit(1);
  }
}

/**
 * Seeds demo accounts and fixtures for demo readiness.
 */
function seedDemoData() {
  logInfo('Ensuring demo accounts and test fixtures exist (seed_demo_accounts --premium)...');
  try {
    execSync('python manage.py seed_demo_accounts --premium', {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
    });
    logSuccess('Demo accounts & sample data ready (Client, Nutritionist, Admin).');
  } catch (err) {
    logWarn(`Seeding notice: ${err.message} (continuing stack startup)...`);
  }
}

/**
 * Prints the ready banner with URLs and demo credentials.
 */
function printBanner() {
  log('');
  log(`${c.green}${c.bold}====================================================================${c.reset}`);
  log(`${c.green}${c.bold} 🍎 NUTRIPLATFORM DEV STACK READY — BOOTING CONCURRENT SERVICES    ${c.reset}`);
  log(`${c.green}${c.bold}====================================================================${c.reset}`);
  log(`  ${c.bold}🌐 Frontend:${c.reset}    ${c.cyan}http://localhost:3000${c.reset}`);
  log(`  ${c.bold}⚙️  Backend API:${c.reset} ${c.cyan}http://127.0.0.1:8000${c.reset}  (Docs: ${c.cyan}http://127.0.0.1:8000/api/v1/${c.reset})`);
  log(`  ${c.bold}🧠 AI Service:${c.reset}  ${c.cyan}http://127.0.0.1:8001${c.reset}  (Health: ${c.cyan}http://127.0.0.1:8001/health${c.reset})`);
  log(`  ${c.bold}📦 Infra:${c.reset}       PostgreSQL 5432 | Redis 6379`);
  log(`  ${c.bold}🔑 Demo Logins:${c.reset} (Password: ${c.bold}DemoPassword123!${c.reset})`);
  log(`     • Client:       ${c.yellow}demo_client@nutriplatform.local${c.reset} (Premium active)`);
  log(`     • Nutritionist: ${c.yellow}demo_nutritionist@nutriplatform.local${c.reset} (Profile approved)`);
  log(`     • Admin:        ${c.yellow}demo_admin@nutriplatform.local${c.reset} (High admin)`);
  log(`${c.green}${c.bold}====================================================================${c.reset}\n`);
}

async function main() {
  log(`\n${c.bold}${c.cyan}--- [Phase 1/2] Preflight Infrastructure & Migrations ---${c.reset}`);
  await ensurePostgres();
  await ensureRedis();
  runMigrations();
  seedDemoData();
  printBanner();
}

main().catch((err) => {
  logErrorBox('Unexpected preflight failure', [err.stack || err.message]);
  process.exit(1);
});
