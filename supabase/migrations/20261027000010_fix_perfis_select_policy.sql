-- 1. Remove política restritiva de SELECT anterior
DROP POLICY IF EXISTS "perfis_select_authenticated" ON public.perfis;
DROP POLICY IF EXISTS "perfis_select_all" ON public.perfis;

-- 2. Permite leitura de perfis para consultas na plataforma institucional
CREATE POLICY "perfis_select_all"
  ON public.perfis FOR SELECT
  USING (true);

-- 3. Função RPC com SECURITY DEFINER para carregar o perfil do aluno com 100% de confiabilidade
CREATE OR REPLACE FUNCTION public.obter_perfil_aluno(p_usuario_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resultado JSONB;
BEGIN
  SELECT to_jsonb(p) INTO v_resultado
  FROM public.perfis p
  WHERE p.id = p_usuario_id;

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obter_perfil_aluno TO anon, authenticated, service_role;

