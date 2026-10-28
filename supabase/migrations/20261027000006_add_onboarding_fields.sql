-- Adiciona novos campos à tabela de perfis para onboarding e extração curricular
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS idade INTEGER,
  ADD COLUMN IF NOT EXISTS experiencia TEXT,
  ADD COLUMN IF NOT EXISTS graduacao TEXT,
  ADD COLUMN IF NOT EXISTS perfil_completo BOOLEAN NOT NULL DEFAULT false;

-- Administrador já é considerado com perfil completo
UPDATE public.perfis 
SET perfil_completo = true 
WHERE tipo = 'admin';

-- Atualiza a função do gatilho para definir perfil_completo automaticamente
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

  INSERT INTO public.perfis (
    id, 
    nome, 
    email, 
    tipo, 
    perfil_completo,
    criado_em
  )
  VALUES (
    NEW.id, 
    user_nome, 
    NEW.email, 
    user_tipo, 
    (user_tipo = 'admin'), 
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    nome = EXCLUDED.nome,
    tipo = EXCLUDED.tipo;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

