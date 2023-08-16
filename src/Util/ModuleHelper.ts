export function isModuleExists(name: string): boolean {
  try {
    require.resolve(name);
    return true;
  } catch (error) {
    return false;
  }
}
