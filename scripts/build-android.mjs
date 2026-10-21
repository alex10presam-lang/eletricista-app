import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

function run(command, args, cwd = process.cwd(), env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (!existsSync(resolve('android/gradlew'))) {
  console.error('Projeto Android ausente. Execute npx cap add android antes de compilar.');
  process.exit(1);
}
run('npm', ['run', 'build']);
run('npx', ['cap', 'sync', 'android']);
const buildEnv = { ...process.env };
const gradleArgs = ['assembleDebug', 'lintDebug', '--no-daemon'];
if (process.platform === 'win32') {
  const sockets = resolve('.gradle/java-sockets');
  mkdirSync(sockets, { recursive: true });
  buildEnv.JAVA_TOOL_OPTIONS =
    `${buildEnv.JAVA_TOOL_OPTIONS ?? ''} -Djdk.net.unixdomain.tmpdir="${sockets}"`.trim();
  if (/[^\x00-\x7F]/.test(process.cwd())) gradleArgs.push('-Pandroid.overridePathCheck=true');
}
run(
  process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
  gradleArgs,
  resolve('android'),
  buildEnv,
);
mkdirSync('artifacts', { recursive: true });
const file = resolve('artifacts/EletroPro-1.0.0-debug.apk');
copyFileSync('android/app/build/outputs/apk/debug/app-debug.apk', file);
console.log(`APK de testes: ${file}`);
console.log(`SHA-256: ${createHash('sha256').update(readFileSync(file)).digest('hex')}`);
