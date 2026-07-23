import { supabase } from './supabase';
import { mockApis } from './mockDb';
export { mockApis };
import type {
  Profile,
  Camera,
  Vehicle,
  Violation,
  Payment,
  ActivityLog,
  DashboardStats,
  ViolationsByType,
  ViolationsByDate,
  CameraActivity,
  ViolationFilters,
  VehicleFilters,
  ViolationFormData,
  VehicleFormData,
  CameraFormData,
  Settings,
  SmsAttempt,
} from '@/types/types';

const runWithFallback = async <T>(supabaseCall: () => Promise<T>, mockCall: () => Promise<T>): Promise<T> => {
  return await supabaseCall();
};

// ============= Profiles =============
export const getProfile = async (userId: string): Promise<Profile | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.getProfile(userId)
  );
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    () => mockApis.getAllProfiles()
  );
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.updateProfile(userId, updates)
  );
};

// ============= Cameras =============
export const getAllCameras = async (): Promise<Camera[]> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    () => mockApis.getAllCameras()
  );
};

export const getCamera = async (id: string): Promise<Camera | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.getCamera(id)
  );
};

export const createCamera = async (camera: CameraFormData): Promise<Camera | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('cameras')
        .insert(camera)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.createCamera(camera)
  );
};

export const updateCamera = async (id: string, updates: Partial<CameraFormData>): Promise<Camera | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('cameras')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.updateCamera(id, updates)
  );
};

export const deleteCamera = async (id: string): Promise<void> => {
  return runWithFallback(
    async () => {
      const { error } = await supabase
        .from('cameras')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    () => mockApis.deleteCamera(id)
  );
};

// ============= Vehicles =============
export const getAllVehicles = async (filters?: VehicleFilters): Promise<Vehicle[]> => {
  return runWithFallback(
    async () => {
      let query = supabase.from('vehicles').select('*');
      if (filters?.hasHsrp !== undefined) {
        query = query.eq('has_hsrp', filters.hasHsrp);
      }
      if (filters?.vehicleType) {
        query = query.eq('vehicle_type', filters.vehicleType);
      }
      if (filters?.plateNumber) {
        query = query.ilike('plate_number', `%${filters.plateNumber}%`);
      }
      if (filters?.expiredDocs) {
        const today = new Date().toISOString().split('T')[0];
        query = query.or(`rc_expiry.lt.${today},insurance_expiry.lt.${today},puc_expiry.lt.${today}`);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    () => mockApis.getAllVehicles(filters)
  );
};

export const getVehicle = async (id: string): Promise<Vehicle | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.getVehicle(id)
  );
};

export const getVehicleByPlate = async (plateNumber: string): Promise<Vehicle | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('plate_number', plateNumber)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.getVehicleByPlate(plateNumber)
  );
};

export const createVehicle = async (vehicle: VehicleFormData): Promise<Vehicle | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.createVehicle(vehicle)
  );
};

export const updateVehicle = async (id: string, updates: Partial<VehicleFormData>): Promise<Vehicle | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.updateVehicle(id, updates)
  );
};

export const deleteVehicle = async (id: string): Promise<void> => {
  return runWithFallback(
    async () => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    () => mockApis.deleteVehicle(id)
  );
};

// ============= Violations =============
export const getAllViolations = async (filters?: ViolationFilters): Promise<Violation[]> => {
  return runWithFallback(
    async () => {
      let query = supabase
        .from('violations')
        .select(`
          id, plate_number, vehicle_id, camera_id, violation_type, violation_date, location, status, fine_amount, created_at, sms_status, sms_recipient, sms_error,
          vehicle:vehicles!violations_vehicle_id_fkey(*),
          camera:cameras!violations_camera_id_fkey(*)
        `);
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('violation_type', filters.type);
      }
      if (filters?.cameraId) {
        query = query.eq('camera_id', filters.cameraId);
      }
      if (filters?.dateFrom) {
        query = query.gte('violation_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('violation_date', filters.dateTo);
      }
      if (filters?.plateNumber) {
        query = query.ilike('plate_number', `%${filters.plateNumber}%`);
      }
      query = query.order('violation_date', { ascending: false }).limit(20);
      const { data, error } = await query;
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    () => mockApis.getAllViolations(filters)
  );
};

export const getViolationImage = async (id: string): Promise<string | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('violations')
        .select('image_url')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data?.image_url || null;
    },
    async () => null
  );
};

export const getViolation = async (id: string): Promise<Violation | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('violations')
        .select(`
          *,
          vehicle:vehicles!violations_vehicle_id_fkey(*),
          camera:cameras!violations_camera_id_fkey(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.getViolation(id)
  );
};

export const createViolation = async (violation: ViolationFormData): Promise<Violation | null> => {
  return runWithFallback(
    async () => {
      const vehicle = await getVehicleByPlate(violation.plate_number);
      const { data, error } = await supabase
        .from('violations')
        .insert({
          ...violation,
          vehicle_id: vehicle?.id || null,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.createViolation(violation)
  );
};

export const updateViolation = async (id: string, updates: Partial<Violation>): Promise<Violation | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('violations')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.updateViolation(id, updates)
  );
};

export const deleteViolation = async (id: string): Promise<void> => {
  return runWithFallback(
    async () => {
      const { error } = await supabase
        .from('violations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    () => mockApis.deleteViolation(id)
  );
};

// ============= Payments =============
export const getAllPayments = async (): Promise<Payment[]> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          violation:violations!payments_violation_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    () => mockApis.getAllPayments()
  );
};

export const getPaymentsByViolation = async (violationId: string): Promise<Payment[]> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('violation_id', violationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    () => mockApis.getPaymentsByViolation(violationId)
  );
};

export const createPayment = async (payment: Partial<Payment>): Promise<Payment | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.createPayment(payment)
  );
};

export const updatePayment = async (id: string, updates: Partial<Payment>): Promise<Payment | null> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    () => mockApis.updatePayment(id, updates)
  );
};

// ============= Activity Logs =============
export const getActivityLogs = async (limit = 50): Promise<ActivityLog[]> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:profiles!activity_logs_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    () => mockApis.getActivityLogs(limit)
  );
};

export const createActivityLog = async (log: Partial<ActivityLog>): Promise<void> => {
  return runWithFallback(
    async () => {
      const { error } = await supabase
        .from('activity_logs')
        .insert(log);
      if (error) throw error;
    },
    () => mockApis.createActivityLog(log)
  );
};

// ============= Settings & SMS =============
export const getSettings = async (): Promise<Settings> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Settings not found");
      return data as Settings;
    },
    () => mockApis.getSettings()
  );
};

export const updateSettings = async (settings: Settings): Promise<Settings> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ ...settings, id: 'global' })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Settings;
    },
    () => mockApis.updateSettings(settings)
  );
};

export const createSmsAttempt = async (attempt: Omit<SmsAttempt, 'id'>): Promise<SmsAttempt> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('sms_attempts')
        .insert(attempt)
        .select()
        .maybeSingle();
      if (error) {
        console.error("Supabase createSmsAttempt error:", error);
        throw error;
      }
      return data as SmsAttempt;
    },
    () => mockApis.createSmsAttempt(attempt)
  );
};

export const getSmsStats = async (): Promise<{ sent: number, pending: number }> => {
  return runWithFallback(
    async () => {
      const { count: sent } = await supabase
        .from('sms_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');
        
      const { count: pending } = await supabase
        .from('sms_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      return { sent: sent || 0, pending: pending || 0 };
    },
    async () => {
      // Mock logic: count from mock DB (assuming we don't have this in mockDb.ts, just return 0)
      return { sent: 0, pending: 0 };
    }
  );
};

// ============= Statistics =============
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return runWithFallback(
    async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count: totalViolations } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true });
      const { count: pendingViolations } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      const { count: todayViolations } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .gte('violation_date', today);
      const { count: hsrpViolations } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .eq('violation_type', 'no_hsrp');
      const { data: finesData } = await supabase
        .from('violations')
        .select('fine_amount');
      const totalFines = finesData?.reduce((sum, v) => sum + (Number(v.fine_amount) || 0), 0) || 0;
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');
      const collectedFines = paymentsData?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const { count: totalCameras } = await supabase
        .from('cameras')
        .select('*', { count: 'exact', head: true });
      const { count: activeCameras } = await supabase
        .from('cameras')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'online');
      return {
        totalViolations: totalViolations || 0,
        pendingViolations: pendingViolations || 0,
        totalFines,
        collectedFines,
        activeCameras: activeCameras || 0,
        totalCameras: totalCameras || 0,
        todayViolations: todayViolations || 0,
        hsrpViolations: hsrpViolations || 0,
      };
    },
    () => mockApis.getDashboardStats()
  );
};

export const getViolationsByType = async (): Promise<ViolationsByType[]> => {
  return runWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('violations')
        .select('violation_type, fine_amount');
      if (error) throw error;
      const grouped = (data || []).reduce((acc, v) => {
        const type = v.violation_type;
        if (!acc[type]) {
          acc[type] = { type, count: 0, amount: 0 };
        }
        acc[type].count++;
        acc[type].amount += Number(v.fine_amount) || 0;
        return acc;
      }, {} as Record<string, ViolationsByType>);
      return Object.values(grouped);
    },
    () => mockApis.getViolationsByType()
  );
};

export const getViolationsByDate = async (days = 7): Promise<ViolationsByDate[]> => {
  return runWithFallback(
    async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase
        .from('violations')
        .select('violation_date')
        .gte('violation_date', startDate.toISOString());
      if (error) throw error;
      const grouped = (data || []).reduce((acc, v) => {
        const date = v.violation_date.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0 };
        }
        acc[date].count++;
        return acc;
      }, {} as Record<string, ViolationsByDate>);
      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    },
    () => mockApis.getViolationsByDate(days)
  );
};

export const getCameraActivity = async (): Promise<CameraActivity[]> => {
  return runWithFallback(
    async () => {
      const { data: cameras } = await supabase
        .from('cameras')
        .select('id, name, location');
      if (!cameras) return [];
      const activity = await Promise.all(
        cameras.map(async (camera) => {
          const { count } = await supabase
            .from('violations')
            .select('*', { count: 'exact', head: true })
            .eq('camera_id', camera.id);
          return {
            camera_id: camera.id,
            camera_name: camera.name,
            location: camera.location,
            violation_count: count || 0,
          };
        })
      );
      return activity.sort((a, b) => b.violation_count - a.violation_count);
    },
    () => mockApis.getCameraActivity()
  );
};
