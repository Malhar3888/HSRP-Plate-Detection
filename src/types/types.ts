// Database types matching Supabase schema

export type UserRole = 'admin' | 'officer' | 'viewer';

export type ViolationStatus = 'pending' | 'notified' | 'paid' | 'dismissed';

export type SmsStatus = 'sent' | 'failed' | 'pending' | 'disabled' | 'not_configured' | 'retrying';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type CameraStatus = 'online' | 'offline' | 'maintenance';

export type VehicleType = 'car' | 'bike' | 'truck' | 'bus' | 'auto';

export type ViolationType = 'no_hsrp' | 'insurance_expired' | 'puc_expired' | 'rc_expired' | 'other';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  rtsp_url: string | null;
  status: CameraStatus;
  last_active: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  owner_name: string;
  owner_phone: string;
  vehicle_type: VehicleType;
  has_hsrp: boolean;
  rc_expiry: string | null;
  insurance_expiry: string | null;
  puc_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface Violation {
  id: string;
  plate_number: string;
  vehicle_id: string | null;
  camera_id: string | null;
  violation_type: ViolationType;
  violation_date: string;
  location: string;
  image_url: string | null;
  fine_amount: number;
  status: ViolationStatus;
  description: string | null;
  notified_at: string | null;
  sms_status?: SmsStatus;
  sms_recipient?: string | null;
  sms_sent_at?: string | null;
  sms_error?: string | null;
  sms_message_id?: string | null;
  plate_image_url?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  vehicle?: Vehicle;
  camera?: Camera;
}

export interface Payment {
  id: string;
  violation_id: string;
  amount: number;
  status: PaymentStatus;
  payment_date: string | null;
  transaction_id: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  violation?: Violation;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  // Joined data
  user?: Profile;
}

// Statistics types
export interface DashboardStats {
  totalViolations: number;
  pendingViolations: number;
  totalFines: number;
  collectedFines: number;
  activeCameras: number;
  totalCameras: number;
  todayViolations: number;
  hsrpViolations: number;
}

export interface ViolationsByType {
  type: ViolationType;
  count: number;
  amount: number;
}

export interface ViolationsByDate {
  date: string;
  count: number;
}

export interface CameraActivity {
  camera_id: string;
  camera_name: string;
  location: string;
  violation_count: number;
}

// Filter types
export interface ViolationFilters {
  status?: ViolationStatus;
  type?: ViolationType;
  cameraId?: string;
  dateFrom?: string;
  dateTo?: string;
  plateNumber?: string;
}

export interface VehicleFilters {
  hasHsrp?: boolean;
  vehicleType?: VehicleType;
  plateNumber?: string;
  expiredDocs?: boolean;
}

// Form types
export interface ViolationFormData {
  plate_number: string;
  camera_id: string;
  violation_type: ViolationType;
  location: string;
  fine_amount: number;
  description?: string;
  image_url?: string;
}

export interface VehicleFormData {
  plate_number: string;
  owner_name: string;
  owner_phone: string;
  vehicle_type: VehicleType;
  has_hsrp: boolean;
  rc_expiry?: string;
  insurance_expiry?: string;
  puc_expiry?: string;
}

export interface CameraFormData {
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  rtsp_url?: string;
  status: CameraStatus;
}

// Settings
export interface Settings {
  sms_country_code: string;
  sms_notification_number: string;
  sms_enabled: boolean;
  sms_provider: string;
  updated_at: string;
}

export interface SmsAttempt {
  id: string;
  violation_id: string;
  attempt_number: number;
  status: SmsStatus;
  provider_message_id: string | null;
  provider_response: string | null;
  error_message: string | null;
  attempted_at: string;
}
