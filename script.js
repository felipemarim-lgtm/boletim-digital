/* =========================================================
   BOLETIM DIGITAL — 8º ANO — TURMA 8C — CHAMADA 38
   Dados fictícios + lógica de notas, médias, faltas e situação
   + Acesso por PIN + API do professor
   + Gráficos (Chart.js) — camada somente leitura
   ========================================================= */

/* ---------- CONFIGURAÇÃO FIXA DO ALUNO ---------- */
const CONFIG_ALUNO = {
  turma: "8C",
  numeroChamada: 38,
  apiUrl: "https://boletim-api.profbt.com.br"
};

/* ---------- CONSTANTES PEDAGÓGICAS ---------- */
const MEDIA_MINIMA = 6.0;
const FREQUENCIA_DEMONSTRATIVA = 92;

/* ---------- DADOS BRUTOS (fictícios) ---------- */
// Array de objetos: cada objeto é uma disciplina com suas notas e faltas.
// Observação: 2º Tri e 3º Tri ainda não foram lançados (null).
const disciplinas = [
  { disciplina: "Língua Portuguesa",           tri1: "2,9", tri2: null, tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Matemática",                  tri1: "0,9", tri2: null, tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências",                    tri1: "5,0", tri2: null, tri3: null, faltas: [1, 2, 0] },
  { disciplina: "História",                    tri1: "6,1", tri2: null, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia",                   tri1: "1,0", tri2: null, tri3: null, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa",              tri1: "6,0", tri2: null, tri3: null, faltas: [1, 0, 0] },
  { disciplina: "Arte",                        tri1: "4,9", tri2: null, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física",             tri1: "6,1", tri2: null, tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital",            tri1: "0,1", tri2: null, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira",         tri1: "10,0",tri2: null, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado",            tri1: "3,0", tri2: null, tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura",           tri1: "2,1", tri2: null, tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico",           tri1: "3,4", tri2: null, tri3: null, faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "2,4", tri2: null, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais",      tri1: "9,6", tri2: null, tri3: null, faltas: [1, 1, 1] }
];

/* ---------- ESTADO DA SESSÃO (apenas em memória) ---------- */
let pinSessao = null;
let dadosAtuais = null;

/* ---------- ESTADO DOS GRÁFICOS (somente leitura) ---------- */
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Referência interna de risco — usada SOMENTE para avaliar situação geral.
// NUNCA deve ser exibida na interface.
const REFERENCIA_FALTAS_PERIGO = 350;

/* ---------- FUNÇÕES AUXILIARES (originais) ---------- */

// Normaliza um valor de nota para a escala 0–10.
// Retorna null quando a nota ainda não foi lançada.
// Retorna null também quando o valor é inválido.
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  let numero;
  if (typeof valor === "string") {
    numero = parseFloat(valor.replace(",", "."));
  } else {
    numero = Number(valor);
  }

  if (isNaN(numero)) {
    return null;
  }

  if (numero >= 0 && numero <= 10) {
    return numero;
  }
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

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

// Média geral: média das médias disponíveis
function calcularMediaGeral(lista) {
  const medias = lista
    .map(function (d) { return d.media; })
    .filter(function (m) { return m !== null; });

  if (medias.length === 0) return null;

  const soma = medias.reduce(function (acc, m) { return acc + m; }, 0);
  return soma / medias.length;
}

/* ---------- CÓPIA E CONVERSÃO DE DADOS ---------- */

// Deep copy das disciplinas locais
function copiarDisciplinasLocais() {
  return disciplinas.map(function (d) {
    return {
      disciplina: d.disciplina,
      tri1: d.tri1,
      tri2: d.tri2,
      tri3: d.tri3,
      faltas: d.faltas.slice()
    };
  });
}

// Converte os dados recebidos da API para o formato local
function converterDadosAPI(dados) {
  if (!dados || !Array.isArray(dados.disciplinas)) return null;

  return dados.disciplinas.map(function (item) {
    let nome = "";
    if (item && item.disciplina !== undefined && item.disciplina !== null) {
      nome = String(item.disciplina);
    } else if (item && item.nome !== undefined && item.nome !== null) {
      nome = String(item.nome);
    }

    let faltas = [];
    if (item && Array.isArray(item.faltas)) {
      faltas = item.faltas.slice(0, 3);
    } else if (item) {
      faltas = [item.faltas1, item.faltas2, item.faltas3];
    }
    faltas = faltas.map(function (f) {
      const n = Number(f);
      return isFinite(n) ? n : 0;
    });
    while (faltas.length < 3) faltas.push(0);

    function escolher() {
      for (let i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined) return arguments[i];
      }
      return null;
    }

    return {
      disciplina: nome,
      tri1: escolher(item && item.tri1, item && item.nota1, null),
      tri2: escolher(item && item.tri2, item && item.nota2, null),
      tri3: escolher(item && item.tri3, item && item.nota3, null),
      faltas: faltas
    };
  });
}

// Processa a lista para cálculo (notas normalizadas, médias, situação)
function processarDisciplinas(lista) {
  return lista.map(function (d) {
    const n1 = normalizarNota(d.tri1);
    const n2 = normalizarNota(d.tri2);
    const n3 = normalizarNota(d.tri3);

    const faltas = (d.faltas && d.faltas.length === 3) ? d.faltas.slice() : [0, 0, 0];

    const media = calcularMedia([n1, n2, n3]);
    const faltasTotais = somarFaltas(faltas);
    const situacao = definirSituacao(media);

    return {
      disciplina: d.disciplina,
      tri1: n1,
      tri2: n2,
      tri3: n3,
      faltas: faltas,
      faltasTotais: faltasTotais,
      media: media,
      situacao: situacao
    };
  });
}

/* ---------- ELEMENTOS DO DOM ---------- */
const telaAcesso = document.getElementById("tela-acesso");
const boletimConteudo = document.getElementById("boletim-conteudo");
const formAcesso = document.getElementById("form-acesso");
const campoPin = document.getElementById("campo-pin");
const btnEntrar = document.getElementById("btn-entrar");
const msgAcesso = document.getElementById("msg-acesso");
const msgBoletim = document.getElementById("msg-boletim");

const corpoTabela = document.getElementById("corpo-tabela");
const corpoEditor = document.getElementById("corpo-editor");
const editorSec = document.getElementById("editor");
const btnAlterar = document.getElementById("btn-alterar");
const btnSalvar = document.getElementById("btn-salvar");
const btnCancelar = document.getElementById("btn-cancelar");
const msgEditor = document.getElementById("msg-editor");

/* ---------- RENDERIZAÇÃO ---------- */

function renderizarTudo() {
  const calc = processarDisciplinas(dadosAtuais);
  renderizarTabela(calc);
  renderizarCards(calc);
  atualizarGraficos(calc); // única adição: atualiza gráficos após tabela/cards
}

function renderizarTabela(calc) {
  corpoTabela.innerHTML = "";

  calc.forEach(function (d) {
    const linha = document.createElement("tr");

    let classeSituacao = "situacao-sem-nota";
    if (d.situacao === "Bom desempenho") classeSituacao = "situacao-bom";
    if (d.situacao === "Atenção") classeSituacao = "situacao-atencao";

    const tdDisc = document.createElement("td");
    tdDisc.textContent = d.disciplina;
    linha.appendChild(tdDisc);

    const td1 = document.createElement("td");
    td1.textContent = formatarNota(d.tri1);
    linha.appendChild(td1);

    const td2 = document.createElement("td");
    td2.textContent = formatarNota(d.tri2);
    linha.appendChild(td2);

    const td3 = document.createElement("td");
    td3.textContent = formatarNota(d.tri3);
    linha.appendChild(td3);

    const tdM = document.createElement("td");
    tdM.textContent = formatarNota(d.media);
    linha.appendChild(tdM);

    const tdF = document.createElement("td");
    tdF.textContent = d.faltasTotais;
    linha.appendChild(tdF);

    const tdS = document.createElement("td");
    tdS.className = classeSituacao;
    tdS.textContent = d.situacao;
    linha.appendChild(tdS);

    corpoTabela.appendChild(linha);
  });
}

function renderizarCards(calc) {
  const mediaGeral = calcularMediaGeral(calc);
  const totalFaltas = calc.reduce(function (acc, d) {
    return acc + d.faltasTotais;
  }, 0);
  const qtdBom = calc.filter(function (d) {
    return d.situacao === "Bom desempenho";
  }).length;
  const qtdAtencao = calc.filter(function (d) {
    return d.situacao === "Atenção";
  }).length;

  document.getElementById("card-media-geral").textContent =
    mediaGeral === null ? "—" : formatarNota(mediaGeral);

  document.getElementById("card-total-faltas").textContent = totalFaltas;

  document.getElementById("card-bom-desempenho").textContent =
    qtdBom + " disciplinas";

  document.getElementById("card-atencao").textContent =
    qtdAtencao + " disciplinas";

  document.getElementById("card-frequencia").textContent =
    FREQUENCIA_DEMONSTRATIVA + "%";

  document.getElementById("card-frequencia-obs").textContent =
    "Frequência adequada";
}

/* ---------- EDITOR ---------- */

function formatarValorEditorNota(v) {
  const n = normalizarNota(v);
  if (n === null) return "";
  return n.toFixed(1).replace(".", ",");
}

function abrirEditor() {
  corpoEditor.innerHTML = "";
  msgEditor.textContent = "";
  msgEditor.className = "mensagem";

  dadosAtuais.forEach(function (d, index) {
    const tr = document.createElement("tr");

    const tdDisc = document.createElement("td");
    tdDisc.textContent = d.disciplina;
    tr.appendChild(tdDisc);

    ["tri1", "tri2", "tri3"].forEach(function (campo) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("inputmode", "decimal");
      input.setAttribute("data-index", String(index));
      input.setAttribute("data-campo", campo);
      input.value = formatarValorEditorNota(d[campo]);
      td.appendChild(input);
      tr.appendChild(td);
    });

    for (let i = 0; i < 3; i++) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("data-index", String(index));
      input.setAttribute("data-campo", "falta" + (i + 1));
      input.value = (d.faltas[i] !== null && d.faltas[i] !== undefined)
        ? String(d.faltas[i])
        : "";
      td.appendChild(input);
      tr.appendChild(td);
    }

    corpoEditor.appendChild(tr);
  });

  editorSec.hidden = false;
  btnAlterar.disabled = true;
}

function fecharEditor() {
  editorSec.hidden = true;
  btnAlterar.disabled = false;
  corpoEditor.innerHTML = "";
  msgEditor.textContent = "";
  msgEditor.className = "mensagem";
}

/* ---------- VALIDAÇÃO (regra do editor) ---------- */

// Nota digitada pelo aluno: aceitar 0 a 10, ponto/vírgula, vazio → null.
// Rejeitar 75, 82, 100, -1, 11, "abc".
function parseNotaEditor(str) {
  if (str === null || str === undefined) return { valido: true, valor: null };
  const s = String(str).trim();
  if (s === "") return { valido: true, valor: null };

  const num = parseFloat(s.replace(",", "."));
  if (isNaN(num)) return { valido: false };
  if (num < 0 || num > 10) return { valido: false };

  return { valido: true, valor: num };
}

// Falta digitada: inteiro >= 0. Rejeitar vazio, -1, 2,5, "abc".
function parseFaltaEditor(str) {
  if (str === null || str === undefined) return { valido: false };
  const s = String(str).trim();
  if (s === "") return { valido: false };
  if (!/^\d+$/.test(s)) return { valido: false };

  const num = parseInt(s, 10);
  if (!isFinite(num) || num < 0) return { valido: false };
  return { valido: true, valor: num };
}

/* ---------- SALVAR NA API ---------- */

async function salvarAlteracoes() {
  msgEditor.textContent = "";
  msgEditor.className = "mensagem";

  const inputs = corpoEditor.querySelectorAll("input");
  inputs.forEach(function (inp) { inp.classList.remove("invalido"); });

  const novoDados = dadosAtuais.map(function (d) {
    return {
      disciplina: d.disciplina,
      tri1: d.tri1,
      tri2: d.tri2,
      tri3: d.tri3,
      faltas: d.faltas.slice()
    };
  });

  let temErro = false;

  inputs.forEach(function (inp) {
    const index = parseInt(inp.getAttribute("data-index"), 10);
    const campo = inp.getAttribute("data-campo");

    if (campo === "tri1" || campo === "tri2" || campo === "tri3") {
      const r = parseNotaEditor(inp.value);
      if (!r.valido) {
        inp.classList.add("invalido");
        temErro = true;
      } else {
        novoDados[index][campo] = r.valor;
      }
    } else if (campo && campo.indexOf("falta") === 0) {
      const idx = parseInt(campo.replace("falta", ""), 10) - 1;
      const r = parseFaltaEditor(inp.value);
      if (!r.valido) {
        inp.classList.add("invalido");
        temErro = true;
      } else {
        novoDados[index].faltas[idx] = r.valor;
      }
    }
  });

  if (temErro) {
    msgEditor.textContent = "Preencha os campos em vermelho com valores válidos.";
    msgEditor.className = "mensagem erro";
    return;
  }

  const textoOriginal = btnSalvar.textContent;
  btnSalvar.disabled = true;
  btnSalvar.textContent = "Salvando...";
  msgEditor.textContent = "Salvando...";
  msgEditor.className = "mensagem";

  try {
    const resp = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/salvar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: { disciplinas: novoDados }
      })
    });

    if (!resp.ok) {
      throw new Error("HTTP " + resp.status);
    }

    dadosAtuais = novoDados;
    renderizarTudo();
    fecharEditor();

    msgBoletim.textContent = "Dados salvos com sucesso.";
    msgBoletim.className = "mensagem sucesso";
    setTimeout(function () {
      msgBoletim.textContent = "";
      msgBoletim.className = "mensagem";
    }, 3000);
  } catch (err) {
    msgEditor.textContent = "Falha ao salvar. Verifique a conexão e tente novamente.";
    msgEditor.className = "mensagem erro";
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = textoOriginal;
  }
}

/* ---------- ACESSO (PIN + API) ---------- */

async function tentarEntrar(evento) {
  evento.preventDefault();

  const pin = campoPin.value.trim();
  if (!pin) {
    msgAcesso.textContent = "Digite o PIN.";
    msgAcesso.className = "mensagem erro";
    return;
  }

  btnEntrar.disabled = true;
  msgAcesso.textContent = "Conectando...";
  msgAcesso.className = "mensagem";

  try {
    const resp = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pin
      })
    });

    if (resp.status === 401) {
      msgAcesso.textContent = "Turma, chamada ou PIN inválidos.";
      msgAcesso.className = "mensagem erro";
      return;
    }
    if (resp.status === 429) {
      msgAcesso.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      msgAcesso.className = "mensagem erro";
      return;
    }
    if (!resp.ok) {
      throw new Error("HTTP " + resp.status);
    }

    const json = await resp.json();

    let dadosAPI = null;
    if (json && json.dados !== null && json.dados !== undefined) {
      dadosAPI = converterDadosAPI(json.dados);
    }

    if (dadosAPI !== null && dadosAPI.length > 0) {
      dadosAtuais = dadosAPI;
    } else {
      dadosAtuais = copiarDisciplinasLocais();
    }

    pinSessao = pin;
    campoPin.value = "";

    telaAcesso.hidden = true;
    boletimConteudo.hidden = false;

    msgAcesso.textContent = "";
    msgAcesso.className = "mensagem";
    msgBoletim.textContent = "";
    msgBoletim.className = "mensagem";

    renderizarTudo();
  } catch (err) {
    msgAcesso.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    msgAcesso.className = "mensagem erro";
  } finally {
    btnEntrar.disabled = false;
  }
}

/* ---------- LIGAÇÕES DE EVENTOS ---------- */

formAcesso.addEventListener("submit", tentarEntrar);
btnAlterar.addEventListener("click", abrirEditor);
btnSalvar.addEventListener("click", salvarAlteracoes);
btnCancelar.addEventListener("click", fecharEditor);

/* =========================================================
   GRÁFICOS (Chart.js) — camada SOMENTE LEITURA
   Não altera dadosAtuais, não chama a API, não toca no editor.
   ========================================================= */

// Agregadora — chamada no final de renderizarTudo()
function atualizarGraficos(calc) {
  // Se não receber a lista pronta, processa dadosAtuais sem mutar nada.
  const lista = calc || (dadosAtuais ? processarDisciplinas(dadosAtuais) : []);
  atualizarGraficoMedias(lista);
  atualizarGraficoEvolucao(lista);
  atualizarGraficoFaltas(lista);
}

/* --- Gráfico 1: Média por disciplina (barras horizontais) --- */
function atualizarGraficoMedias(lista) {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas) return;

  if (graficoMedias) {
    graficoMedias.destroy();
    graficoMedias = null;
  }

  // Somente leitura: cria arrays novos a partir da lista recebida.
  const labels = lista.map(function (d) { return d.disciplina; });
  const valores = lista.map(function (d) { return d.media; }); // null quando sem nota

  // Cor por situação — verde musgo para bom, ferrugem para atenção, cinza para sem nota
  const cores = lista.map(function (d) {
    if (d.media === null) return "rgba(120, 100, 80, 0.45)";
    if (d.situacao === "Bom desempenho") return "rgba(74, 93, 58, 0.9)";
    return "rgba(122, 43, 30, 0.9)";
  });

  graficoMedias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Média",
        data: valores,
        backgroundColor: cores,
        borderColor: "#1a1512",
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: { color: "#e8d9b5" },
          grid: { color: "rgba(232, 217, 181, 0.15)" }
        },
        y: {
          ticks: { color: "#e8d9b5", font: { size: 11 } },
          grid: { color: "rgba(232, 217, 181, 0.08)" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (contexto) {
              const v = contexto.parsed.x;
              if (v === null || v === undefined) return "Ainda não lançada";
              return "Média: " + v.toFixed(1).replace(".", ",");
            }
          }
        }
      }
    }
  });
}

/* --- Gráfico 2: Evolução da média geral (linha) --- */
function atualizarGraficoEvolucao(lista) {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas) return;

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
    graficoEvolucao = null;
  }

  // Média de cada trimestre usando apenas notas disponíveis (null não entra).
  function mediaTrimestre(campo) {
    const notas = lista
      .map(function (d) { return d[campo]; })
      .filter(function (n) { return n !== null; });
    if (notas.length === 0) return null;
    const soma = notas.reduce(function (acc, n) { return acc + n; }, 0);
    return soma / notas.length;
  }

  const valores = [
    mediaTrimestre("tri1"),
    mediaTrimestre("tri2"),
    mediaTrimestre("tri3")
  ];

  graficoEvolucao = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média geral",
        data: valores,
        borderColor: "#a86b3c",
        backgroundColor: "rgba(168, 107, 60, 0.25)",
        tension: 0.3,
        spanGaps: false,
        pointRadius: 6,
        pointBackgroundColor: "#7a2b1e",
        pointBorderColor: "#e8d9b5",
        pointBorderWidth: 2,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { color: "#e8d9b5" },
          grid: { color: "rgba(232, 217, 181, 0.15)" }
        },
        x: {
          ticks: { color: "#e8d9b5" },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (contexto) {
              const v = contexto.parsed.y;
              if (v === null || v === undefined) return "Sem notas";
              return "Média: " + v.toFixed(1).replace(".", ",");
            }
          }
        }
      }
    }
  });
}

/* --- Gráfico 3: Faltas por trimestre (3 barras) --- */
function atualizarGraficoFaltas(lista) {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas) return;

  if (graficoFaltas) {
    graficoFaltas.destroy();
    graficoFaltas = null;
  }

  // Soma por índice do array faltas — sem mutar dados originais.
  let faltasTri1 = 0;
  let faltasTri2 = 0;
  let faltasTri3 = 0;

  lista.forEach(function (d) {
    const f = d.faltas || [0, 0, 0];
    faltasTri1 += f[0] || 0;
    faltasTri2 += f[1] || 0;
    faltasTri3 += f[2] || 0;
  });

  // Total acumulado — usado SOMENTE para avaliar risco interno.
  const totalFaltas = faltasTri1 + faltasTri2 + faltasTri3;

  // Badge "Perigo" e destaque visual do card (quando aplicável).
  const estadoEl = document.getElementById("estadoFaltas");
  const cardFaltas = document.getElementById("graficoCardFaltas");
  if (estadoEl && cardFaltas) {
    if (totalFaltas >= REFERENCIA_FALTAS_PERIGO) {
      estadoEl.innerHTML = '<span class="badge-perigo">Perigo</span>';
      cardFaltas.classList.add("critico");
    } else {
      estadoEl.innerHTML = "";
      cardFaltas.classList.remove("critico");
    }
  }

  graficoFaltas = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Faltas",
        data: [faltasTri1, faltasTri2, faltasTri3],
        backgroundColor: [
          "rgba(122, 43, 30, 0.9)",
          "rgba(168, 107, 60, 0.9)",
          "rgba(74, 93, 58, 0.9)"
        ],
        borderColor: "#1a1512",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#e8d9b5", precision: 0 },
          grid: { color: "rgba(232, 217, 181, 0.15)" }
        },
        x: {
          ticks: { color: "#e8d9b5" },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (contexto) {
              const v = contexto.parsed.y;
              return contexto.label + ": " + v + " falta" + (v === 1 ? "" : "s");
            }
          }
        }
      }
    }
  });
}