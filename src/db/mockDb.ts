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
  UserRole,
  Settings,
  SmsAttempt
} from '@/types/types';

// Helper to generate UUIDs
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Initial Mock Data
const INITIAL_CAMERAS: Camera[] = [
  {
    id: 'cam-1',
    name: 'NH-4 Highway Cam East',
    location: 'Highway NH-4, km 12',
    latitude: 18.5204,
    longitude: 73.8567,
    rtsp_url: 'rtsp://192.168.1.100/stream1',
    status: 'online',
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cam-2',
    name: 'Sector 5 Main Crossing',
    location: 'Sector 5 & 12 Avenue',
    latitude: 18.5254,
    longitude: 73.8617,
    rtsp_url: 'rtsp://192.168.1.101/stream1',
    status: 'online',
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cam-3',
    name: 'Expressway Toll Booth A',
    location: 'Mumbai-Pune Expressway Toll',
    latitude: 18.7204,
    longitude: 73.4567,
    rtsp_url: 'rtsp://192.168.1.102/stream1',
    status: 'online',
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cam-4',
    name: 'University Road Intersection',
    location: 'University Circle Gate 2',
    latitude: 18.5304,
    longitude: 73.8367,
    rtsp_url: 'rtsp://192.168.1.103/stream1',
    status: 'maintenance',
    last_active: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    plate_number: 'MH12QW1234',
    owner_name: 'Rajesh Kumar',
    owner_phone: '+919876543210',
    vehicle_type: 'car',
    has_hsrp: true,
    rc_expiry: '2030-12-31',
    insurance_expiry: '2027-06-15',
    puc_expiry: '2026-11-20',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'veh-2',
    plate_number: 'MH14AB5678',
    owner_name: 'Amit Patel',
    owner_phone: '+919865432101',
    vehicle_type: 'bike',
    has_hsrp: false,
    rc_expiry: '2028-04-10',
    insurance_expiry: '2025-03-12', // Expired
    puc_expiry: '2026-09-05',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'veh-3',
    plate_number: 'MH12XY9012',
    owner_name: 'Priya Sharma',
    owner_phone: '+919543210987',
    vehicle_type: 'car',
    has_hsrp: false,
    rc_expiry: '2029-08-25',
    insurance_expiry: '2027-01-20',
    puc_expiry: '2025-05-10', // Expired
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'veh-4',
    plate_number: 'MH12TR4567',
    owner_name: 'Super Logistics Ltd',
    owner_phone: '+919988776655',
    vehicle_type: 'truck',
    has_hsrp: true,
    rc_expiry: '2024-01-01', // Expired
    insurance_expiry: '2026-10-30',
    puc_expiry: '2026-08-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'veh-5',
    plate_number: 'MH12AA1111',
    owner_name: 'Sunil Deshmukh',
    owner_phone: '+919123456789',
    vehicle_type: 'auto',
    has_hsrp: false,
    rc_expiry: '2032-05-05',
    insurance_expiry: '2027-04-12',
    puc_expiry: '2027-03-22',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const INITIAL_VIOLATIONS: Violation[] = [
  {
    id: 'vio-1',
    plate_number: 'MH14AB5678',
    vehicle_id: 'veh-2',
    camera_id: 'cam-1',
    violation_type: 'no_hsrp',
    violation_date: new Date(Date.now() - 3600000 * 2).toISOString(),
    location: 'Highway NH-4, km 12',
    image_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop',
    fine_amount: 500,
    status: 'pending',
    description: 'Vehicle detected without High Security Registration Plate (HSRP).',
    notified_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'vio-2',
    plate_number: 'MH12XY9012',
    vehicle_id: 'veh-3',
    camera_id: 'cam-2',
    violation_type: 'puc_expired',
    violation_date: new Date(Date.now() - 3600000 * 24).toISOString(),
    location: 'Sector 5 & 12 Avenue',
    image_url: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=800&auto=format&fit=crop',
    fine_amount: 1000,
    status: 'notified',
    description: 'Vehicle operating with expired Pollution Under Control (PUC) certificate.',
    notified_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
  {
    id: 'vio-3',
    plate_number: 'MH14AB5678',
    vehicle_id: 'veh-2',
    camera_id: 'cam-3',
    violation_type: 'insurance_expired',
    violation_date: new Date(Date.now() - 3600000 * 48).toISOString(),
    location: 'Mumbai-Pune Expressway Toll',
    image_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop',
    fine_amount: 2000,
    status: 'paid',
    description: 'Vehicle operating without valid motor insurance.',
    notified_at: new Date(Date.now() - 3600000 * 46).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    violation_id: 'vio-3',
    amount: 2000,
    status: 'completed',
    payment_date: new Date().toISOString(),
    transaction_id: 'TXN_' + uuid().substring(0, 10).toUpperCase(),
    payment_method: 'UPI',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const INITIAL_SETTINGS: Settings = {
  sms_country_code: '+91',
  sms_notification_number: '9960204620',
  sms_enabled: true,
  sms_provider: 'mock',
  updated_at: new Date().toISOString()
};

const INITIAL_SMS_ATTEMPTS: SmsAttempt[] = [];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    user_id: 'admin-1',
    action: 'login',
    entity_type: 'auth',
    entity_id: 'admin-1',
    details: { message: 'Administrator logged in' },
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString(),
  }
];

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'admin-1',
    email: 'admin@miaoda.com',
    username: 'admin',
    phone: '+919999999999',
    role: 'admin',
    full_name: 'System Administrator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// Database Storage Initializer
class MockDB {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`hsrp_mock_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`hsrp_mock_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Local Storage write failed:', e);
    }
  }

  constructor() {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('hsrp_mock_initialized')) {
        this.setStorageItem('cameras', INITIAL_CAMERAS);
        this.setStorageItem('vehicles', INITIAL_VEHICLES);
        this.setStorageItem('violations', INITIAL_VIOLATIONS);
        this.setStorageItem('payments', INITIAL_PAYMENTS);
        this.setStorageItem('activity_logs', INITIAL_LOGS);
        this.setStorageItem('profiles', INITIAL_PROFILES);
        this.setStorageItem('settings', INITIAL_SETTINGS);
        this.setStorageItem('sms_attempts', INITIAL_SMS_ATTEMPTS);
        localStorage.setItem('hsrp_mock_initialized', 'true');
      }
    }
  }

  // Auth Operations
  private currentUserKey = 'hsrp_mock_current_user';
  
  getCurrentUser() {
    return this.getStorageItem<Profile | null>(this.currentUserKey, INITIAL_PROFILES[0]);
  }

  setCurrentUser(profile: Profile | null) {
    this.setStorageItem(this.currentUserKey, profile);
  }

  // Profiles
  getProfiles(): Profile[] {
    return this.getStorageItem<Profile[]>('profiles', INITIAL_PROFILES);
  }

  saveProfiles(profiles: Profile[]) {
    this.setStorageItem('profiles', profiles);
  }

  // Cameras
  getCameras(): Camera[] {
    return this.getStorageItem<Camera[]>('cameras', INITIAL_CAMERAS);
  }

  saveCameras(cameras: Camera[]) {
    this.setStorageItem('cameras', cameras);
  }

  // Vehicles
  getVehicles(): Vehicle[] {
    return this.getStorageItem<Vehicle[]>('vehicles', INITIAL_VEHICLES);
  }

  saveVehicles(vehicles: Vehicle[]) {
    this.setStorageItem('vehicles', vehicles);
  }

  // Violations
  getViolations(): Violation[] {
    return this.getStorageItem<Violation[]>('violations', INITIAL_VIOLATIONS);
  }

  saveViolations(violations: Violation[]) {
    this.setStorageItem('violations', violations);
  }

  // Payments
  getPayments(): Payment[] {
    return this.getStorageItem<Payment[]>('payments', INITIAL_PAYMENTS);
  }

  savePayments(payments: Payment[]) {
    this.setStorageItem('payments', payments);
  }

  // Logs
  getLogs(): ActivityLog[] {
    return this.getStorageItem<ActivityLog[]>('activity_logs', INITIAL_LOGS);
  }

  saveLogs(logs: ActivityLog[]) {
    this.setStorageItem('activity_logs', logs);
  }

  // Settings
  getSettings(): Settings {
    return this.getStorageItem<Settings>('settings', INITIAL_SETTINGS);
  }

  saveSettings(settings: Settings) {
    this.setStorageItem('settings', settings);
  }

  // SMS Attempts
  getSmsAttempts(): SmsAttempt[] {
    return this.getStorageItem<SmsAttempt[]>('sms_attempts', INITIAL_SMS_ATTEMPTS);
  }

  saveSmsAttempts(attempts: SmsAttempt[]) {
    this.setStorageItem('sms_attempts', attempts);
  }
}

export const mockDb = new MockDB();

// Mock API Call implementations
export const mockApis = {
  // Profiles
  getProfile: async (userId: string): Promise<Profile | null> => {
    const profile = mockDb.getProfiles().find(p => p.id === userId);
    return profile || null;
  },

  getAllProfiles: async (): Promise<Profile[]> => {
    return mockDb.getProfiles();
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
    const profiles = mockDb.getProfiles();
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx === -1) return null;
    profiles[idx] = {
      ...profiles[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    mockDb.saveProfiles(profiles);
    
    // update current user session if it is the current user
    const cur = mockDb.getCurrentUser();
    if (cur && cur.id === userId) {
      mockDb.setCurrentUser(profiles[idx]);
    }
    
    return profiles[idx];
  },

  // Cameras
  getAllCameras: async (): Promise<Camera[]> => {
    return mockDb.getCameras().sort((a, b) => a.name.localeCompare(b.name));
  },

  getCamera: async (id: string): Promise<Camera | null> => {
    return mockDb.getCameras().find(c => c.id === id) || null;
  },

  createCamera: async (camera: CameraFormData): Promise<Camera | null> => {
    const cameras = mockDb.getCameras();
    const newCamera: Camera = {
      id: 'cam-' + uuid().substring(0, 8),
      ...camera,
      latitude: camera.latitude ?? null,
      longitude: camera.longitude ?? null,
      rtsp_url: camera.rtsp_url ?? null,
      last_active: camera.status === 'online' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    cameras.push(newCamera);
    mockDb.saveCameras(cameras);
    return newCamera;
  },

  updateCamera: async (id: string, updates: Partial<CameraFormData>): Promise<Camera | null> => {
    const cameras = mockDb.getCameras();
    const idx = cameras.findIndex(c => c.id === id);
    if (idx === -1) return null;
    cameras[idx] = {
      ...cameras[idx],
      ...updates,
      latitude: updates.latitude !== undefined ? updates.latitude : cameras[idx].latitude,
      longitude: updates.longitude !== undefined ? updates.longitude : cameras[idx].longitude,
      rtsp_url: updates.rtsp_url !== undefined ? updates.rtsp_url : cameras[idx].rtsp_url,
      updated_at: new Date().toISOString()
    };
    mockDb.saveCameras(cameras);
    return cameras[idx];
  },

  deleteCamera: async (id: string): Promise<void> => {
    const cameras = mockDb.getCameras().filter(c => c.id !== id);
    mockDb.saveCameras(cameras);
  },

  // Vehicles
  getAllVehicles: async (filters?: VehicleFilters): Promise<Vehicle[]> => {
    let list = mockDb.getVehicles();
    if (filters?.hasHsrp !== undefined) {
      list = list.filter(v => v.has_hsrp === filters.hasHsrp);
    }
    if (filters?.vehicleType) {
      list = list.filter(v => v.vehicle_type === filters.vehicleType);
    }
    if (filters?.plateNumber) {
      const match = filters.plateNumber.toLowerCase();
      list = list.filter(v => v.plate_number.toLowerCase().includes(match));
    }
    if (filters?.expiredDocs) {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter(v => {
        return (
          (v.rc_expiry && v.rc_expiry < today) ||
          (v.insurance_expiry && v.insurance_expiry < today) ||
          (v.puc_expiry && v.puc_expiry < today)
        );
      });
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  getVehicle: async (id: string): Promise<Vehicle | null> => {
    return mockDb.getVehicles().find(v => v.id === id) || null;
  },

  getVehicleByPlate: async (plateNumber: string): Promise<Vehicle | null> => {
    return mockDb.getVehicles().find(v => v.plate_number.toLowerCase() === plateNumber.toLowerCase()) || null;
  },

  createVehicle: async (vehicle: VehicleFormData): Promise<Vehicle | null> => {
    const vehicles = mockDb.getVehicles();
    const newVehicle: Vehicle = {
      id: 'veh-' + uuid().substring(0, 8),
      ...vehicle,
      rc_expiry: vehicle.rc_expiry ?? null,
      insurance_expiry: vehicle.insurance_expiry ?? null,
      puc_expiry: vehicle.puc_expiry ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    vehicles.push(newVehicle);
    mockDb.saveVehicles(vehicles);
    return newVehicle;
  },

  updateVehicle: async (id: string, updates: Partial<VehicleFormData>): Promise<Vehicle | null> => {
    const vehicles = mockDb.getVehicles();
    const idx = vehicles.findIndex(v => v.id === id);
    if (idx === -1) return null;
    vehicles[idx] = {
      ...vehicles[idx],
      ...updates,
      rc_expiry: updates.rc_expiry !== undefined ? updates.rc_expiry : vehicles[idx].rc_expiry,
      insurance_expiry: updates.insurance_expiry !== undefined ? updates.insurance_expiry : vehicles[idx].insurance_expiry,
      puc_expiry: updates.puc_expiry !== undefined ? updates.puc_expiry : vehicles[idx].puc_expiry,
      updated_at: new Date().toISOString()
    };
    mockDb.saveVehicles(vehicles);
    return vehicles[idx];
  },

  deleteVehicle: async (id: string): Promise<void> => {
    const vehicles = mockDb.getVehicles().filter(v => v.id !== id);
    mockDb.saveVehicles(vehicles);
  },

  // Violations
  getAllViolations: async (filters?: ViolationFilters): Promise<Violation[]> => {
    const violations = mockDb.getViolations();
    const vehicles = mockDb.getVehicles();
    const cameras = mockDb.getCameras();

    let list = violations.map(vio => ({
      ...vio,
      vehicle: vehicles.find(v => v.id === vio.vehicle_id),
      camera: cameras.find(c => c.id === vio.camera_id)
    }));

    if (filters?.status) {
      list = list.filter(v => v.status === filters.status);
    }
    if (filters?.type) {
      list = list.filter(v => v.violation_type === filters.type);
    }
    if (filters?.cameraId) {
      list = list.filter(v => v.camera_id === filters.cameraId);
    }
    if (filters?.dateFrom) {
      list = list.filter(v => v.violation_date >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      list = list.filter(v => v.violation_date <= filters.dateTo!);
    }
    if (filters?.plateNumber) {
      const match = filters.plateNumber.toLowerCase();
      list = list.filter(v => v.plate_number.toLowerCase().includes(match));
    }

    return list.sort((a, b) => b.violation_date.localeCompare(a.violation_date)).slice(0, 100);
  },

  getViolation: async (id: string): Promise<Violation | null> => {
    const vio = mockDb.getViolations().find(v => v.id === id);
    if (!vio) return null;

    return {
      ...vio,
      vehicle: mockDb.getVehicles().find(v => v.id === vio.vehicle_id),
      camera: mockDb.getCameras().find(c => c.id === vio.camera_id)
    };
  },

  createViolation: async (violation: ViolationFormData): Promise<Violation | null> => {
    const violations = mockDb.getViolations();
    const vehicles = mockDb.getVehicles();
    const vehicle = vehicles.find(v => v.plate_number.toLowerCase() === violation.plate_number.toLowerCase());

    const newViolation: Violation = {
      id: 'vio-' + uuid().substring(0, 8),
      plate_number: violation.plate_number,
      vehicle_id: vehicle?.id || null,
      camera_id: violation.camera_id,
      violation_type: violation.violation_type,
      violation_date: new Date().toISOString(),
      location: violation.location,
      image_url: violation.image_url ?? null,
      fine_amount: violation.fine_amount,
      status: 'pending',
      description: violation.description ?? null,
      notified_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    violations.push(newViolation);
    mockDb.saveViolations(violations);
    return newViolation;
  },

  updateViolation: async (id: string, updates: Partial<Violation>): Promise<Violation | null> => {
    const violations = mockDb.getViolations();
    const idx = violations.findIndex(v => v.id === id);
    if (idx === -1) return null;
    violations[idx] = {
      ...violations[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    mockDb.saveViolations(violations);
    return violations[idx];
  },

  deleteViolation: async (id: string): Promise<void> => {
    const violations = mockDb.getViolations().filter(v => v.id !== id);
    mockDb.saveViolations(violations);
  },

  // Payments
  getAllPayments: async (): Promise<Payment[]> => {
    const payments = mockDb.getPayments();
    const violations = mockDb.getViolations();
    
    return payments.map(p => ({
      ...p,
      violation: violations.find(v => v.id === p.violation_id)
    })).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100);
  },

  getPaymentsByViolation: async (violationId: string): Promise<Payment[]> => {
    return mockDb.getPayments().filter(p => p.violation_id === violationId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  createPayment: async (payment: Partial<Payment>): Promise<Payment | null> => {
    const payments = mockDb.getPayments();
    const newPayment: Payment = {
      id: 'pay-' + uuid().substring(0, 8),
      violation_id: payment.violation_id!,
      amount: payment.amount!,
      status: payment.status || 'pending',
      payment_date: payment.status === 'completed' ? new Date().toISOString() : null,
      transaction_id: payment.transaction_id || ('TXN_' + uuid().substring(0, 10).toUpperCase()),
      payment_method: payment.payment_method || 'UPI',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    payments.push(newPayment);
    mockDb.savePayments(payments);

    // Also update violation status to paid if payment is completed
    if (newPayment.status === 'completed') {
      const violations = mockDb.getViolations();
      const vIdx = violations.findIndex(v => v.id === newPayment.violation_id);
      if (vIdx !== -1) {
        violations[vIdx].status = 'paid';
        violations[vIdx].updated_at = new Date().toISOString();
        mockDb.saveViolations(violations);
      }
    }

    return newPayment;
  },

  updatePayment: async (id: string, updates: Partial<Payment>): Promise<Payment | null> => {
    const payments = mockDb.getPayments();
    const idx = payments.findIndex(p => p.id === id);
    if (idx === -1) return null;
    payments[idx] = {
      ...payments[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    mockDb.savePayments(payments);
    return payments[idx];
  },

  // Activity Logs
  getActivityLogs: async (limit = 50): Promise<ActivityLog[]> => {
    const logs = mockDb.getLogs();
    const profiles = mockDb.getProfiles();
    return logs.map(l => ({
      ...l,
      user: profiles.find(p => p.id === l.user_id)
    })).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  },

  createActivityLog: async (log: Partial<ActivityLog>): Promise<void> => {
    const logs = mockDb.getLogs();
    const curUser = mockDb.getCurrentUser();
    const newLog: ActivityLog = {
      id: 'log-' + uuid().substring(0, 8),
      user_id: curUser?.id || null,
      action: log.action || 'activity',
      entity_type: log.entity_type || null,
      entity_id: log.entity_id || null,
      details: log.details || null,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    mockDb.saveLogs(logs);
  },

  // Statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    const violations = mockDb.getViolations();
    const payments = mockDb.getPayments();
    const cameras = mockDb.getCameras();
    
    const todayStr = new Date().toISOString().split('T')[0];

    const totalViolations = violations.length;
    const pendingViolations = violations.filter(v => v.status === 'pending').length;
    const todayViolations = violations.filter(v => v.violation_date.startsWith(todayStr)).length;
    const hsrpViolations = violations.filter(v => v.violation_type === 'no_hsrp').length;

    const totalFines = violations.reduce((sum, v) => sum + (Number(v.fine_amount) || 0), 0);
    const collectedFines = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalCameras = cameras.length;
    const activeCameras = cameras.filter(c => c.status === 'online').length;

    return {
      totalViolations,
      pendingViolations,
      totalFines,
      collectedFines,
      activeCameras,
      totalCameras,
      todayViolations,
      hsrpViolations
    };
  },

  getViolationsByType: async (): Promise<ViolationsByType[]> => {
    const violations = mockDb.getViolations();
    const grouped = violations.reduce((acc, v) => {
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

  getViolationsByDate: async (days = 7): Promise<ViolationsByDate[]> => {
    const violations = mockDb.getViolations();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString();

    const filtered = violations.filter(v => v.violation_date >= startStr);
    const grouped = filtered.reduce((acc, v) => {
      const date = v.violation_date.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count++;
      return acc;
    }, {} as Record<string, ViolationsByDate>);

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  },

  getCameraActivity: async (): Promise<CameraActivity[]> => {
    const cameras = mockDb.getCameras();
    const violations = mockDb.getViolations();

    const activity = cameras.map(camera => {
      const count = violations.filter(v => v.camera_id === camera.id).length;
      return {
        camera_id: camera.id,
        camera_name: camera.name,
        location: camera.location,
        violation_count: count
      };
    });

    return activity.sort((a, b) => b.violation_count - a.violation_count);
  },

  // Settings
  getSettings: async (): Promise<Settings> => {
    return mockDb.getSettings();
  },

  updateSettings: async (updates: Partial<Settings>): Promise<Settings> => {
    const current = mockDb.getSettings();
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };
    mockDb.saveSettings(updated);
    return updated;
  },

  // SMS Attempts
  getSmsAttemptsByViolation: async (violationId: string): Promise<SmsAttempt[]> => {
    return mockDb.getSmsAttempts().filter(a => a.violation_id === violationId);
  },

  createSmsAttempt: async (attempt: Omit<SmsAttempt, 'id'>): Promise<SmsAttempt> => {
    const attempts = mockDb.getSmsAttempts();
    const newAttempt = {
      ...attempt,
      id: 'sms-' + uuid().substring(0, 8),
    };
    attempts.push(newAttempt);
    mockDb.saveSmsAttempts(attempts);
    return newAttempt;
  }
};
