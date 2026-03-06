/**
 * One-off: set password for demo user via Supabase Admin API (no email sent).
 * Run from FishingLureApp folder:
 *   node scripts/set-demo-password.js
 * Set env first (PowerShell):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
 * Get key: Supabase Dashboard → Settings → API → service_role (secret)
 *
 * Default sets mytackleboxapp@gmail.com (Demo Test) to password "Test1234".
 */

console.log('Script starting...');

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wisqqrerjbfbdiorlxtn.supabase.co';
const DEMO_USER_ID = 'c0151818-4e30-4d01-8f60-94c225977b0a';
const NEW_PASSWORD = process.env.DEMO_PASSWORD || 'Test1234';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey || serviceRoleKey.includes('paste_your') || serviceRoleKey.length < 20) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY to your real key (Supabase Dashboard → Settings → API → service_role).');
  console.error('Example: $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."');
  process.exit(1);
}
console.log('Setting demo password...');

const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data, error } = await supabase.auth.admin.updateUserById(DEMO_USER_ID, {
    password: NEW_PASSWORD,
  });
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  console.log('Password updated for demo user (mytackleboxapp@gmail.com).');
  console.log('Sign in with that email and password:', NEW_PASSWORD);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
