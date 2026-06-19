let pilots = [];

async function loadPilots() {
  try {
    const res = await fetch('data/pilots.txt');
    if (!res.ok) throw new Error(res.statusText);
    pilots = parsePilotsFile(await res.text());
  } catch {
    pilots = parsePilotsFile(FALLBACK_PILOTS);
  }
}

const FALLBACK_PILOTS = `Jan Kašpar|První český pilot, který na letadle doletěl do zahraničí (1912).
Charles Lindbergh|První sólový nepřerušovaný let přes Atlantický oceán (1927).`;

function parsePilotsFile(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const sep = line.indexOf('|');
      if (sep === -1) return { name: line, description: '' };
      return {
        name: line.slice(0, sep).trim(),
        description: line.slice(sep + 1).trim(),
      };
    })
    .filter((p) => p.name);
}

function pickRandomPilot(excludeNames = []) {
  const pool = pilots.filter((p) => !excludeNames.includes(p.name));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickCrew() {
  const pilot1 = pickRandomPilot();
  if (!pilot1) return { pilot1: null, pilot2: null, label: '—', commander: '—' };

  const pilot2 = pickRandomPilot([pilot1.name]);
  if (!pilot2) {
    return {
      pilot1,
      pilot2: null,
      label: pilot1.name,
      commander: pilot1.name,
    };
  }

  return {
    pilot1,
    pilot2,
    label: `${pilot1.name} / ${pilot2.name}`,
    commander: pilot1.name,
  };
}

function renderCrewCell(el, crew) {
  el.innerHTML = '';

  if (!crew.pilot1) {
    el.textContent = '—';
    return;
  }

  el.appendChild(createPilotButton(crew.pilot1));

  if (crew.pilot2) {
    el.appendChild(document.createTextNode(' / '));
    el.appendChild(createPilotButton(crew.pilot2));
  }
}

function createPilotButton(pilot) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pilot-name';
  btn.textContent = pilot.name;
  btn.dataset.description = pilot.description;
  return btn;
}

let bubbleEl = null;

function getBubble() {
  if (!bubbleEl) {
    bubbleEl = document.createElement('div');
    bubbleEl.className = 'pilot-bubble';
    bubbleEl.hidden = true;
    bubbleEl.innerHTML = '<p class="pilot-bubble-text"></p>';
    document.body.appendChild(bubbleEl);

    document.addEventListener('click', (e) => {
      if (!bubbleEl.hidden && !e.target.closest('.pilot-name') && !e.target.closest('.pilot-bubble')) {
        hidePilotBubble();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hidePilotBubble();
    });
  }
  return bubbleEl;
}

function showPilotBubble(btn) {
  const bubble = getBubble();
  const text = bubble.querySelector('.pilot-bubble-text');
  text.textContent = btn.dataset.description || '—';
  bubble.hidden = false;
  bubble.style.visibility = 'hidden';
  bubble.style.left = '0';
  bubble.style.top = '0';

  const rect = btn.getBoundingClientRect();
  const bubbleRect = bubble.getBoundingClientRect();
  let top = rect.bottom + 6;
  let left = rect.left + rect.width / 2 - bubbleRect.width / 2;

  if (left < 8) left = 8;
  if (left + bubbleRect.width > window.innerWidth - 8) {
    left = window.innerWidth - bubbleRect.width - 8;
  }
  if (top + bubbleRect.height > window.innerHeight - 8) {
    top = rect.top - bubbleRect.height - 6;
  }

  bubble.style.top = `${top}px`;
  bubble.style.left = `${left}px`;
  bubble.style.visibility = '';
}

function hidePilotBubble() {
  if (bubbleEl) bubbleEl.hidden = true;
}

function initPilotBubbles() {
  document.querySelector('.log-table').addEventListener('click', (e) => {
    const btn = e.target.closest('.pilot-name');
    if (!btn) return;
    e.stopPropagation();

    const bubble = getBubble();
    if (!bubble.hidden && bubble.dataset.for === btn.textContent) {
      hidePilotBubble();
      return;
    }

    bubble.dataset.for = btn.textContent;
    showPilotBubble(btn);
  });
}
