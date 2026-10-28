-- Garante a criação de um usuário aluno para testes imediatos
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'aluno@fia.com.br') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'aluno@fia.com.br',
      extensions.crypt('@13setAluno', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Aluno FIA","tipo":"aluno"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;

