const TEMPLATE_IDS = ['OK-DUD24', 'OK-YAI56'];

let activeTemplate = 'OK-DUD24';

function setActiveTemplate(id) {
  if (!TEMPLATE_IDS.includes(id)) return;
  activeTemplate = id;

  document.querySelectorAll('.template-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.template === id);
  });

  document.querySelectorAll('.template-panel').forEach((panel) => {
    panel.hidden = panel.dataset.template !== id;
  });
}

function initTemplateTabs() {
  document.querySelectorAll('.template-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveTemplate(tab.dataset.template);
    });
  });
  setActiveTemplate(activeTemplate);
}

function getActiveTable() {
  return document.querySelector(`.template-panel[data-template="${activeTemplate}"] .log-table`);
}

function notesStateKey(templateId) {
  return templateId === 'OK-YAI56' ? 'yai' : 'dud';
}
