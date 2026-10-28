-- 1. Criação da tabela de vagas
CREATE TABLE IF NOT EXISTS public.vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  empresa TEXT NOT NULL,
  departamento TEXT,
  descricao TEXT NOT NULL,
  modalidade TEXT NOT NULL CHECK (modalidade IN ('Presencial', 'Híbrido', 'Remoto')),
  remuneracao TEXT,
  link_inscricao TEXT,
  competencias_necessarias TEXT[] NOT NULL DEFAULT '{}',
  data_limite DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'encerrada')),
  criada_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  criada_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Habilitação de Row Level Security (RLS)
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)
-- Leitura aberta para visualização do mural e listagem de vagas
CREATE POLICY "Permitir leitura de vagas" 
  ON public.vagas 
  FOR SELECT 
  USING (true);

-- Inserção permitida para usuários autenticados
CREATE POLICY "Permitir cadastro de vagas para usuários autenticados" 
  ON public.vagas 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Atualização e deleção
CREATE POLICY "Permitir atualização de vagas para usuários autenticados" 
  ON public.vagas 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de vagas para usuários autenticados" 
  ON public.vagas 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- 4. Índice para busca rápida de competências e status
CREATE INDEX IF NOT EXISTS idx_vagas_status ON public.vagas(status);
CREATE INDEX IF NOT EXISTS idx_vagas_competencias ON public.vagas USING GIN (competencias_necessarias);
