import { supabase } from '../src/db/supabase';
async function run() {
  const { data, error } = await supabase.from('violations').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
run();
