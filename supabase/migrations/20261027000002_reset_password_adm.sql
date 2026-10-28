-- Atualiza a senha e confirmação do usuário adm@fia.com.br para @13setFia
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

UPDATE auth.users 
SET 
  encrypted_password = extensions.crypt('@13setFia', extensions.gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  raw_user_meta_data = jsonb_build_object('nome', 'Administrador FIA', 'tipo', 'admin')
WHERE email = 'adm@fia.com.br';

