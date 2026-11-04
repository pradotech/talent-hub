-- Migration: Blindagem de Segurança contra Elevação de Privilégios (Privilege Escalation)
-- 1. Impede autocadastro com papel de admin via user_metadata
-- 2. Impede alteração da coluna 'tipo' por usuários comuns
-- 3. Restringe RLS para que alunos leiam apenas o próprio perfil, e apenas admins listem todos os alunos

-- 1. Trigger de novos usuários: Força SEMPRE 'aluno', NUNCA confia em raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_nome TEXT;
  user_tipo TEXT;
BEGIN
  -- Apenas o e-mail institucional mestre da FIA pode nascer como admin
  IF LOWER(NEW.email) = 'adm@fia.com.br' THEN
    user_tipo := 'admin';
  ELSE
    user_tipo := 'aluno'; -- Todo autocadastro é OBRIGATORIAMENTE aluno
  END IF;

  user_nome := COALESCE(
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.perfis (id, nome, email, tipo, criado_em)
  VALUES (NEW.id, user_nome, NEW.email, user_tipo, now())
  ON CONFLICT (id) DO UPDATE
  SET 
    nome = EXCLUDED.nome;
    -- Note: NÃO atualiza o 'tipo' em caso de conflito, impedindo sobrescrita maliciosa

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Gatilho de segurança: Impede que qualquer usuário comum altere a coluna 'tipo' para 'admin'
CREATE OR REPLACE FUNCTION public.proteger_tipo_perfil()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário tentar mudar o seu próprio tipo para admin, bloqueia a alteração
  IF NEW.tipo <> OLD.tipo AND auth.role() <> 'service_role' THEN
    NEW.tipo := OLD.tipo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_proteger_tipo_perfil ON public.perfis;
CREATE TRIGGER trg_proteger_tipo_perfil
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_tipo_perfil();

-- 3. Função segura para verificar se o usuário atual é admin no banco
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE id = auth.uid() AND tipo = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated, service_role;

-- 4. Atualizar políticas RLS da tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_select_all" ON public.perfis;
DROP POLICY IF EXISTS "perfis_select_authenticated" ON public.perfis;
DROP POLICY IF EXISTS "perfis_select_policy" ON public.perfis;

-- Regra de leitura estrita: O aluno só lê seu próprio perfil. O admin pode ler perfis para gerenciar alunos.
CREATE POLICY "perfis_select_policy"
  ON public.perfis FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  );

