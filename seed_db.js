import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// If you want to use this script, run: npm run seed or node seed_db.js
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Seeding old DB data...");
    
    // Extracted some of the sample data from mockDb.ts
    const cameras = [
        { id: 'cam-1', name: 'NH-4 Highway Cam East', location: 'Highway NH-4, km 12', status: 'online' },
        { id: 'cam-2', name: 'Sector 5 Main Crossing', location: 'Sector 5 & 12 Avenue', status: 'online' }
    ];

    const vehicles = [
        { id: 'veh-1', plate_number: 'MH12AB1234', owner_name: 'Rahul Sharma', owner_contact: '+919876543210', make: 'Honda', model: 'City', year: 2020, color: 'White', is_hsrp_compliant: true },
        { id: 'veh-2', plate_number: 'KA05CD5678', owner_name: 'Priya Patel', owner_contact: '+919876543211', make: 'Hyundai', model: 'i20', year: 2018, color: 'Red', is_hsrp_compliant: false }
    ];
    
    await supabase.from('cameras').upsert(cameras);
    await supabase.from('vehicles').upsert(vehicles);
    
    console.log("Done seeding old database data!");
}

run();
