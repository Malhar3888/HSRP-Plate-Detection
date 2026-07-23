-- Create storage bucket for vehicle/violation images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-8rwta3kbsqgx_vehicle_images',
  'app-8rwta3kbsqgx_vehicle_images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
);

-- Storage policies for vehicle images
CREATE POLICY "Authenticated users can view vehicle images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'app-8rwta3kbsqgx_vehicle_images');

CREATE POLICY "Officers and admins can upload vehicle images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'app-8rwta3kbsqgx_vehicle_images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin'::user_role, 'officer'::user_role)
    )
  );

CREATE POLICY "Officers and admins can delete vehicle images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'app-8rwta3kbsqgx_vehicle_images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin'::user_role, 'officer'::user_role)
    )
  );