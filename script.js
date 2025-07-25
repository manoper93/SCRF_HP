const lang = localStorage.getItem('lang') || 'en';

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
})();
