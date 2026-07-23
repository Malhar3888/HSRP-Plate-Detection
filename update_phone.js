import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  await supabase.from('vehicles').update({ owner_phone: '+917796380995' }).neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('settings').update({ sms_notification_number: '7796380995' }).eq('id', 'default');
  console.log('Done!');
}
run();
