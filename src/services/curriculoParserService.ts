export interface ExtractedCurriculoData {
  nome?: string;
  idade?: number;
  graduacao?: string;
  segundaGraduacao?: string;
  graduacoes?: string[];
  experiencia?: string;
  competencias: string[];
  rawTextPreview?: string;
}

// Catálogo canônico de competências para alinhamento com as vagas da FIA
const KNOWN_SKILLS = [
  'Python',
  'SQL',
  'Excel Avançado',
  'Excel',
  'Power BI',
  'Modelagem Financeira',
  'Valuation',
  'Gestão de Projetos',
  'Scrum',
  'Agile',
  'React',
  'TypeScript',
  'JavaScript',
  'Contabilidade',
  'Estatística',
  'Inglês Avançado',
  'Inglês Fluente',
  'Machine Learning',
  'Finanças Corporativas',
  'Finanças',
  'M&A',
  'Auditoria',
  'Planejamento Estratégico',
  'Data Science',
  'Tableau',
  'VBA',
  'Marketing Digital',
  'Comunicação',
  'Liderança',
  'Mapeamento de Processos',
  'Risco de Crédito',
  'Renda Fixa',
  'Investment Banking',
  'Análise de Dados',
  'Gestão de Equipes',
  'Negociação',
];

const KNOWN_COURSES = [
  'Administração',
  'Administração de Empresas',
  'Economia',
  'Ciências Econômicas',
  'Finanças',
  'Engenharia de Produção',
  'Engenharia',
  'Ciência de Dados',
  'Business Analytics',
  'Contabilidade',
  'Ciências Contábeis',
  'Gestão de Negócios & Inovação',
  'Sistemas de Informação',
  'Engenharia da Computação',
  'Ciência da Computação',
  'Análise e Desenvolvimento de Sistemas',
  'Relações Internacionais',
  'Marketing',
  'Direito',
];

/**
 * Procura ocorrência de uma sequência de bytes dentro de um Uint8Array
 */
function findSubarray(bytes: Uint8Array, pattern: Uint8Array, startIndex = 0): number {
  if (pattern.length === 0 || bytes.length === 0 || startIndex >= bytes.length) return -1;
  const max = bytes.length - pattern.length;
  for (let i = startIndex; i <= max; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

/**
 * Descompacta stream zlib / Deflate nativamente utilizando a DecompressionStream API do navegador
 */
async function decompressFlate(bytes: Uint8Array): Promise<string> {
  // Tentativa 1: 'deflate' com header zlib padrão (RFC 1950)
  try {
    const copy = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(copy as unknown as BufferSource);
    writer.close();
    const output = await new Response(ds.readable).arrayBuffer();
    return new TextDecoder('utf-8', { fatal: false }).decode(output);
  } catch {
    // Tentativa 2: 'deflate-raw' removendo os 2 bytes de cabeçalho zlib se existirem
    try {
      const raw = bytes.length > 2 && bytes[0] === 0x78 ? bytes.slice(2, bytes.length - 4) : bytes.slice();
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(raw as unknown as BufferSource);
      writer.close();
      const output = await new Response(ds.readable).arrayBuffer();
      return new TextDecoder('utf-8', { fatal: false }).decode(output);
    } catch {
      return '';
    }
  }
}

/**
 * Limpa escapes de strings de texto internas do PDF (ex: \(, \), \n, etc.)
 */
function cleanPdfEscape(str: string): string {
  return str
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

/**
 * Extrai comandos de texto de dentro de um stream de conteúdo PDF
 */
function extractTextFromPdfStream(content: string): string {
  const pieces: string[] = [];

  // 1. Procura arrays com o comando TJ: [ (Texto 1) 120 (Texto 2) ] TJ
  const tjArrayRegex = /\[(.*?)\]\s*TJ/gi;
  let match: RegExpExecArray | null;
  while ((match = tjArrayRegex.exec(content)) !== null) {
    const inner = match[1];
    const strRegex = /\(([^)]*)\)/g;
    let strMatch: RegExpExecArray | null;
    let line = '';
    while ((strMatch = strRegex.exec(inner)) !== null) {
      line += strMatch[1];
    }
    if (line.trim()) {
      pieces.push(cleanPdfEscape(line));
    }
  }

  // 2. Procura comandos Tj simples: (Texto) Tj
  const tjSimpleRegex = /\(([^)]*)\)\s*Tj/gi;
  while ((match = tjSimpleRegex.exec(content)) !== null) {
    if (match[1]?.trim()) {
      pieces.push(cleanPdfEscape(match[1]));
    }
  }

  return pieces.join(' ');
}

/**
 * Extrai texto completo de um PDF percorrendo streams comprimidos e não-comprimidos
 */
async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let extractedPieces: string[] = [];

  const streamMarker = new TextEncoder().encode('stream');
  const endStreamMarker = new TextEncoder().encode('endstream');

  let index = 0;
  while (index < bytes.length) {
    const streamStart = findSubarray(bytes, streamMarker, index);
    if (streamStart === -1) break;

    let dataStart = streamStart + 6;
    if (bytes[streamStart + 6] === 0x0a) dataStart = streamStart + 7;
    else if (bytes[streamStart + 6] === 0x0d && bytes[streamStart + 7] === 0x0a) dataStart = streamStart + 8;

    const streamEnd = findSubarray(bytes, endStreamMarker, dataStart);
    if (streamEnd === -1) break;

    let dataEnd = streamEnd;
    if (dataEnd > dataStart && bytes[dataEnd - 1] === 0x0a) dataEnd--;
    if (dataEnd > dataStart && bytes[dataEnd - 1] === 0x0d) dataEnd--;

    if (dataEnd > dataStart) {
      const streamBytes = bytes.subarray(dataStart, dataEnd);
      // Tenta descompactar
      const decompressedText = await decompressFlate(streamBytes);
      if (decompressedText) {
        const textInStream = extractTextFromPdfStream(decompressedText);
        if (textInStream) {
          extractedPieces.push(textInStream);
        }
      }
    }

    index = streamEnd + 9;
  }

  // Se não extraiu de streams ou para complementar com texto não compactado
  const latinText = new TextDecoder('latin1').decode(bytes);
  const rawTextFromLatin = extractTextFromPdfStream(latinText);
  if (rawTextFromLatin) {
    extractedPieces.push(rawTextFromLatin);
  }

  // Se for DOCX (Word XML)
  const docxMatches = latinText.match(/<w:t[^>]*>(.*?)<\/w:t>/gi);
  if (docxMatches && docxMatches.length > 0) {
    const docxText = docxMatches
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join(' ');
    extractedPieces.push(docxText);
  }

  return cleanRawString(extractedPieces.join('\n'));
}

/**
 * Tenta extrair texto utilizando o motor oficial Mozilla PDF.js via CDN ESM
 */
async function extractTextWithPdfJs(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const importDynamic = new Function('modulePath', 'return import(modulePath)');
    const pdfjsLib = await importDynamic('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm');
    if (pdfjsLib && pdfjsLib.getDocument) {
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
      }
      const copy = new Uint8Array(arrayBuffer.slice(0));
      const loadingTask = pdfjsLib.getDocument({ data: copy });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: unknown) => (item && typeof item === 'object' && 'str' in item ? String((item as { str: string }).str) : ''))
          .join(' ');
        fullText += ' ' + pageText;
      }
      return cleanRawString(fullText);
    }
  } catch (err) {
    console.warn('PDF.js dinâmico não disponível, prosseguindo com extrator nativo:', err);
  }
  return '';
}

export const curriculoParserService = {
  /**
   * Extrai o texto de um arquivo PDF ou DOCX/DOC diretamente no navegador.
   */
  async extractTextFromFile(file: File): Promise<string> {
    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const arrayBuffer = await file.arrayBuffer();

      if (isPdf) {
        // Tentativa 1: PDF.js (alta precisão para LinkedIn Profile.pdf e PDFs complexos)
        const pdfJsText = await extractTextWithPdfJs(arrayBuffer);
        if (pdfJsText && pdfJsText.length > 30) {
          return pdfJsText;
        }

        // Tentativa 2: Descompactador nativo DecompressionStream
        const nativePdfText = await extractTextFromPdfBuffer(arrayBuffer);
        if (nativePdfText && nativePdfText.length > 30) {
          return nativePdfText;
        }
      }

      // Tentativa 3: Para DOCX ou texto geral
      const generalText = await extractTextFromPdfBuffer(arrayBuffer);
      if (generalText.length > 50) {
        return generalText;
      }

      // Fallback para arquivo de texto puro
      const textFallback = await file.text();
      return cleanRawString(textFallback);
    } catch (err) {
      console.warn('Falha na extração de texto:', err);
      return '';
    }
  },

  /**
   * Processa o arquivo do currículo e extrai os campos estruturados.
   */
  async parseCurriculo(file: File): Promise<ExtractedCurriculoData> {
    const rawText = await this.extractTextFromFile(file);
    const normalizedText = rawText.toLowerCase();

    // 1. Extração de Competências (Match com as tags do mercado e FIA)
    const detectedSkills: string[] = [];
    KNOWN_SKILLS.forEach((skill) => {
      const lowerSkill = skill.toLowerCase();
      if (
        normalizedText.includes(lowerSkill) ||
        (skill === 'Excel Avançado' && (normalizedText.includes('excel avançado') || normalizedText.includes('advanced excel') || normalizedText.includes('excel'))) ||
        (skill === 'Inglês Avançado' && (normalizedText.includes('inglês avançado') || normalizedText.includes('english fluent') || normalizedText.includes('inglês fluente') || normalizedText.includes('fluent english')))
      ) {
        // Normaliza para o nome canônico
        const canonical = skill === 'Excel' && detectedSkills.includes('Excel Avançado') ? null : skill;
        if (canonical && !detectedSkills.includes(canonical)) {
          detectedSkills.push(canonical);
        }
      }
    });

    // Se detectou 'Excel Avançado', remove 'Excel' duplicado
    if (detectedSkills.includes('Excel Avançado')) {
      const idx = detectedSkills.indexOf('Excel');
      if (idx !== -1) detectedSkills.splice(idx, 1);
    }

    // 2. Extração de Graduações e Especializações (Suporte a Múltiplas Formações)
    const detectedCourses: string[] = [];

    // Busca no catálogo conhecido
    for (const course of KNOWN_COURSES) {
      if (normalizedText.includes(course.toLowerCase())) {
        // Evita duplicatas redundantes (ex: "Administração de Empresas" e "Administração")
        const alreadyCovered = detectedCourses.some(
          (c) => c.toLowerCase().includes(course.toLowerCase()) || course.toLowerCase().includes(c.toLowerCase())
        );
        if (!alreadyCovered) {
          detectedCourses.push(course);
        }
      }
    }

    // Busca padrões de Pós-graduação, MBA ou Mestrado
    const posMbaRegex = /(?:mba em|pós-graduação em|pos-graduacao em|mestrado em|especialização em)\s+([A-Za-záéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ\s]{4,35})/gi;
    let posMatch: RegExpExecArray | null;
    while ((posMatch = posMbaRegex.exec(rawText)) !== null) {
      const posTitle = posMatch[0].trim();
      const alreadyHas = detectedCourses.some((c) => c.toLowerCase() === posTitle.toLowerCase());
      if (!alreadyHas && detectedCourses.length < 3) {
        detectedCourses.push(posTitle);
      }
    }

    // Se não achou na lista direta, busca padrões como "Graduação em X" ou "Bacharelado em X"
    if (detectedCourses.length === 0) {
      const gradRegex = /(?:graduação em|bacharelado em|licenciatura em|curso de|estudante de)\s+([A-Za-záéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ\s]{4,35})/gi;
      let gradMatch: RegExpExecArray | null;
      while ((gradMatch = gradRegex.exec(rawText)) !== null) {
        const title = gradMatch[1].trim();
        if (!detectedCourses.includes(title)) {
          detectedCourses.push(title);
        }
      }
    }

    const detectedGraduacao = detectedCourses[0] || undefined;
    const detectedSegundaGraduacao = detectedCourses[1] || undefined;

    // 3. Extração de Idade
    let detectedIdade: number | undefined;
    const idadeMatch = rawText.match(/(\d{2})\s*(?:anos|ano|idade)/i);
    if (idadeMatch && idadeMatch[1]) {
      const parsedIdade = parseInt(idadeMatch[1], 10);
      if (parsedIdade >= 17 && parsedIdade <= 70) {
        detectedIdade = parsedIdade;
      }
    } else {
      // Tenta extrair a partir de ano de nascimento (ex: nascido em 2002 ou 1999)
      const anoMatch = rawText.match(/(?:nascido|nascimento|data de nascimento)[^0-9]*(\d{4})/i);
      if (anoMatch && anoMatch[1]) {
        const ano = parseInt(anoMatch[1], 10);
        const atual = new Date().getFullYear();
        if (ano >= 1960 && ano <= atual - 17) {
          detectedIdade = atual - ano;
        }
      }
    }

    // 4. Extração de Experiência
    let detectedExperiencia: string | undefined;
    const expRegex = /(?:experiência profissional|experiência|histórico profissional|experiências|experience)([\s\S]{30,500})/i;
    const expMatch = rawText.match(expRegex);
    if (expMatch && expMatch[1]) {
      detectedExperiencia = expMatch[1]
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,;:\-—–áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ]/gi, '')
        .trim();
    } else {
      // Busca menções de cargos comuns
      const cargosRegex = /(?:estágio|estagiário|analista|assistente|consultor|trainee|desenvolvedor|coordenador|gerente)[^.\n]{10,120}/gi;
      const cargos = rawText.match(cargosRegex);
      if (cargos && cargos.length > 0) {
        detectedExperiencia = cargos.slice(0, 3).join(' • ');
      }
    }

    // 5. Extração de Nome
    let detectedNome: string | undefined;

    // Se for o arquivo padrão do LinkedIn (Profile.pdf), o nome é tipicamente o primeiro bloco de texto
    const lines = rawText
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 3 && l.length <= 40 && !l.includes('@') && !l.includes('http') && !l.includes('.com'));

    for (const candidate of lines.slice(0, 5)) {
      // Valida se parece um nome próprio (2 a 4 palavras capitalizadas)
      const words = candidate.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        const isNamePattern = words.every((w) => /^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+$/i.test(w));
        if (isNamePattern) {
          detectedNome = candidate;
          break;
        }
      }
    }

    return {
      nome: detectedNome,
      idade: detectedIdade,
      graduacao: detectedGraduacao,
      segundaGraduacao: detectedSegundaGraduacao,
      graduacoes: detectedCourses,
      experiencia: detectedExperiencia,
      competencias: detectedSkills,
      rawTextPreview: rawText.slice(0, 300),
    };
  },
};

/**
 * Remove caracteres de controle estranhos de fluxos binários de PDF/Word.
 */
function cleanRawString(str: string): string {
  return str
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

