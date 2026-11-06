-- Migration: Criação de Bucket PRIVADO de Currículos com Acesso Restrito a Administradores (adm@fia.com.br) e ao Aluno Dono
-- Data: 2026-11-06

-- 1. Criação do Bucket PRIVADO 'curriculos'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'curriculos',
  'curriculos',
  false, -- Bucket PRIVADO: exige autenticação e assinatura para visualização
  10485760, -- Limite de 10 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- 2. Políticas de Segurança RLS na tabela storage.objects

-- A) LEITURA RESTRITA (SELECT):
-- Apenas o administrador mestre (adm@fia.com.br ou public.is_admin()) OU o próprio aluno dono da pasta
DROP POLICY IF EXISTS "Permitir leitura de curriculo por adm ou dono" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura publica de curriculos" ON storage.objects;

CREATE POLICY "Permitir leitura de curriculo por adm ou dono"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'curriculos' AND (
    public.is_admin()
    OR LOWER(auth.jwt()->>'email') = 'adm@fia.com.br'
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- B) UPLOAD / INSERÇÃO (INSERT):
-- Alunos autenticados podem enviar arquivos apenas na sua respectiva pasta (seu auth.uid)
-- Administradores também possuem permissão
DROP POLICY IF EXISTS "Permitir upload de curriculo por dono ou adm" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de curriculo por autenticados" ON storage.objects;

CREATE POLICY "Permitir upload de curriculo por dono ou adm"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'curriculos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
    OR LOWER(auth.jwt()->>'email') = 'adm@fia.com.br'
  )
);

-- C) ATUALIZAÇÃO (UPDATE):
DROP POLICY IF EXISTS "Permitir atualizacao de curriculo por dono ou adm" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualizacao de curriculo por autenticados" ON storage.objects;

CREATE POLICY "Permitir atualizacao de curriculo por dono ou adm"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'curriculos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
    OR LOWER(auth.jwt()->>'email') = 'adm@fia.com.br'
  )
);

-- D) EXCLUSÃO (DELETE):
DROP POLICY IF EXISTS "Permitir exclusao de curriculo por dono ou adm" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusao de curriculo por autenticados" ON storage.objects;

CREATE POLICY "Permitir exclusao de curriculo por dono ou adm"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'curriculos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
    OR LOWER(auth.jwt()->>'email') = 'adm@fia.com.br'
  )
);
