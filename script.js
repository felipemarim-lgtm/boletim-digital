/* =========================================================
   BOLETIM DIGITAL — 8º ANO
   Dados fictícios + lógica de notas, médias, faltas e situação
   ========================================================= */

/* ---------- DADOS BRUTOS (fictícios) ---------- */
// Array de objetos: cada objeto é uma disciplina com suas notas e faltas.
const disciplinas = [
  { disciplina: "Língua Portuguesa",       tri1: 82,   tri2: "7,8", tri3: 85,   faltas: [2, 1, 1] },
  { disciplina: "Matemática",              tri1: 52,   tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências",                tri1: "8,1",tri2: 76,    tri3: 8.0,  faltas: [1, 2, 0] },
  { disciplina: "História",                tri1: 7.0,  tri2: 84,    tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia",               tri1: 68,   tri2: 7.3,   tri3: "7,9",faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa",          tri1: 86,   tri2: "8,1", tri3: 8.7,  faltas: [1, 0, 0] },
  { disciplina: "Arte",                    tri1: 9.0,  tri2: 92,    tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física",         tri1: 95,   tri2: 9.0,   tri3: "9,4",faltas: [0, 1, 0] },
  { disciplina: "Educação Digital",        tri1: 88,   tri2: 9.1,   tri3: 93,   faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira",     tri1: 74,   tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado",        tri1: 8.0,  tri2: 83,    tri3: "8,5",faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura",       tri1: 62,   tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico",       tri1: 48,   tri2: 5.6,   tri3: "6,0",faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais",  tri1: 58,   tri2: "6,2", tri3: 6.4,  faltas: [1, 1, 1] }
];

// Média mínima de referência
const MEDIA_MINIMA = 6.0;

// Frequência FICTÍCIA apenas para demonstração nesta primeira versão.
// No futuro, este valor será tratado de outra forma (não vem das faltas).
const FREQUENCIA_DEMONSTRATIVA = 92;

/* ---------- FUNÇÕES AUXILIARES ---------- */

// Normaliza um valor de nota para a escala 0–10.
// Retorna null quando a nota ainda não foi lançada.
// Retorna null também quando o valor é inválido.
function normalizarNota(valor) {
  // vazio, null ou undefined → ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for string, troca vírgula por ponto e tenta converter
  let numero;
  if (typeof valor === "string") {
    numero = parseFloat(valor.replace(",", "."));
  } else {
    numero = Number(valor);
  }

  // Se não for um número válido, retorna null
  if (isNaN(numero)) {
    return null;
  }

  // Regras da escala
  if (numero >= 0 && numero <= 10) {
    return numero;              // 0 a 10 → mantém
  }
  if (numero > 10 && numero <= 100) {
    return numero / 10;         // 11 a 100 → divide por 10
  }

  // Fora das regras → inválida
  return null;
}

// Formata a nota para exibição (ex.: 8.5 → "8,5")
function formatarNota(nota) {
  if (nota === null) return "Ainda não lançada";
  return nota.toFixed(1).replace(".", ",");
}

// Calcula a média usando SOMENTE as notas disponíveis.
// Nota ausente NUNCA vira zero.
function calcularMedia(notasNormalizadas) {
  const validas = notasNormalizadas.filter(function (n) {
    return n !== null;
  });

  if (validas.length === 0) return null;

  const soma = validas.reduce(function (acc, n) {
    return acc + n;
  }, 0);

  return soma / validas.length;
}

// Decide a situação de uma disciplina
function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  if (media >= MEDIA_MINIMA) return "Bom desempenho";
  return "Atenção";
}

// Soma as faltas dos trimestres
function somarFaltas(faltas) {
  return faltas.reduce(function (acc, f) {
    return acc + f;
  }, 0);
}

/* ---------- PROCESSAMENTO DOS DADOS ---------- */

// Vamos transformar cada disciplina em um objeto já calculado.
const disciplinasCalculadas = disciplinas.map(function (d) {
  const n1 = normalizarNota(d.tri1);
  const n2 = normalizarNota(d.tri2);
  const n3 = normalizarNota(d.tri3);

  const media = calcularMedia([n1, n2, n3]);
  const faltasTotais = somarFaltas(d.faltas);
  const situacao = definirSituacao(media);

  return {
    disciplina: d.disciplina,
    tri1: n1,
    tri2: n2,
    tri3: n3,
    media: media,
    faltas: faltasTotais,
    situacao: situacao
  };
});

/* ---------- PREENCHER A TABELA (DOM) ---------- */

const corpoTabela = document.getElementById("corpo-tabela");

disciplinasCalculadas.forEach(function (d) {
  const linha = document.createElement("tr");

  // Classe da situação para colorir
  let classeSituacao = "situacao-sem-nota";
  if (d.situacao === "Bom desempenho") classeSituacao = "situacao-bom";
  if (d.situacao === "Atenção") classeSituacao = "situacao-atencao";

  linha.innerHTML =
    "<td>" + d.disciplina + "</td>" +
    "<td>" + formatarNota(d.tri1) + "</td>" +
    "<td>" + formatarNota(d.tri2) + "</td>" +
    "<td>" + formatarNota(d.tri3) + "</td>" +
    "<td>" + formatarNota(d.media) + "</td>" +
    "<td>" + d.faltas + "</td>" +
    "<td class='" + classeSituacao + "'>" + d.situacao + "</td>";

  corpoTabela.appendChild(linha);
});

/* ---------- PREENCHER OS CARDS DE RESUMO ---------- */

// Média geral: média das médias disponíveis
function calcularMediaGeral(lista) {
  const medias = lista
    .map(function (d) { return d.media; })
    .filter(function (m) { return m !== null; });

  if (medias.length === 0) return null;

  const soma = medias.reduce(function (acc, m) { return acc + m; }, 0);
  return soma / medias.length;
}

const mediaGeral = calcularMediaGeral(disciplinasCalculadas);
const totalFaltas = disciplinasCalculadas.reduce(function (acc, d) {
  return acc + d.faltas;
}, 0);

const qtdBomDesempenho = disciplinasCalculadas.filter(function (d) {
  return d.situacao === "Bom desempenho";
}).length;

const qtdAtencao = disciplinasCalculadas.filter(function (d) {
  return d.situacao === "Atenção";
}).length;

// Escreve os valores nos cards
document.getElementById("card-media-geral").textContent =
  mediaGeral === null ? "—" : formatarNota(mediaGeral);

document.getElementById("card-total-faltas").textContent = totalFaltas;

document.getElementById("card-bom-desempenho").textContent =
  qtdBomDesempenho + " disciplinas";

document.getElementById("card-atencao").textContent =
  qtdAtencao + " disciplinas";

document.getElementById("card-frequencia").textContent =
  FREQUENCIA_DEMONSTRATIVA + "%";

document.getElementById("card-frequencia-obs").textContent =
  "Frequência adequada";