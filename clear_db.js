import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Clearing DB data...");
    
    const res4 = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Payments cleared:", res4.error ? res4.error : "Success");
    
    const res3 = await supabase.from('violations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Violations cleared:", res3.error ? res3.error : "Success");

    const res2 = await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Vehicles cleared:", res2.error ? res2.error : "Success");
    
    const res1 = await supabase.from('cameras').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Cameras cleared:", res1.error ? res1.error : "Success");
    
    console.log("Done!");
}
run();
