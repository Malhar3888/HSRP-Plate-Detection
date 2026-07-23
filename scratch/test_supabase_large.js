import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tnwntyjppqndtppptpde.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRud250eWpwcHFuZHRwcHB0cGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2ODEwMTQsImV4cCI6MjEwMDI1NzAxNH0.Qa1avM31mQLzURp_v55N2r83WfV6GOQpnUrXMqOwx_8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const largeImage = 'data:image/jpeg;base64,' + 'A'.repeat(800000); // ~800KB payload

  const payload = {
    plate_number: 'TEST_LARGE',
    camera_id: null,
    violation_type: 'no_hsrp',
    violation_date: new Date().toISOString(),
    location: 'Live Camera Feed',
    image_url: largeImage,
    fine_amount: 500,
    description: `Test description`,
    vehicle_id: null
  };

  console.log("Inserting large payload...");
  const { data, error } = await supabase
    .from('violations')
    .insert(payload)
    .select()
    .maybeSingle();

  console.log("Error:", error);
}

test();
