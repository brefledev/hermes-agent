import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { workspaceExitCode } from './workspace-exit-code.mjs';

test('successful and failed subprocess exits retain their status', () => {
  for (const status of [0, 7]) {
    assert.equal(workspaceExitCode(spawnSync(process.execPath, ['-e', `process.exit(${status})`])), status);
  }
});

test('a terminated subprocess cannot become a successful verification', async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore', windowsHide: true });
  const closed = once(child, 'close');
  try {
    await once(child, 'spawn');
    child.kill('SIGTERM');
    const [status, signal] = await closed;
    assert.ok(signal);
    assert.throws(() => workspaceExitCode({ status, signal }), /terminated without an exit code/);
    console.log(JSON.stringify({ status, signal, historicalExpressionExit: status || 0, repairedOutcome: 'refused' }));
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await closed;
  }
});

test('launch errors remain failures', () => {
  assert.throws(() => workspaceExitCode(spawnSync(process.execPath + '-missing', [])), /ENOENT/);
});
