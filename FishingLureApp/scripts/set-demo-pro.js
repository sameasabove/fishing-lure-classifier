/**
 * Grant PRO to the demo account in Supabase (user_subscriptions).
 * Use this so the backend allows unlimited scans for mytackleboxapp@gmail.com
 * when testing / Apple review.
 *
 * Run from FishingLureApp folder (same as set-demo-password.js):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
 *   node scripts/set-demo-pro.js
 */

console.log('Script starting...');

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wisqqrerjbfbdiorlxtn.supabase.co';
const DEMO_USER_ID = 'c0151818-4e30-4d01-8f60-94c225977b0a';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey || serviceRoleKey.includes('paste_your') || serviceRoleKey.length < 20) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY (Supabase Dashboard → Settings → API → service_role).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, serviceRoleKey);

async function main() {
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(
      {
        user_id: DEMO_USER_ID,
        is_pro: true,
        subscription_type: 'yearly',
        product_identifier: 'yearly_pro',
        expires_at: null,
        will_renew: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  console.log('Demo account (mytackleboxapp@gmail.com) is now PRO in Supabase.');
  console.log('Backend will allow unlimited scans for this user.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
