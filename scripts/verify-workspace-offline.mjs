import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { workspaceExitCode } from './workspace-exit-code.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-workspace-offline-'));
const tests = ['tests/agent/test_ssl_verify.py', 'tests/agent/test_redact.py', 'tests/test_retry_utils.py'];
for (const name of tests) if (!fs.existsSync(path.join(root, name))) throw Error(`Missing reviewed offline test ${name}`);
const env = { ...process.env, TMP: temp, TEMP: temp, TMPDIR: temp };
for (const key of Object.keys(env)) if (/KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|HERMES_SESSION|HERMES_PROFILE/.test(key)) delete env[key];
const bash = process.platform === 'win32' ? (env.HERMES_VERIFY_BASH || 'C:/Program Files/Git/bin/bash.exe') : 'bash';
try {
  const script = 'export TEMP="$1" TMP="$1"; shift; exec bash scripts/run_tests.sh "$@"';
  const result = spawnSync(bash, ['-c', script, 'offline-workspace', temp.replaceAll('\\', '/'), '--file-retries', '0', '-j', '2', ...tests, '-q', '-p', 'workspace_offline_guard'], { cwd: root, env, windowsHide: true, stdio: 'inherit', timeout: 600000 });
  process.exitCode = workspaceExitCode(result);
} finally {
  if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw Error('Temporary cleanup escaped owner');
  fs.rmSync(temp, { recursive: true, force: true });
}
