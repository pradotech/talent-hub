-- Confirma o e-mail e garante os metadados de admin para adm@fia.com.br
UPDATE auth.users 
SET 
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{tipo}',
    '"admin"'::jsonb
  )
WHERE email = 'adm@fia.com.br';

