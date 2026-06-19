const els = {
  tachStart: document.getElementById('tach-start'),
  landingsBefore: document.getElementById('landings-before'),
  departure: document.getElementById('departure'),
  arrival: document.getElementById('arrival'),
  takeoff: document.getElementById('takeoff'),
  tachEnd: document.getElementById('tach-end'),
  landings: document.getElementById('landings'),
  exercises: document.getElementById('exercises'),
  exerciseHint: document.getElementById('exercise-hint'),
  dudR1Crew: document.getElementById('dud-r1-crew'),
  dudR2Crew: document.getElementById('dud-r2-crew'),
  dudR2Notes: document.getElementById('dud-r2-notes'),
  yaiR1Crew: document.getElementById('yai-r1-crew'),
  yaiR2Crew: document.getElementById('yai-r2-crew'),
  yaiR2Notes: document.getElementById('yai-r2-notes'),
};

let crewRow1 = null;
let crewRow2 = null;

const notesState = {
  dud: { dirty: false, lastAuto: '' },
  yai: { dirty: false, lastAuto: '' },
};

const FORM_STORAGE_KEY = 'flight-log-form';

function saveForm() {
  const data = {
    tachStart: els.tachStart.value,
    tachEnd: els.tachEnd.value,
    takeoff: els.takeoff.value,
    landings: els.landings.value,
    departure: els.departure.value,
    arrival: els.arrival.value,
    landingsBefore: els.landingsBefore.value,
    exercises: els.exercises.value,
  };
  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
}

function loadForm() {
  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.tachStart != null) els.tachStart.value = data.tachStart;
    if (data.tachEnd != null) els.tachEnd.value = data.tachEnd;
    if (data.takeoff != null) els.takeoff.value = data.takeoff;
    if (data.landings != null) els.landings.value = data.landings;
    if (data.departure != null) els.departure.value = data.departure;
    if (data.arrival != null) els.arrival.value = data.arrival;
    if (data.landingsBefore != null) els.landingsBefore.value = data.landingsBefore;
    if (data.exercises != null) els.exercises.value = data.exercises;
  } catch {
    // ignore corrupt storage
  }
}

function clearForm() {
  localStorage.removeItem(FORM_STORAGE_KEY);

  els.tachStart.value = '';
  els.tachEnd.value = '';
  els.takeoff.value = '';
  els.landings.value = '1';
  els.departure.value = '';
  els.arrival.value = '';
  els.landingsBefore.value = '';
  els.exercises.value = '';

  els.exerciseHint.hidden = true;
  els.exerciseHint.textContent = '';

  notesState.dud.dirty = false;
  notesState.dud.lastAuto = '';
  notesState.yai.dirty = false;
  notesState.yai.lastAuto = '';
  els.dudR2Notes.value = '';
  els.yaiR2Notes.value = '';

  pickBothCrews();
  updateOutput();
}

function pickBothCrews() {
  crewRow1 = pickCrew(2);
  crewRow2 = pickCrewForExercise();
}

function pickCrewForExercise() {
  const ex = findExercise(els.exercises.value);
  return pickCrew(crewSizeForExercise(ex));
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

  const tachEndNote =
    data.tachEnd != null ? `Motohodiny: ${formatTachBoth(data.tachEnd)}` : '';

  const exercise = findExercise(data.exercises);
  const flightType = exercise ? exercise.code : data.exercises || null;

  const yaiNotes = flightType || '';

  return {
    error,
    date: todayDate(),
    departure: data.departure,
    arrival: data.arrival,
    takeoff: data.takeoff,
    landing,
    flightDuration,
    landings: data.landings,
    flightType,
    startParts,
    endParts,
    tachStart: data.tachStart,
    tachEnd: data.tachEnd,
    landingsBefore: data.landingsBefore,
    landingsTotal,
    dudNotes: tachEndNote,
    yaiNotes,
  };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = cell(value);
}

function syncNotes(textarea, state, autoNotes) {
  if (!textarea) return;
  if (!state.dirty && autoNotes !== state.lastAuto) {
    textarea.value = autoNotes;
    state.lastAuto = autoNotes;
  } else if (!state.dirty && !autoNotes) {
    textarea.value = '';
    state.lastAuto = '';
  }
}

function setSignature(id, commander) {
  const el = document.getElementById(id);
  if (el) el.textContent = commander || '—';
}

function updateDud24(record) {
  if (record.startParts) {
    setText('dud-r1-total-h', record.startParts.h);
    setText('dud-r1-total-m', record.startParts.m);
    setText('dud-r1-total-tk', record.landingsBefore);
  } else {
    setText('dud-r1-total-h', null);
    setText('dud-r1-total-m', null);
    setText('dud-r1-total-tk', null);
  }

  renderCrewCell(els.dudR1Crew, crewRow1);
  renderCrewCell(els.dudR2Crew, crewRow2);
  setSignature('dud-r1-signature', crewRow1?.commander);

  setText('dud-r2-date', record.date);
  setText('dud-r2-dep-place', record.departure);
  setText('dud-r2-dep-time', record.takeoff);
  setText('dud-r2-arr-place', record.arrival);
  setText('dud-r2-arr-time', record.landing);
  setText('dud-r2-takeoffs', record.landings);
  setText('dud-r2-type', record.flightType);

  if (record.flightDuration && !record.error) {
    setText('dud-r2-flight', record.flightDuration);
  } else {
    setText('dud-r2-flight', record.error ? '!' : null);
  }

  if (record.endParts && !record.error) {
    setText('dud-r2-total-h', record.endParts.h);
    setText('dud-r2-total-m', record.endParts.m);
    setText('dud-r2-total-tk', record.landingsTotal);
  } else {
    setText('dud-r2-total-h', record.error ? '!' : null);
    setText('dud-r2-total-m', record.error ? '!' : null);
    setText('dud-r2-total-tk', record.error ? '!' : null);
  }

  setSignature('dud-r2-signature', crewRow2?.commander);
  syncNotes(els.dudR2Notes, notesState.dud, record.dudNotes);
}

function updateYai56(record) {
  if (record.tachStart != null) {
    setText('yai-r1-tach', formatTachDecimal(record.tachStart));
  } else {
    setText('yai-r1-tach', null);
  }
  setText('yai-r1-landings-total', record.landingsBefore);

  renderCrewCell(els.yaiR1Crew, crewRow1);
  renderCrewCell(els.yaiR2Crew, crewRow2);
  setSignature('yai-r1-signature', crewRow1?.commander);

  setText('yai-r2-date', record.date);
  setText('yai-r2-dep-place', record.departure);
  setText('yai-r2-dep-time', record.takeoff);
  setText('yai-r2-arr-place', record.arrival);
  setText('yai-r2-arr-time', record.landing);
  setText('yai-r2-takeoffs', record.landings);

  if (record.flightDuration && !record.error) {
    setText('yai-r2-flight', record.flightDuration);
  } else {
    setText('yai-r2-flight', record.error ? '!' : null);
  }

  if (record.tachEnd != null && !record.error) {
    setText('yai-r2-tach', formatTachDecimal(record.tachEnd));
  } else {
    setText('yai-r2-tach', record.error ? '!' : null);
  }

  setText('yai-r2-landings-total', record.error ? '!' : record.landingsTotal);

  setSignature('yai-r2-signature', crewRow2?.commander);
  syncNotes(els.yaiR2Notes, notesState.yai, record.yaiNotes);
}

function updateOutput() {
  const record = generateRecord(readForm());
  updateDud24(record);
  updateYai56(record);
}

function tableToText() {
  const rows = [];
  const table = getActiveTable();
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

els.dudR2Notes.addEventListener('input', () => {
  notesState.dud.dirty = true;
});

els.yaiR2Notes.addEventListener('input', () => {
  notesState.yai.dirty = true;
});

document.querySelectorAll('.form-grid input').forEach((input) => {
  input.addEventListener('input', () => {
    if (input === els.tachStart || input === els.departure) {
      crewRow1 = pickCrew(2);
      crewRow2 = pickCrewForExercise();
    }
    if (input === els.exercises) {
      updateExerciseHint(els.exercises, els.exerciseHint);
      crewRow2 = pickCrewForExercise();
    }
    saveForm();
    updateOutput();
  });
});

document.getElementById('btn-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(tableToText()).then(() => showToast('Zkopírováno'));
});

document.getElementById('btn-clear-form').addEventListener('click', () => {
  if (!confirm('Smazat uložená data a začít znovu?')) return;
  clearForm();
  showToast('Data smazána');
});

async function init() {
  await Promise.all([loadPilots(), loadExercises()]);
  initExerciseDatalist();
  initTemplateTabs();
  loadForm();
  updateExerciseHint(els.exercises, els.exerciseHint);
  pickBothCrews();
  initPilotBubbles();
  updateOutput();
}

init();
