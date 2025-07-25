const API_URL = 'https://api.baserow.io/api/database/rows/table/587949/?user_field_names=true';
const API_TOKEN = 'Token 4RapVT6Hv7ZFcwYzgAooJdmXS7ARo4XH';

// Cria ou obtém UUID único e persistente
function getOrCreateUUID() {
  let uuid = localStorage.getItem('user_uuid');
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem('user_uuid', uuid);
  }
  return uuid;
}

const USER_UUID = getOrCreateUUID();
const stars = document.querySelectorAll('.star');
const visitDisplay = document.getElementById('visit-count');
const votedStarDisplay = document.getElementById('voted-star');

// Obter entrada existente ou criar nova
async function getOrCreateUserEntry() {
  const res = await fetch(`${API_URL}&filter__uuid=${USER_UUID}`, {
    headers: { Authorization: API_TOKEN }
  });
  const json = await res.json();

  if (json.count > 0) {
    return json.results[0]; // Entrada já existe
  } else {
    // Criar nova entrada com 1 visita
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
}

// Atualizar campo de visitas
async function incrementVisitCount(row) {
  const updatedRow = {
    visitas: (row.visitas || 0) + 1
  };

  await fetch(`${API_URL}${row.id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_TOKEN
    },
    body: JSON.stringify(updatedRow)
  });

  visitDisplay.textContent = updatedRow.visitas;
}

// Atualizar estrela votada
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
}

// Inicializar contagem de visita
async function init() {
  const row = await getOrCreateUserEntry();
  await incrementVisitCount(row);

  // Atualizar contador e estrela atual
  if (visitDisplay) visitDisplay.textContent = row.visitas || 1;
  if (votedStarDisplay && row.estrela) votedStarDisplay.textContent = `⭐ ${row.estrela}`;

  // Adicionar evento às estrelas
  stars.forEach((star, index) => {
    star.addEventListener('click', async () => {
      await updateStar(row.id, index + 1);
    });
  });
}

init();
