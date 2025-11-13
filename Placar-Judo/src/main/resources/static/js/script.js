console.log("JS carregado")
//  Inicialização do placar e penalidades
const penalidadesIniciais = getPenalidades();
for (const time in penalidadesIniciais) {
  const select = document.getElementById(`penalidade${time}`);
  if (select) select.value = penalidadesIniciais[time];
}

//  Funções de placar
function getPlacar() {
  const raw = localStorage.getItem('placar');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function setPlacar(placar) {
  localStorage.setItem('placar', JSON.stringify(placar));
}
const placarAtual = getPlacar();
if (!placarAtual || Object.keys(placarAtual).length < 8) {
  setPlacar({
    ipponA: 0, wazariA: 0, yukoA: 0, shidoA: 0,
    ipponB: 0, wazariB: 0, yukoB: 0, shidoB: 0
  });
}

function increment(tipo, lado) {
  const placar = getPlacar();
  if (!placar) return;

  const chave = `${tipo}${lado}`;
  const atual = placar[chave] || 0;

  let novo;
  if (tipo === 'shido') {
    novo = Math.min(atual + 1, 3);
  } else if (tipo === 'ippon') {
    novo = Math.min(atual + 1, 1);
  } else {
    novo = atual + 1;
  }

  placar[chave] = novo;
  setPlacar(placar);

  const el = document.getElementById(chave);
  if (el) el.textContent = novo;

  if (tipo === 'shido') atualizarCartoesShido(novo, lado);
  if (tipo === 'ippon') localStorage.setItem('ipponTrigger', Date.now());
  if (tipo === 'wazari') verificarWazariParaIppon(lado);
}


function decrement(tipo, lado) {
  const placar = getPlacar();
  if (!placar) return;

  const chave = `${tipo}${lado}`;
  const atual = placar[chave] || 0;
  const novo = Math.max(atual - 1, 0);
  placar[chave] = novo;

  setPlacar(placar);
  const el = document.getElementById(chave);
  if (el) el.textContent = novo;

  if (tipo === 'shido') atualizarCartoesShido(novo, lado);
}


// Cartões Shido
function atualizarCartoesShido(qtd, lado) {
  const container = document.getElementById(`cartoes-shido${lado}`);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < Math.min(qtd, 3); i++) {
    const cartao = document.createElement('div');
    cartao.classList.add('cartao');
    container.appendChild(cartao);
  }
}

// ️ Tempo
let minutos = 0;
let segundos = 0;
let tempoSubindo = false;
let timerInterval;

function atualizarDisplay() {
  const m = String(minutos).padStart(2, '0');
  const s = String(segundos).padStart(2, '0');
  const prefixo = tempoSubindo ? '+' : '';
  document.getElementById('tempo').textContent = `${prefixo}${m}:${s}`;

  localStorage.setItem('tempo', JSON.stringify({ minutos, segundos, golden: tempoSubindo }));
}

function iniciarTimer() {
  clearInterval(timerInterval);
  document.getElementById('tempo').classList.remove('timer-pausado');
  localStorage.setItem('timerPausado', 'false'); // ✅ limpa estado
  timerInterval = setInterval(() => {
    if (houveIppon()) {
      pausarTimer();
      exibirVideoIppon();
      return;
    }

    const goldenAtivo = document.getElementById('goldenScore')?.checked;

    if (!tempoSubindo) {
      if (minutos === 0 && segundos === 0) {
        if (goldenAtivo) {
          pausarTimer(); // ✅ Pausa o timer
          exibirVideoGoldenScore(); // ✅ Exibe o vídeo
          localStorage.setItem('goldenScoreTrigger', Date.now());
          tempoSubindo = true;
          segundos = 1;

          document.getElementById('tempo')?.classList.add('golden-time');
          return; // ✅ Impede que o timer continue rodando
        } else {
          clearInterval(timerInterval);
          return;
        }
      } else {
        if (segundos === 0) {
          segundos = 59;
          minutos--;
        } else {
          segundos--;
        }
      }
    } else {
      segundos++;
      if (segundos === 60) {
        segundos = 0;
        minutos++;
      }
    }

    atualizarDisplay();
  }, 1000);
}
function pausarTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('tempo').classList.add('timer-pausado');
  localStorage.setItem('timerPausado', 'true'); // ✅ salva estado
}

function resetarTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('tempo')?.classList.remove('golden-time');
  document.getElementById('tempo').classList.remove('timer-pausado');
  localStorage.setItem('timerPausado', 'false');
  minutos = 0;
  segundos = 0;
  tempoSubindo = false;
  atualizarDisplay();
  resetarSaikomi();
}

function aumentarTempo() {
  minutos++;
  atualizarDisplay();
}

function diminuirTempo() {
  if (minutos > 0) minutos--;
  atualizarDisplay();
}

function setarQuatroMinutos() {
  minutos = 4;
  segundos = 0;
  tempoSubindo = false;
  atualizarDisplay();
}

//  Saikomi
let intervaloSaikomi;

function iniciarSaikomi(time) {
  clearInterval(intervaloSaikomi);
  let segundos = 0;
  intervaloSaikomi = setInterval(() => {
    segundos++;

    // Atualiza localStorage e interface
    localStorage.setItem('saikomi', JSON.stringify({ time, segundos }));
    document.getElementById('saikomiTimer').textContent = `Saikomi: ${segundos}s`;

    // Define o lado com base na cor
    const lado = time === 'azul' ? 'A' : 'B';

    // Aos 15 segundos, adiciona Wazari
    if (segundos === 15) {
      increment('wazari', lado);
    }

    // Aos 20 segundos, adiciona Ippon e encerra Saikomi
    if (segundos === 21) {
      increment('ippon', lado);
      clearInterval(intervaloSaikomi);
    }
  }, 1000);
}

function resetarSaikomi() {
  clearInterval(intervaloSaikomi);
  localStorage.removeItem('saikomi');
  document.getElementById('saikomiTimer').textContent = 'Saikomi: 00s';
}

//  Vídeo de Ippon
let videoEmExecucao = false;
function exibirVideoIppon() {
  const video = document.getElementById('ipponVideo');
  if (video && !videoEmExecucao) {
    videoEmExecucao = true;

    video.pause();
    video.currentTime = 0;

    video.oncanplay = () => {
      video.style.display = 'block';
      video.play();
    };

    if (video.readyState >= 2) {
      video.style.display = 'block';
      video.play();
    }

    // Após o vídeo de ippon, exibe o vídeo de vencedor
    setTimeout(() => {
      video.pause();
      video.style.display = 'none';

      console.log("Exibindo vídeo de vencedor:", vencedor);
      const placar = JSON.parse(localStorage.getItem('placar'));
      const vencedor = placar.ipponA > 0 ? 'VenceuAzul' : 'VenceuBranco';
      const videoVencedor = document.getElementById(vencedor);

      if (videoVencedor) {
        videoVencedor.pause();
        videoVencedor.currentTime = 0;

        videoVencedor.oncanplay = () => {
          videoVencedor.style.display = 'block';
          videoVencedor.play();
        };

        if (videoVencedor.readyState >= 2) {
          videoVencedor.style.display = 'block';
          videoVencedor.play();
        }

        setTimeout(() => {
          videoVencedor.pause();
          videoVencedor.style.display = 'none';
          videoEmExecucao = false;
        }, 8000);
      } else {
        videoEmExecucao = false;
      }
    }, 8000);
  }
}

function exibirVideoGoldenScore() {
  const video = document.getElementById('goldenScoreVideo');
  if (video && !videoEmExecucao) {
    videoEmExecucao = true;
    pausarTimer();

    video.pause();
    video.currentTime = 0;

    video.oncanplay = () => {
      video.style.display = 'block';
      video.play();
    };

    if (video.readyState >= 2) {
      video.style.display = 'block';
      video.play();
    }

    setTimeout(() => {
      video.pause();
      video.style.display = 'none';
      videoEmExecucao = false;
    }, 8000);
  }
}
// calculo de wazari
function verificarWazariParaIppon(lado) {
  const placar = getPlacar();
  if (!placar) return;

  const chaveWazari = `wazari${lado}`;
  const chaveIppon = `ippon${lado}`;
  const wazariAtual = placar[chaveWazari] || 0;

  if (wazariAtual >= 2) {
    placar[chaveWazari] = 0;
    placar[chaveIppon] = (placar[chaveIppon] || 0) + 1;

    setPlacar(placar);

    const elWazari = document.getElementById(chaveWazari);
    const elIppon = document.getElementById(chaveIppon);
    if (elWazari) elWazari.textContent = 0;
    if (elIppon) elIppon.textContent = placar[chaveIppon];

    localStorage.setItem('ipponTrigger', Date.now());
  }
}
// verifica se houve ippon
function houveIppon() {
  const placar = getPlacar();
  return placar.ipponA > 0 || placar.ipponB > 0;
}

//  Atualizações periódicas
function atualizarPlacar() {
  const placar = getPlacar();
  if (!placar) return;

  for (const tipo of ['ippon', 'wazari', 'yuko', 'shido']) {
    for (const lado of ['A', 'B']) {
      const id = `${tipo}${lado}`;
      const el = document.getElementById(id);
      if (el) el.textContent = placar[id];
      if (tipo === 'shido') atualizarCartoesShido(placar[id], lado);
    }
  }
}

function getPenalidades() {
  return JSON.parse(localStorage.getItem('penalidades')) || { A: 0, B: 0 };
}

function setPenalidades(penalidades) {
  localStorage.setItem('penalidades', JSON.stringify(penalidades));
}


function atualizarSaikomi() {
  const saikomi = JSON.parse(localStorage.getItem('saikomi'));
  const barraAzul = document.getElementById('barraAzul');
  const barraBranco = document.getElementById('barraBranco');

  if (!saikomi || saikomi.time === null) {
    if (barraAzul) barraAzul.style.width = '0%';
    if (barraBranco) barraBranco.style.width = '0%';
    return;
  }

  const { time, segundos } = saikomi;
  const progresso = Math.min((segundos / 20) * 100, 100);

  const barra = time === 'azul' ? barraAzul : barraBranco;
  const outraBarra = time === 'azul' ? barraBranco : barraAzul;

  if (barra) barra.style.width = `${progresso}%`;
  if (outraBarra) outraBarra.style.width = '0%';
}
function toggleDestaque(lado) {
  const checkbox = document.getElementById(`destaque${lado.charAt(0).toUpperCase() + lado.slice(1)}`);
  const bloco = document.querySelector(`.controle-time.${lado}`);

  if (checkbox.checked) {
    bloco.classList.add('destaque-vermelho');
  } else {
    bloco.classList.remove('destaque-vermelho');
  }
}


//  Tema claro/escuro
const body = document.body;
const toggleBtn = document.getElementById('toggleTheme');

function aplicarTema(tema) {
  if (tema === 'escuro') {
    body.classList.add('dark-mode');
    toggleBtn.textContent = ' Modo Claro';
  } else {
    body.classList.remove('dark-mode');
    toggleBtn.textContent = ' Modo Escuro';
  }
  localStorage.setItem('tema', tema);
}

const temaSalvo = localStorage.getItem('tema') || 'claro';
aplicarTema(temaSalvo);

toggleBtn.addEventListener('click', () => {
  const novoTema = body.classList.contains('dark-mode') ? 'claro' : 'escuro';
  aplicarTema(novoTema);
});

let timerPausado = false;

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !event.target.matches('input, textarea')) {
    event.preventDefault(); // evita rolagem da página

    if (timerPausado) {
      iniciarTimer();
      timerPausado = false;
    } else {
      pausarTimer();
      timerPausado = true;
    }
  }
});

// Atualizações contínuas
  setInterval(() => {
  atualizarDisplay();
  atualizarSaikomi();
}, 1000);

