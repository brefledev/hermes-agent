export function workspaceExitCode(result) {
  if (result.error) throw result.error;
  if (result.signal || !Number.isInteger(result.status)) {
    throw Error(`Offline verification terminated without an exit code: ${result.signal || 'unknown termination'}`);
  }
  return result.status;
}
