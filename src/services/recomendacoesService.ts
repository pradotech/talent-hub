import type { VagaRecomendada } from '../types';
import { vagasService } from './vagasService';
import { calculateAdherence } from '../lib/utils';

export const recomendacoesService = {
  // Motor de recomendação de vagas baseado nas competências do aluno
  async getVagasRecomendadas(alunoCompetencias: string[]): Promise<VagaRecomendada[]> {
    // TODO: Supabase / Motor de Matching Futuro:
    // Fase 1 atual: comparação exata/aproximada de tags em SQL (ou lógica em memória).
    // Fase 2 futura: pgvector com embeddings gerados a partir do texto completo do currículo
    // e das descrições das vagas via Supabase Edge Functions.
    
    const todasVagas = await vagasService.getVagas();

    const recomendadas: VagaRecomendada[] = todasVagas.map((vaga) => {
      const { aderenciaPorcentagem, competenciasEmComum, competenciasFaltantes } =
        calculateAdherence(alunoCompetencias, vaga.competenciasNecessarias);

      return {
        ...vaga,
        aderenciaPorcentagem,
        competenciasEmComum,
        competenciasFaltantes,
      };
    });

    // Ordenar decrescente pela porcentagem de aderência
    return recomendadas.sort((a, b) => b.aderenciaPorcentagem - a.aderenciaPorcentagem);
  },
};
