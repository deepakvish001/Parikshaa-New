DROP POLICY IF EXISTS "admins can upload blog media" ON storage.objects;
DROP POLICY IF EXISTS "admins can update blog media" ON storage.objects;
DROP POLICY IF EXISTS "admins can delete blog media" ON storage.objects;

CREATE POLICY "blog-media admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'blog-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
);

CREATE POLICY "blog-media admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'blog-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
)
WITH CHECK (
  bucket_id = 'blog-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
);

CREATE POLICY "blog-media admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'blog-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
);