-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'officer', 'viewer');

-- Create violation status enum
CREATE TYPE public.violation_status AS ENUM ('pending', 'notified', 'paid', 'dismissed');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create camera status enum
CREATE TYPE public.camera_status AS ENUM ('online', 'offline', 'maintenance');

-- Create vehicle type enum
CREATE TYPE public.vehicle_type AS ENUM ('car', 'bike', 'truck', 'bus', 'auto');

-- Create violation type enum
CREATE TYPE public.violation_type AS ENUM ('no_hsrp', 'insurance_expired', 'puc_expired', 'rc_expired', 'other');

-- Create profiles table (synced with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'viewer'::public.user_role,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cameras table
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rtsp_url TEXT,
  status public.camera_status NOT NULL DEFAULT 'offline'::public.camera_status,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vehicles table (RTO database)
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT UNIQUE NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  vehicle_type public.vehicle_type NOT NULL,
  has_hsrp BOOLEAN NOT NULL DEFAULT false,
  rc_expiry DATE,
  insurance_expiry DATE,
  puc_expiry DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create violations table
CREATE TABLE public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  camera_id UUID REFERENCES public.cameras(id) ON DELETE SET NULL,
  violation_type public.violation_type NOT NULL,
  violation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT NOT NULL,
  image_url TEXT,
  fine_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status public.violation_status NOT NULL DEFAULT 'pending'::public.violation_status,
  description TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id UUID NOT NULL REFERENCES public.violations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending'::public.payment_status,
  payment_date TIMESTAMPTZ,
  transaction_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_violations_plate_number ON public.violations(plate_number);
CREATE INDEX idx_violations_camera_id ON public.violations(camera_id);
CREATE INDEX idx_violations_status ON public.violations(status);
CREATE INDEX idx_violations_date ON public.violations(violation_date DESC);
CREATE INDEX idx_vehicles_plate_number ON public.vehicles(plate_number);
CREATE INDEX idx_payments_violation_id ON public.payments(violation_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cameras_updated_at BEFORE UPDATE ON public.cameras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_violations_updated_at BEFORE UPDATE ON public.violations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user sync trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  INSERT INTO public.profiles (id, email, username, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    NEW.phone,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'viewer'::public.user_role END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Cameras policies (officers and admins can manage)
CREATE POLICY "Authenticated users can view cameras" ON public.cameras
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officers and admins can manage cameras" ON public.cameras
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin'::user_role, 'officer'::user_role)
    )
  );

-- Vehicles policies (all authenticated can view, officers and admins can manage)
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officers and admins can manage vehicles" ON public.vehicles
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin'::user_role, 'officer'::user_role)
    )
  );

-- Violations policies
CREATE POLICY "Authenticated users can view violations" ON public.violations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officers and admins can manage violations" ON public.violations
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin'::user_role, 'officer'::user_role)
    )
  );

-- Payments policies
CREATE POLICY "Authenticated users can view payments" ON public.payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Officers and admins can manage payments" ON public.payments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin'::user_role, 'officer'::user_role)
    )
  );

-- Activity logs policies (admins only)
CREATE POLICY "Admins can view activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

-- Create public view for shareable profile info
CREATE VIEW public.public_profiles AS
  SELECT id, username, role, full_name FROM profiles;