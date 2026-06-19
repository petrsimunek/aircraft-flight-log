let exercises = [];

const FALLBACK_EXERCISES = `cv.14|kontrolní let s instruktorem|dual
cv.15|samostatný let po okruhu|solo
cv.21|samostatný navigační let|solo`;

async function loadExercises() {
  try {
    const res = await fetch('data/exercises.txt');
    if (!res.ok) throw new Error(res.statusText);
    exercises = parseExercisesFile(await res.text());
  } catch {
    exercises = parseExercisesFile(FALLBACK_EXERCISES);
  }
}

function parseExercisesFile(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      const code = parts[0] || '';
      const description = parts[1] || '';
      const mode = (parts[2] || '').toLowerCase();
      return { code, description, mode };
    })
    .filter((ex) => ex.code && (ex.mode === 'solo' || ex.mode === 'dual'));
}

function findExercise(value) {
  const query = value.trim().toLowerCase();
  if (!query) return null;
  return exercises.find((ex) => ex.code.toLowerCase() === query) || null;
}

function crewSizeForExercise(exercise) {
  if (!exercise) return 2;
  return exercise.mode === 'dual' ? 2 : 1;
}

function initExerciseDatalist() {
  const datalist = document.getElementById('exercise-options');
  datalist.innerHTML = '';

  exercises.forEach((ex) => {
    const option = document.createElement('option');
    option.value = ex.code;
    const modeLabel = ex.mode === 'dual' ? 'dvojí' : 'sólo';
    option.label = `${ex.description} (${modeLabel})`;
    datalist.appendChild(option);
  });
}

function updateExerciseHint(inputEl, hintEl) {
  const ex = findExercise(inputEl.value);
  if (!ex) {
    hintEl.hidden = true;
    hintEl.textContent = '';
    return null;
  }

  const modeLabel = ex.mode === 'dual' ? 'dvojí let' : 'sólo let';
  hintEl.textContent = `${ex.description} — ${modeLabel}`;
  hintEl.hidden = false;
  return ex;
}
