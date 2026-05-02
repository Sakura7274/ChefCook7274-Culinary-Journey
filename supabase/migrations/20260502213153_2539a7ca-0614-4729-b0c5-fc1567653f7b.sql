-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- First signup becomes admin, all others are regular users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  size TEXT NOT NULL DEFAULT 'medium',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_public_read" ON public.photos FOR SELECT USING (true);
CREATE POLICY "photos_admin_insert" ON public.photos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "photos_admin_update" ON public.photos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "photos_admin_delete" ON public.photos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "photos_bucket_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "photos_bucket_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "photos_bucket_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "photos_bucket_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));