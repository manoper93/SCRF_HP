const API_URL = 'https://api.baserow.io/api/database/rows/table/587949/?user_field_names=true';
const API_TOKEN = 'Token 4RapVT6Hv7ZFcwYzgAooJdmXS7ARo4XH';
const PAGE_SIZE = 100;     // Máximo registos por pedido
const MAX_RECORDS = 10; // Máximo total a obter

const USER_UUID = getOrCreateUUID();
const stars = document.querySelectorAll('.star');
const visitDisplay = document.getElementById('visit-count');
const ratingDisplay = document.getElementById('rating-counts');
const lang = localStorage.getItem('lang') || 'en';

const userDevice = /mobile/i.test(navigator.userAgent) ? 'Telemóvel' : 'Computador';
const userOS = /Android/.test(navigator.userAgent) ? 'Android' :
               /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' :
               /Win/.test(navigator.userAgent) ? 'Windows' :
               /Mac/.test(navigator.userAgent) ? 'Mac OS' :
               /Linux/.test(navigator.userAgent) ? 'Linux' : 'Unknown';
const userBrowser = /Edg\//.test(navigator.userAgent) ? "Edge" :
                    /OPR\//.test(navigator.userAgent) ? "Opera" :
                    /Chrome\//.test(navigator.userAgent) ? "Chrome" :
                    /Safari\//.test(navigator.userAgent) && !/Chrome\//.test(navigator.userAgent) ? "Safari" :
                    /Firefox\//.test(navigator.userAgent) ? "Firefox" : "Desconhecido";

let userRating = localStorage.getItem(`rating_${USER_UUID}`);

// UUID generation / retrieval
function getOrCreateUUID() {
  let uuid = localStorage.getItem('uuid');
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem('uuid', uuid);
  }
  return uuid;
}

// Async functions to get IP and location
async function getPublicIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const json = await res.json();
    return json.ip;
  } catch {
    return 'Unknown';
  }
}

async function getLocationOnce() {
  // Tenta ler localização guardada (cache) com timestamp inferior a 10 minutos
  const cached = localStorage.getItem('cachedLocation');
  const cachedTime = localStorage.getItem('cachedLocationTime');
  if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 10 * 60 * 1000) {
    return cached;
  }

  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve('Does not support');
      return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(res => res.json())
        .then(data => {
          const city = data.address.city || data.address.town || data.address.village || '';
          const region = data.address.state || '';
          const country = data.address.country || '';
          const locationString = [city, region, country].filter(Boolean).join(', ') || 'Unavailable';
          localStorage.setItem('cachedLocation', locationString);
          localStorage.setItem('cachedLocationTime', Date.now().toString());
          resolve(locationString);
        })
        .catch(() => resolve('Unavailable'));
    }, () => resolve('Denied'), {
      timeout: 5000,
      maximumAge: 60000,
      enableHighAccuracy: false
    });
  });
}

// Essa função envia os dados para a API, agora recebe IP e localização já resolvidos
async function sendToBaserow(tipo, valor, ip, localizacao) {
  const data = {
    tipo, valor,
    uuid: USER_UUID,
    ip,
    localizacao,
    dispositivo: userDevice,
    os: userOS,
    browser: userBrowser
  };
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Authorization': API_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

function updateStars(n) {
  stars.forEach(s => {
    s.classList.toggle('selected', parseInt(s.dataset.value) <= n);
  });
}

async function sendVote(n) {
  const key = `rating_${USER_UUID}`;
  const stored = localStorage.getItem(key);

  if (stored && parseInt(stored) === n) {
    alert(lang === 'pt-PT' ? 'Já votou com essa avaliação.' : 'You already voted with this rating.');
    return;
  }

  const ask = stored
    ? (lang === 'pt-PT' ? `Votou ${stored} estrela(s). Quer alterar para ${n}?` : `You voted ${stored} star(s). Change to ${n}?`)
    : (lang === 'pt-PT' ? `Quer votar ${n} estrela(s)?` : `Do you want to vote ${n} star(s)?`);
  if (!confirm(ask)) return;

  ratingDisplay.innerHTML = `<div style="color:orange;">${lang === 'pt-PT' ? 'A atualizar…' : 'Updating…'}</div>`;

  // Obter IP e localização atualizados antes de enviar
  const ip = await getPublicIP();
  const localizacao = await getLocationOnce();

  if (stored && parseInt(stored) !== n) await sendToBaserow(stored, -1, ip, localizacao);
  await sendToBaserow(n, 1, ip, localizacao);

  localStorage.setItem(key, n);
  userRating = n;
  updateStars(n);
  await new Promise(r => setTimeout(r, 1000));
  await loadData();
}

async function loadData() {
  try {
    const res = await fetch(${API_URL}&limit=2000, {
      headers: { 'Authorization': API_TOKEN }
    });
    const json = await res.json();
    const all = json.results;

    // Filtra as visitas e votos com valores numéricos
    const visitas = all.filter(r => r.tipo === 'visita' && r.valor === 'v');

    // Votos com tipo entre 1 e 5 e valor numérico (positivo ou negativo)
    const votos = all.filter(r => {
      const tipoNum = parseInt(r.tipo);
      const valorNum = parseInt(r.valor);
      return tipoNum >=1 && tipoNum <=5 && (valorNum === 1 || valorNum === -1);
    });

    const contagens = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    votos.forEach(v => {
      const estrela = parseInt(v.tipo);
      const valor = parseInt(v.valor);
      contagens[estrela] += valor;
    });

    visitDisplay.textContent = visitas.length;
    document.getElementById('visit-label').firstChild.textContent = lang === 'pt-PT' ? 'Visitas públicas: ' : 'Public visits: ';

    ratingDisplay.innerHTML = '';
    for (let i = 5; i >= 1; i--) {
      const lbl = lang === 'pt-PT' ? ${i} estrela(s) : ${i} star(s);
      // Não mostrar contagem negativa, mostrar 0 no mínimo
      const count = contagens[i] < 0 ? 0 : contagens[i];
      ratingDisplay.innerHTML += <div>${lbl}: ${count}</div>;
    }
  } catch (err) {
    console.error("Error in loadData:", err);
    visitDisplay.textContent = 'Error';
    ratingDisplay.innerHTML = <div style="color:red;">Erro: ${err.message}</div>;
  }
}

async function incrementVisit() {
  if (sessionStorage.getItem('visited')) return;

  // Obter IP e localização atualizados antes de enviar
  const ip = await getPublicIP();
  const localizacao = await getLocationOnce();

  await sendToBaserow('visita', 'v', ip, localizacao);
  sessionStorage.setItem('visited', 'true');
}

function toggleLang() {
  const newLang = document.documentElement.lang === 'pt-PT' ? 'en' : 'pt-PT';
  localStorage.setItem('lang', newLang);
  location.reload();
}
  
function applyLangTexts(lang) {
  const texts = {
    'pt-PT': {
      title: 'Sistema de Controlo Rádio Frequência',
      subtitle1: 'Visualizar em 3D',
      subtitle2: 'Visualizar',
      motor: '⚙️ Módulo Motor',
      door: '🚪 Módulo Porta',
      resumo: '📝 Resumo do Projeto',
      schematic: '📐 Esquemático',
      gerber: '📐 Gerber',
      grade: 'Nota final do projeto/estágio: <strong>19 / 20</strong>'
    },
    'en': {
      title: 'Radio Frequency Control System',
      subtitle1: 'View in 3D',
      subtitle2: 'View',
      motor: '⚙️ Motor Module',
      door: '🚪 Door Module',
      resumo: '📝 Project Summary',
      schematic: '📐 Schematic',
      gerber: '📐 Gerber',
      grade: 'Final grade of internship/project: <strong>19 / 20</strong>'
    }
  };
  const t = texts[lang] || texts['en'];
  document.getElementById('page-title').textContent = t.title;
  document.getElementById('main-title').textContent = t.title;
  document.getElementById('subtitle1').textContent = t.subtitle1;
  document.getElementById('subtitle2').textContent = t.subtitle2;
  document.getElementById('motor-btn').textContent = t.motor;
  document.getElementById('door-btn').textContent = t.door;
  document.getElementById('resumo-btn').textContent = t.resumo;
  document.getElementById('schematic-btn').textContent = t.schematic;
  document.getElementById('gerber-btn').textContent = t.gerber;
  document.getElementById('final-grade').innerHTML = t.grade;
}

(async function init() {
  document.documentElement.lang = lang;
  applyLangTexts(lang);

  if (userRating !== null && !isNaN(userRating)) {
    updateStars(Number(userRating));
  }

  stars.forEach(s => {
    s.addEventListener('click', () => sendVote(parseInt(s.dataset.value)));
  });
  
  await incrementVisit();
  
  loadData();
  
})();
