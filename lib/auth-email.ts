/**
 * Supabase Auth is email-based. To give the person a simple Arabic-friendly
 * "username" login (as requested), we map each username to a deterministic
 * synthetic email under a private, non-deliverable domain. Nothing is ever
 * emailed to this address — email confirmation must stay disabled in
 * Supabase Auth settings (see README).
 */
const USERNAME_DOMAIN = "khairatyemen.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;
}
