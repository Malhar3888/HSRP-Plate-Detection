import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { mockApis } from './src/db/mockDb';
import { v4 as uuidv4 } from 'uuid';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
        env[key.trim()] = value.join('=').trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map old string IDs to UUIDs
const idMap = new Map();
function getUuid(oldId) {
    if (!oldId) return null;
    if (!idMap.has(oldId)) idMap.set(oldId, uuidv4());
    return idMap.get(oldId);
}

async function seed() {
    console.log("Extracting all mock data...");
    const rawCameras = await mockApis.getAllCameras();
    const rawVehicles = await mockApis.getAllVehicles();
    const rawViolations = await mockApis.getAllViolations();
    
    // Clean and UUID-ify Cameras
    const cameras = rawCameras.map(c => ({
        ...c,
        id: getUuid(c.id)
    }));
    
    // Clean and UUID-ify Vehicles
    const vehicles = rawVehicles.map(v => ({
        ...v,
        id: getUuid(v.id)
    }));
    
    // Clean and UUID-ify Violations
    const violations = rawViolations.map(v => {
        const cleaned = {
            ...v,
            id: getUuid(v.id),
            camera_id: getUuid(v.camera_id),
            vehicle_id: getUuid(v.vehicle_id)
        };
        // Remove relation objects which are not real columns
        delete cleaned.camera;
        delete cleaned.vehicle;
        return cleaned;
    });
    
    console.log("Seeding cameras...");
    const { error: camErr } = await supabase.from('cameras').upsert(cameras);
    if (camErr) console.error("Camera error:", camErr);

    console.log("Seeding vehicles...");
    const { error: vehErr } = await supabase.from('vehicles').upsert(vehicles);
    if (vehErr) console.error("Vehicle error:", vehErr);
    
    console.log("Seeding violations...");
    const { error: violErr } = await supabase.from('violations').upsert(violations);
    if (violErr) console.error("Violation error:", violErr);

    console.log("✅ Supabase successfully seeded with old mock data!");
}

seed();
