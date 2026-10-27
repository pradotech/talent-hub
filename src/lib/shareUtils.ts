import type { Vaga } from '../types';

export function getVagaSystemUrl(vagaId: string): string {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  return `${origin}/aluno/vagas?vagaId=${vagaId}`;
}

export function formatVagaForSharing(vaga: Vaga): string {
  const empresaOuDepto = vaga.empresa || vaga.departamento || 'Institucional';
  const remuneracaoTexto = vaga.remuneracao ? `\n💰 *Remuneração / Bolsa:* ${vaga.remuneracao}` : '';
  const skillsTexto = vaga.competenciasNecessarias?.length
    ? `\n🎯 *Competências Requeridas:* ${vaga.competenciasNecessarias.join(', ')}`
    : '';
  const siteExterno = vaga.linkInscricao ? `\n🌐 *Site da Vaga:* ${vaga.linkInscricao}` : '';
  const linkSistema = getVagaSystemUrl(vaga.id);

  return (
    `📢 *Oportunidade - Talent Hub FIA*\n\n` +
    `💼 *${vaga.titulo}*\n` +
    `🏢 *Empresa:* ${empresaOuDepto}\n` +
    `📍 *Modalidade:* ${vaga.modalidade}${remuneracaoTexto}\n` +
    `📅 *Prazo:* ${vaga.dataLimite ? new Date(vaga.dataLimite).toLocaleDateString('pt-BR') : 'A consultar'}` +
    `${skillsTexto}${siteExterno}\n\n` +
    `📝 *Descrição:* ${vaga.descricao.slice(0, 180)}${vaga.descricao.length > 180 ? '...' : ''}\n\n` +
    `🔗 *Ver detalhes e se candidatar no sistema:*\n${linkSistema}\n\n` +
    `_Compartilhado via Talent Hub FIA_`
  );
}

export function getWhatsAppShareUrl(vaga: Vaga): string {
  const text = formatVagaForSharing(vaga);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
