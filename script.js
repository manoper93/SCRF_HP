const API_URL = 'https://api.baserow.io/api/database/rows/table/587949/?user_field_names=true';
const API_TOKEN = 'Token 4RapVT6Hv7ZFcwYzgAooJdmXS7ARo4XH';

// Cria ou obtém UUID persistente
function getOrCreateUUID() {
  let uuid = localStorage.getItem('user_uuid');
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem('user_uuid', uuid);
  }
  return uuid;
}

const USER_UUID = getOrCreateUUID();
const visitDisplay = document.getElementById('visit-count');
const votedStarDisplay = document.getElementById('voted-star');
const stars = document.querySelectorAll('.star');

// Obter linha correspondente ao UUID ou criar nova
async function getOrCreateUserRow() {
  const res = await fetch(`${API_URL}&filter__uuid=${USER_UUID}`, {
    headers: { Authorization: API_TOKEN }
  });

  const data = await res.json();
  if (data.count > 0) return data.results[0];

  const newRow = {
    uuid: USER_UUID,
    visitas: 1,
    estrela: null
  };

  const createRes = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_TOKEN
    },
    body: JSON.stringify(newRow)
  });

  return await createRes.json();
}

// Atualizar contagem de visitas
async function incrementVisitCount(row) {
  const newCount = (row.visitas || 0) + 1;

  await fetch(`${API_URL}${row.id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_TOKEN
    },
    body: JSON.stringify({ visitas: newCount })
  });

  visitDisplay.textContent = newCount;
}

// Atualizar valor da estrela
async function updateStar(rowId, starValue) {
  await fetch(`${API_URL}${rowId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_TOKEN
    },
    body: JSON.stringify({ estrela: starValue })
  });

  votedStarDisplay.textContent = `⭐ ${starValue}`;
  highlightStars(starValue);
}

// Realçar visualmente as estrelas votadas
function highlightStars(value) {
  stars.forEach((star, i) => {
    star.style.color = i < value ? 'gold' : 'gray';
  });
}

// Inicializar sistema
async function init() {
  const row = await getOrCreateUserRow();

  // Atualiza visitas
  await incrementVisitCount(row);

  // Mostra valor atual de visitas e estrela
  visitDisplay.textContent = row.visitas || 1;
  if (row.estrela) {
    votedStarDisplay.textContent = `⭐ ${row.estrela}`;
    highlightStars(row.estrela);
  }

  // Lidar com clique nas estrelas
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      updateStar(row.id, index + 1);
    });
  });
}

init();
