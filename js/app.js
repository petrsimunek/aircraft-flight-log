const els = {
  tachStart: document.getElementById('tach-start'),
  landingsBefore: document.getElementById('landings-before'),
  departure: document.getElementById('departure'),
  arrival: document.getElementById('arrival'),
  takeoff: document.getElementById('takeoff'),
  tachEnd: document.getElementById('tach-end'),
  landings: document.getElementById('landings'),
  exercises: document.getElementById('exercises'),
  r2Notes: document.getElementById('r2-notes'),
  r1Crew: document.getElementById('r1-crew'),
  r2Crew: document.getElementById('r2-crew'),
};

let crewRow1 = null;
let crewRow2 = null;
let notesDirty = false;
let lastAutoNotes = '';

function pickBothCrews() {
  crewRow1 = pickCrew();
  crewRow2 = pickCrew();
}

function parseNum(value) {
  if (value === '' || value == null) return null;
  const n = parseFloat(String(value).replace(',', '.'));
  return isNaN(n) ? null : n;
}

function parseTach(value) {
  return parseNum(value);
}

function tachToTotalMinutes(tach) {
  const h = Math.floor(tach);
  const m = Math.round((tach - h) * 60);
  return h * 60 + m;
}

function tachToParts(tach) {
  const h = Math.floor(tach);
  let m = Math.round((tach - h) * 60);
  let hours = h;
  if (m === 60) {
    hours += 1;
    m = 0;
  }
  return { h: hours, m };
}

function minutesToParts(totalMin) {
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}

function formatTachDecimal(tach) {
  return tach.toFixed(1).replace('.', ',');
}

function formatTachSexagesimal(tach) {
  const { h, m } = tachToParts(tach);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function formatTachBoth(tach) {
  return `${formatTachDecimal(tach)} (${formatTachSexagesimal(tach)})`;
}

function formatDurationHm(totalMin) {
  if (totalMin == null || totalMin < 0) return null;
  const { h, m } = minutesToParts(totalMin);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(totalMin) {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function roundTo5Minutes(totalMin) {
  return Math.round(totalMin / 5) * 5;
}

function todayDate() {
  return new Date().toLocaleDateString('cs-CZ');
}

function cell(value) {
  return value == null || value === '' ? '—' : String(value);
}

function readForm() {
  return {
    tachStart: parseTach(els.tachStart.value),
    landingsBefore: parseNum(els.landingsBefore.value),
    departure: els.departure.value.trim().toUpperCase(),
    arrival: els.arrival.value.trim().toUpperCase(),
    takeoff: els.takeoff.value,
    tachEnd: parseTach(els.tachEnd.value),
    landings: parseNum(els.landings.value),
    exercises: els.exercises.value.trim(),
  };
}

function generateRecord(data) {
  let diffMin = null;
  let landing = null;
  let error = null;

  if (data.tachStart != null && data.tachEnd != null) {
    const startMin = tachToTotalMinutes(data.tachStart);
    const endMin = tachToTotalMinutes(data.tachEnd);
    diffMin = endMin - startMin;

    if (diffMin < 0) {
      error = true;
    } else if (data.takeoff) {
      const takeoffMin = parseTime(data.takeoff);
      landing = formatTime(roundTo5Minutes(takeoffMin + diffMin));
    }
  }

  const landingsTotal =
    data.landingsBefore != null && data.landings != null
      ? data.landingsBefore + data.landings
      : null;

  const startParts = data.tachStart != null ? tachToParts(data.tachStart) : null;
  const endParts = data.tachEnd != null ? tachToParts(data.tachEnd) : null;

  const flightDuration =
    diffMin != null && diffMin >= 0 ? formatDurationHm(diffMin) : null;

  const autoNotes =
    data.tachEnd != null ? `Motohodiny: ${formatTachBoth(data.tachEnd)}` : '';

  return {
    error,
    date: todayDate(),
    departure: data.departure,
    arrival: data.arrival,
    takeoff: data.takeoff,
    landing,
    flightDuration,
    landings: data.landings,
    exercises: data.exercises,
    startParts,
    endParts,
    landingsBefore: data.landingsBefore,
    landingsTotal,
    autoNotes,
  };
}

function setText(id, value) {
  document.getElementById(id).textContent = cell(value);
}

function updateOutput() {
  const record = generateRecord(readForm());

  if (record.startParts) {
    setText('r1-total-h', record.startParts.h);
    setText('r1-total-m', record.startParts.m);
    setText('r1-total-tk', record.landingsBefore);
  } else {
    setText('r1-total-h', null);
    setText('r1-total-m', null);
    setText('r1-total-tk', null);
  }

  renderCrewCell(els.r1Crew, crewRow1);
  renderCrewCell(els.r2Crew, crewRow2);

  setText('r2-date', record.date);
  setText('r2-dep-place', record.departure);
  setText('r2-dep-time', record.takeoff);
  setText('r2-arr-place', record.arrival);
  setText('r2-arr-time', record.landing);
  setText('r2-takeoffs', record.landings);
  setText('r2-type', record.exercises);

  if (record.flightDuration && !record.error) {
    setText('r2-flight', record.flightDuration);
  } else {
    setText('r2-flight', record.error ? '!' : null);
  }

  if (record.endParts && !record.error) {
    setText('r2-total-h', record.endParts.h);
    setText('r2-total-m', record.endParts.m);
    setText('r2-total-tk', record.landingsTotal);
  } else {
    setText('r2-total-h', record.error ? '!' : null);
    setText('r2-total-m', record.error ? '!' : null);
    setText('r2-total-tk', record.error ? '!' : null);
  }

  const sigEl = document.getElementById('r2-signature');
  sigEl.textContent = crewRow2?.commander || '—';

  if (!notesDirty && record.autoNotes !== lastAutoNotes) {
    els.r2Notes.value = record.autoNotes;
    lastAutoNotes = record.autoNotes;
  } else if (!notesDirty && !record.autoNotes) {
    els.r2Notes.value = '';
    lastAutoNotes = '';
  }
}

function tableToText() {
  const rows = [];
  const table = document.querySelector('.log-table');
  table.querySelectorAll('thead tr').forEach((tr) => {
    rows.push([...tr.cells].map((c) => c.textContent.trim().replace(/\s+/g, ' ')).join('\t'));
  });
  table.querySelectorAll('tbody tr').forEach((tr) => {
    const cells = [...tr.cells].map((c) => {
      const textarea = c.querySelector('textarea');
      if (textarea) return textarea.value.trim().replace(/\s+/g, ' ');
      if (c.classList.contains('crew-cell')) return c.textContent.trim().replace(/\s+/g, ' ');
      const split = c.querySelector('.cell-split');
      if (split) {
        return [...split.querySelectorAll('span')]
          .map((s) => s.textContent.trim())
          .join(' ');
      }
      return c.textContent.trim().replace(/\s+/g, ' ');
    });
    rows.push(cells.join('\t'));
  });
  return rows.join('\n');
}

let toastEl;
function showToast(message) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), 2000);
}

els.r2Notes.addEventListener('input', () => {
  notesDirty = true;
});

document.querySelectorAll('.form-grid input').forEach((input) => {
  input.addEventListener('input', () => {
    if (input === els.tachStart || input === els.departure) {
      pickBothCrews();
    }
    updateOutput();
  });
});

document.getElementById('btn-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(tableToText()).then(() => showToast('Zkopírováno'));
});

async function init() {
  await loadPilots();
  pickBothCrews();
  initPilotBubbles();
  updateOutput();
}

init();
