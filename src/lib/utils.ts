export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function calculateAdherence(alunoSkills: string[], vagaSkills: string[]): {
  aderenciaPorcentagem: number;
  competenciasEmComum: string[];
  competenciasFaltantes: string[];
} {
  if (!vagaSkills || vagaSkills.length === 0) {
    return {
      aderenciaPorcentagem: 100,
      competenciasEmComum: [],
      competenciasFaltantes: [],
    };
  }

  const normalizedAlunoSkills = (alunoSkills || []).map((s) => s.trim().toLowerCase());
  const emComum: string[] = [];
  const faltantes: string[] = [];

  vagaSkills.forEach((vSkill) => {
    const isPresent = normalizedAlunoSkills.includes(vSkill.trim().toLowerCase());
    if (isPresent) {
      emComum.push(vSkill);
    } else {
      faltantes.push(vSkill);
    }
  });

  const percentage = Math.round((emComum.length / vagaSkills.length) * 100);

  return {
    aderenciaPorcentagem: percentage,
    competenciasEmComum: emComum,
    competenciasFaltantes: faltantes,
  };
}
