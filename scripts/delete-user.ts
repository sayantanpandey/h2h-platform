import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run db:delete-user -- email@example.com');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: user, error: findErr } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('email', email)
    .maybeSingle();

  if (findErr) {
    console.error('Lookup failed:', findErr.message);
    process.exit(1);
  }

  if (!user) {
    console.log(`No user found for ${email}`);
    return;
  }

  console.log('Deleting:', user);

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (doctor?.id) {
    await supabase.from('doctor_services').delete().eq('doctor_id', doctor.id);
    await supabase.from('doctor_availability').delete().eq('doctor_id', doctor.id);
    await supabase.from('doctor_slot_types').delete().eq('doctor_id', doctor.id);
    const { error: docErr } = await supabase.from('doctors').delete().eq('id', doctor.id);
    if (docErr) console.warn('Doctor delete:', docErr.message);
    else console.log('Removed doctor profile');
  }

  const { error: userErr } = await supabase.from('users').delete().eq('id', user.id);
  if (userErr) {
    console.error('users table delete failed:', userErr.message);
    process.exit(1);
  }
  console.log('Removed from users table');

  const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
  if (authErr) console.warn('Auth delete (may already be gone):', authErr.message);
  else console.log('Removed from Supabase Auth');

  console.log(`Done — deleted ${email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
