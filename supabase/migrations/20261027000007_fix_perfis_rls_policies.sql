-- Migration: Correção de políticas RLS para operações de Upsert na tabela perfis
-- Mantém o RLS 100% ativo e seguro, isolando por operação (SELECT, INSERT, UPDATE)

-- 1. Remove políticas anteriores que usavam FOR ALL
DROP POLICY IF EXISTS "Permitir usuario gerenciar proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Permitir leitura de perfis para autenticados" ON public.perfis;
DROP POLICY IF EXISTS "perfis_select_authenticated" ON public.perfis;
DROP POLICY IF EXISTS "perfis_insert_own" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update_own" ON public.perfis;

-- 2. Assegura que o RLS está estritamente habilitado
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 3. Política de Leitura: Usuários autenticados podem visualizar perfis institucionais
CREATE POLICY "perfis_select_authenticated"
  ON public.perfis FOR SELECT
  TO authenticated
  USING (true);

-- 4. Política de Inserção: O usuário autenticado só pode criar a linha do seu próprio ID
CREATE POLICY "perfis_insert_own"
  ON public.perfis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 5. Política de Atualização: O usuário autenticado só pode modificar seus próprios dados
CREATE POLICY "perfis_update_own"
  ON public.perfis FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

