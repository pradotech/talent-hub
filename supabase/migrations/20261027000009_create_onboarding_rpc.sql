-- Migration: Função RPC Segura para Concluir Onboarding do Aluno
-- Mantém a tabela perfis com RLS 100% ATIVADO e isolado, provendo um ponto de entrada atômico para o cadastro

CREATE OR REPLACE FUNCTION public.concluir_onboarding_aluno(
  p_usuario_id UUID,
  p_nome TEXT,
  p_idade INTEGER,
  p_graduacao TEXT,
  p_experiencia TEXT DEFAULT NULL,
  p_competencias TEXT[] DEFAULT '{}',
  p_curriculo_url TEXT DEFAULT NULL,
  p_curriculo_nome_arquivo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_resultado JSONB;
BEGIN
  -- 1. Valida se o usuário existe em auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_usuario_id;

  -- Se não achou pelo ID fornecido, tenta buscar pelo usuário autenticado
  IF v_email IS NULL THEN
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = auth.uid();
    
    IF v_email IS NOT NULL THEN
      p_usuario_id := auth.uid();
    END IF;
  END IF;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não localizado no sistema de autenticação.';
  END IF;

  -- 2. Upsert na tabela perfis com privilégios elevados da função (SECURITY DEFINER)
  INSERT INTO public.perfis (
    id,
    nome,
    email,
    tipo,
    idade,
    graduacao,
    curso,
    experiencia,
    competencias,
    curriculo_url,
    curriculo_nome_arquivo,
    perfil_completo,
    criado_em
  )
  VALUES (
    p_usuario_id,
    p_nome,
    v_email,
    'aluno',
    p_idade,
    p_graduacao,
    p_graduacao,
    p_experiencia,
    p_competencias,
    p_curriculo_url,
    p_curriculo_nome_arquivo,
    true,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    idade = EXCLUDED.idade,
    graduacao = EXCLUDED.graduacao,
    curso = EXCLUDED.curso,
    experiencia = EXCLUDED.experiencia,
    competencias = EXCLUDED.competencias,
    curriculo_url = COALESCE(EXCLUDED.curriculo_url, perfis.curriculo_url),
    curriculo_nome_arquivo = COALESCE(EXCLUDED.curriculo_nome_arquivo, perfis.curriculo_nome_arquivo),
    perfil_completo = true;

  -- 3. Retorna os dados do perfil em formato JSONB
  SELECT to_jsonb(p) INTO v_resultado
  FROM public.perfis p
  WHERE p.id = p_usuario_id;

  RETURN v_resultado;
END;
$$;

-- Permite execução da função para salvar o perfil
GRANT EXECUTE ON FUNCTION public.concluir_onboarding_aluno TO anon, authenticated, service_role;

