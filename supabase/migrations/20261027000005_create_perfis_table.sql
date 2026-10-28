-- 1. Criação da tabela de perfis de usuários (Alunos e Admins)
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'aluno' CHECK (tipo IN ('admin', 'aluno')),
  curso TEXT,
  periodo TEXT,
  curriculo_url TEXT,
  curriculo_nome_arquivo TEXT,
  competencias TEXT[] NOT NULL DEFAULT '{}',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Habilitação de RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
CREATE POLICY "Permitir leitura de perfis para autenticados" 
  ON public.perfis FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir usuario gerenciar proprio perfil" 
  ON public.perfis FOR ALL 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- 4. Função e Trigger para novos usuários criarem perfil automático com aluno por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_tipo TEXT;
  user_nome TEXT;
BEGIN
  user_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo', 'aluno');
  IF user_tipo NOT IN ('admin', 'aluno') THEN
    user_tipo := 'aluno';
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
    nome = EXCLUDED.nome,
    tipo = EXCLUDED.tipo;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Sincronizar usuários já existentes em auth.users para a tabela perfis
INSERT INTO public.perfis (id, nome, email, tipo, criado_em)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'nome', split_part(email, '@', 1)),
  email,
  COALESCE(raw_user_meta_data->>'tipo', 'aluno'),
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
  nome = EXCLUDED.nome,
  tipo = EXCLUDED.tipo;
