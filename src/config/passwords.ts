// Hardcoded passwords for login gate
// Key: 'pfluger' for admin, or project ID (UUID) for client access
// Add new project passwords here as projects are created

export const PASSWORDS: Record<string, string> = {
  pfluger: 'Pfluger1010!',
  '9389f8f0-270d-4314-8b2b-08eb5344e0ff': 'Hornets2026!', // Flourbluff
};

export function validateLogin(
  selectedId: string,
  password: string
): { valid: boolean; mode: 'admin' | 'client'; projectId: string | null } {
  if (selectedId === 'pfluger') {
    return {
      valid: PASSWORDS.pfluger === password,
      mode: 'admin',
      projectId: null,
    };
  }

  const projectPassword = PASSWORDS[selectedId];
  return {
    valid: projectPassword !== undefined && projectPassword === password,
    mode: 'client',
    projectId: selectedId,
  };
}
