// ============================================
// 1. CONFIGURAÇÃO DA API — Open-Meteo (não exige chave)
// ============================================
// A Open-Meteo trabalha em duas etapas: primeiro a geocodificação
// transforma o nome da cidade em latitude/longitude, depois a consulta
// de clima usa essas coordenadas.
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const CLIMA_URL = "https://api.open-meteo.com/v1/forecast";

// ============================================
// 2. ELEMENTOS DA PÁGINA
// ============================================
const botaoBuscar = document.getElementById("buscar");
const campoCidade = document.getElementById("cidade");
const resultado = document.getElementById("resultado");
const historico = document.getElementById("historico");
const listaHistorico = document.getElementById("listaHistorico");

// ============================================
// MELHORIA 1 — tradução do weather_code
// A Open-Meteo não devolve a condição climática por escrito, só um
// número (weather_code) no padrão WMO. Esta tabela transforma o número
// em texto e ícone para o usuário entender.
// ============================================
const TEMPOS = {
  0: { icone: "☀️", texto: "Céu limpo" },
  1: { icone: "🌤️", texto: "Predominantemente limpo" },
  2: { icone: "⛅", texto: "Parcialmente nublado" },
  3: { icone: "☁️", texto: "Nublado" },
  45: { icone: "🌫️", texto: "Nevoeiro" },
  48: { icone: "🌫️", texto: "Nevoeiro com geada" },
  51: { icone: "🌦️", texto: "Garoa fraca" },
  53: { icone: "🌦️", texto: "Garoa moderada" },
  55: { icone: "🌦️", texto: "Garoa forte" },
  56: { icone: "🌧️", texto: "Garoa congelante fraca" },
  57: { icone: "🌧️", texto: "Garoa congelante forte" },
  61: { icone: "🌧️", texto: "Chuva fraca" },
  63: { icone: "🌧️", texto: "Chuva moderada" },
  65: { icone: "🌧️", texto: "Chuva forte" },
  66: { icone: "🌧️", texto: "Chuva congelante fraca" },
  67: { icone: "🌧️", texto: "Chuva congelante forte" },
  71: { icone: "🌨️", texto: "Neve fraca" },
  73: { icone: "🌨️", texto: "Neve moderada" },
  75: { icone: "🌨️", texto: "Neve forte" },
  77: { icone: "🌨️", texto: "Grãos de neve" },
  80: { icone: "🌦️", texto: "Pancadas de chuva fracas" },
  81: { icone: "🌧️", texto: "Pancadas de chuva moderadas" },
  82: { icone: "🌧️", texto: "Pancadas de chuva fortes" },
  85: { icone: "🌨️", texto: "Pancadas de neve fracas" },
  86: { icone: "🌨️", texto: "Pancadas de neve fortes" },
  95: { icone: "⛈️", texto: "Trovoada" },
  96: { icone: "⛈️", texto: "Trovoada com granizo leve" },
  99: { icone: "⛈️", texto: "Trovoada com granizo forte" }
};

function descreverTempo(codigo) {
  return TEMPOS[codigo] || { icone: "🌡️", texto: "Condição não identificada" };
}

// ============================================
// 3. LIGA O BOTÃO À FUNÇÃO
// ============================================
botaoBuscar.addEventListener("click", buscarClima);

// Permite também pesquisar pressionando Enter
campoCidade.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    buscarClima();
  }
});

// ============================================
// 4. FUNÇÃO PRINCIPAL
// ============================================
function buscarClima() {
  const cidade = campoCidade.value.trim();

  // Validação: nunca enviar uma requisição vazia para a API
  if (cidade === "") {
    mostrarErro("Digite o nome de uma cidade.");
    campoCidade.focus();
    return;
  }

  mostrarCarregando();

  // 1) Descobre a latitude e a longitude da cidade digitada
  const urlBusca =
    `${GEO_URL}?name=${encodeURIComponent(cidade)}` +
    `&count=1&language=pt&format=json`;

  let local = null;

  fetch(urlBusca)
    .then(resposta => {
      if (!resposta.ok) {
        throw new Error("Falha na busca da cidade.");
      }
      return resposta.json();
    })
    .then(dadosCidade => {
      // A Open-Meteo NÃO devolve erro HTTP quando a cidade não existe:
      // ela simplesmente responde sem a lista "results".
      if (!dadosCidade.results || dadosCidade.results.length === 0) {
        const erro = new Error("Cidade não encontrada.");
        erro.tipo = "cidade";
        throw erro;
      }

      local = dadosCidade.results[0];

      // 2) Usa a latitude e a longitude para consultar o clima
      const urlClima =
        `${CLIMA_URL}?latitude=${local.latitude}` +
        `&longitude=${local.longitude}` +
        `&current=temperature_2m,relative_humidity_2m` +
        `,apparent_temperature,wind_speed_10m,weather_code,is_day` +
        `&timezone=auto`;

      return fetch(urlClima);
    })
    .then(resposta => {
      if (!resposta.ok) {
        throw new Error("Falha na consulta do clima.");
      }
      return resposta.json();
    })
    .then(dadosClima => {
      const atual = dadosClima.current;
      mostrarResultado(local, atual);
      salvarNoHistorico(local.name);
    })
    .catch(erro => {
      console.error(erro);
      // Mensagens diferentes: cidade inexistente não é o mesmo problema
      // que falta de internet.
      if (erro.tipo === "cidade") {
        mostrarErro(
          `Não encontramos a cidade "${cidade}". ` +
          `Confira a escrita e tente novamente.`
        );
      } else {
        mostrarErro(
          "Não foi possível consultar o clima agora. " +
          "Verifique sua conexão e tente novamente."
        );
      }
    })
    .finally(() => {
      botaoBuscar.disabled = false;
      botaoBuscar.textContent = "Buscar clima";
    });
}

// ============================================
// 5. FUNÇÕES DE EXIBIÇÃO
// ============================================

// Estado de carregamento: o botão fica desabilitado para evitar
// cliques repetidos enquanto a requisição está em andamento.
function mostrarCarregando() {
  botaoBuscar.disabled = true;
  botaoBuscar.textContent = "Consultando...";
  resultado.replaceChildren();
  const aviso = document.createElement("p");
  aviso.textContent = "Consultando o clima...";
  resultado.append(aviso);
}

function mostrarErro(texto) {
  resultado.replaceChildren();
  const aviso = document.createElement("p");
  aviso.className = "mensagem-erro";
  aviso.textContent = texto;
  resultado.append(aviso);
}

// ============================================
// MELHORIA 4 — ilustrações em SVG e fundo que muda com o tempo
// Cada weather_code vira uma categoria; a categoria define o desenho
// (SVG feito no código, sem imagens externas) e as cores do fundo.
// O parâmetro is_day da API diz se é dia ou noite.
// ============================================
function categoria(codigo) {
  if (codigo === 0 || codigo === 1) return "limpo";
  if (codigo === 2) return "parcial";
  if (codigo === 3) return "nublado";
  if (codigo === 45 || codigo === 48) return "nevoeiro";
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return "neve";
  if (codigo >= 95) return "trovoada";
  return "chuva";
}

const NUVEM = '<path class="nuvem" d="M22 50a13 13 0 0 1-1-26 18 18 0 0 1 35-2 14 14 0 0 1 2 28z"/>';
const SOL = '<g class="sol"><circle cx="40" cy="30" r="13"/>' +
  '<path d="M58 30h6M52.7 42.7l4.3 4.3M40 48v6M27.3 42.7L23 47M22 30h-6M27.3 17.3L23 13M40 12V6M52.7 17.3L57 13"/></g>';
const LUA = '<path class="lua" d="M48 10a22 22 0 1 0 18 34 17 17 0 0 1-18-34z"/>';

function desenharIcone(tipo, dia) {
  const astro = dia ? SOL : LUA;
  const nuvemAlta = '<g transform="translate(0 -4)">' + NUVEM + '</g>';
  let corpo;
  if (tipo === "limpo") {
    corpo = astro;
  } else if (tipo === "parcial") {
    corpo = '<g transform="translate(-10 -8) scale(.8)">' + astro + '</g>' +
            '<g transform="translate(8 8)">' + NUVEM + '</g>';
  } else if (tipo === "nublado") {
    corpo = '<g class="nuvem cinza" transform="translate(24 0) scale(.75)">' + NUVEM + '</g>' +
            '<g transform="translate(-2 8)">' + NUVEM + '</g>';
  } else if (tipo === "nevoeiro") {
    corpo = nuvemAlta + '<path class="traco-nevoa" d="M16 56h46M24 63h34"/>';
  } else if (tipo === "neve") {
    corpo = nuvemAlta + '<circle class="floco" cx="28" cy="57" r="2.5"/>' +
            '<circle class="floco" cx="42" cy="63" r="2.5"/><circle class="floco" cx="56" cy="57" r="2.5"/>';
  } else if (tipo === "trovoada") {
    corpo = '<g class="nuvem escura" transform="translate(0 -6)">' + NUVEM + '</g>' +
            '<polygon class="raio" points="42,42 33,57 41,57 37,68 52,49 44,49 48,42"/>';
  } else {
    corpo = nuvemAlta + '<path class="traco-chuva" d="M28 54l-3 9M42 54l-3 9M56 54l-3 9"/>';
  }
  return '<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">' + corpo + '</svg>';
}

function mostrarResultado(local, atual) {
  const tempo = descreverTempo(atual.weather_code);
  const tipo = categoria(atual.weather_code);
  const dia = atual.is_day !== 0;

  // O fundo da página muda pelos atributos data-* (ver style.css)
  document.body.dataset.tempo = tipo;
  document.body.dataset.dia = dia ? "dia" : "noite";

  resultado.replaceChildren();

  const card = document.createElement("div");
  card.className = "card-clima";

  const topo = document.createElement("div");
  topo.className = "topo";

  const ilustracao = document.createElement("div");
  ilustracao.className = "ilustracao";
  ilustracao.setAttribute("aria-hidden", "true");
  // innerHTML só com o SVG fixo acima; nenhum texto digitado entra aqui
  ilustracao.innerHTML = desenharIcone(tipo, dia);

  const bloco = document.createElement("div");
  bloco.className = "temp-bloco";
  const temperatura = document.createElement("p");
  temperatura.className = "temperatura";
  temperatura.textContent = `${Math.round(atual.temperature_2m)}°C`;
  const condicao = document.createElement("p");
  condicao.className = "condicao";
  condicao.textContent = tempo.texto;
  bloco.append(temperatura, condicao);
  topo.append(ilustracao, bloco);

  const corpo = document.createElement("div");
  corpo.className = "corpo";

  // Nome vindo da API, não o texto digitado
  const titulo = document.createElement("h2");
  titulo.textContent = local.name;

  // MELHORIA 2 — confirma qual local a API encontrou.
  const ondeFica = document.createElement("p");
  ondeFica.className = "local";
  ondeFica.textContent = [local.admin1, local.country].filter(Boolean).join(" — ");

  const grade = document.createElement("div");
  grade.className = "grade";
  grade.append(
    linhaDado("Sensação", `${Math.round(atual.apparent_temperature)}°C`),
    linhaDado("Umidade", `${atual.relative_humidity_2m}%`),
    linhaDado("Vento", `${atual.wind_speed_10m} km/h`)
  );

  const atualizado = document.createElement("p");
  atualizado.className = "atualizado";
  atualizado.textContent = `Medição de ${formatarHora(atual.time)}`;

  corpo.append(titulo, ondeFica, grade, atualizado);
  card.append(topo, corpo);
  resultado.append(card);
}

function linhaDado(rotulo, valor) {
  const caixa = document.createElement("div");
  caixa.className = "dado";
  const r = document.createElement("span");
  r.className = "rotulo";
  r.textContent = rotulo;
  const v = document.createElement("span");
  v.className = "valor";
  v.textContent = valor;
  caixa.append(r, v);
  return caixa;
}

// A API devolve a hora no formato 2026-09-02T15:00
function formatarHora(texto) {
  if (!texto) {
    return "horário não informado";
  }
  const [data, hora] = texto.split("T");
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano} às ${hora}`;
}

// ============================================
// MELHORIA 3 — histórico das últimas buscas
// As cidades ficam salvas no navegador (localStorage), então a lista
// continua lá quando a página é recarregada.
// ============================================
const CHAVE_HISTORICO = "clima:ultimasCidades";

function lerHistorico() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
  } catch (erro) {
    // Se o conteúdo salvo estiver corrompido, começa do zero.
    return [];
  }
}

function salvarNoHistorico(cidade) {
  const lista = lerHistorico()
    .filter(item => item.toLowerCase() !== cidade.toLowerCase());

  lista.unshift(cidade);

  try {
    localStorage.setItem(
      CHAVE_HISTORICO,
      JSON.stringify(lista.slice(0, 5))
    );
  } catch (erro) {
    console.error("Não foi possível salvar o histórico.", erro);
  }

  mostrarHistorico();
}

function mostrarHistorico() {
  const lista = lerHistorico();

  listaHistorico.replaceChildren();
  historico.hidden = lista.length === 0;

  lista.forEach(cidade => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao-historico";
    botao.textContent = cidade;
    botao.addEventListener("click", () => {
      campoCidade.value = cidade;
      buscarClima();
    });
    listaHistorico.append(botao);
  });
}

mostrarHistorico();
