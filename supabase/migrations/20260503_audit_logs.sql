-- Audit logging table for admin actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Only the system can insert audit logs (via SECURITY DEFINER functions)
CREATE POLICY "audit_logs_system_insert" ON public.audit_logs FOR INSERT WITH CHECK (false);

-- Function to log photo uploads
CREATE OR REPLACE FUNCTION public.log_photo_upload()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (NEW.uploaded_by, 'upload', 'photo', NEW.id, jsonb_build_object(
    'title', NEW.title,
    'storage_path', NEW.storage_path,
    'file_size', 0
  ));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_photo_uploaded
AFTER INSERT ON public.photos
FOR EACH ROW EXECUTE FUNCTION public.log_photo_upload();

-- Function to log photo deletions
CREATE OR REPLACE FUNCTION public.log_photo_deletion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), 'delete', 'photo', OLD.id, jsonb_build_object(
    'title', OLD.title,
    'storage_path', OLD.storage_path
  ));
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_photo_deleted
BEFORE DELETE ON public.photos
FOR EACH ROW EXECUTE FUNCTION public.log_photo_deletion();
