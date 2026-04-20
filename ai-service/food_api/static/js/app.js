/**
 * NutriScan AI — Frontend Application
 * All race conditions fixed, proper abort controller, correct nutrition parsing
 */
'use strict';

// ── DOM ──────────────────────────────────────────────────────────────
const dropZone       = document.getElementById('dropZone');
const fileInput      = document.getElementById('fileInput');
const dzIdle         = document.getElementById('dzIdle');
const dzPreview      = document.getElementById('dzPreview');
const dzDrag         = document.getElementById('dzDrag');
const previewImg     = document.getElementById('previewImg');
const previewInfo    = document.getElementById('previewInfo');
const btnRemove      = document.getElementById('btnRemove');
const btnAnalyze     = document.getElementById('btnAnalyze');
const btnText        = document.getElementById('btnText');
const toggleVisualize= document.getElementById('toggleVisualize');

// Panes
const paneEmpty   = document.getElementById('paneEmpty');
const paneLoading = document.getElementById('paneLoading');
const paneError   = document.getElementById('paneError');
const paneResults = document.getElementById('paneResults');

// Loading
const lstep1      = document.getElementById('lstep1');
const lstep2      = document.getElementById('lstep2');
const lstep3      = document.getElementById('lstep3');
const loadingLabel= document.getElementById('loadingLabel');
const scanPreview = document.getElementById('scanPreviewImg');

// Error
const errorMsg    = document.getElementById('errorMsg');
const btnRetry    = document.getElementById('btnRetry');

// Results
const resultImgBlock = document.getElementById('resultImgBlock');
const resultImg      = document.getElementById('resultImg');
const dlLink         = document.getElementById('dlLink');
const statIngredients= document.getElementById('statIngredients');
const statMass       = document.getElementById('statMass');
const statCalories   = document.getElementById('statCalories');
const ingList        = document.getElementById('ingList');
const ingCount       = document.getElementById('ingCount');
const nutritionBlock = document.getElementById('nutritionBlock');
const nutritionGrid  = document.getElementById('nutritionGrid');
const jsonCode       = document.getElementById('jsonCode');
const btnCopy        = document.getElementById('btnCopy');
const copyLabel      = document.getElementById('copyLabel');

// Header
const statusPill = document.getElementById('statusPill');
const statusText = document.getElementById('statusText');
const modelInfo  = document.getElementById('modelInfo');
const footerClasses = document.getElementById('footerClasses');

// ── State ────────────────────────────────────────────────────────────
let currentFile  = null;
let lastJson     = null;
let abortCtrl    = null;      // AbortController for in-flight request
let stepTimers   = [];        // clearable step timers

const SWATCHES = [
  '#22c55e','#4ade80','#86efac','#34d399',
  '#38bdf8','#60a5fa','#a78bfa','#fb923c',
  '#fcd34d','#f472b6',
];

// ── Health check ─────────────────────────────────────────────────────
(async () => {
  try {
    const r = await fetch('/health', { signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error();
    const d = await r.json();

    statusPill.classList.add('is-ok');
    statusText.textContent = 'Model ready';

    const classCount = d.classes || 104;
    modelInfo.textContent = `${classCount} classes`;
    if (footerClasses) footerClasses.textContent = `${classCount} classes`;

  } catch {
    statusPill.classList.add('is-err');
    statusText.textContent = 'API offline';
  }
})();

// ── Pane switcher ────────────────────────────────────────────────────
function showPane(name) {
  paneEmpty.hidden   = name !== 'empty';
  paneLoading.hidden = name !== 'loading';
  paneError.hidden   = name !== 'error';
  paneResults.hidden = name !== 'results';
}

// ── File management ──────────────────────────────────────────────────
function setFile(file) {
  currentFile = file;
  const url = URL.createObjectURL(file);

  previewImg.src = url;
  previewImg.alt = file.name;
  scanPreview.src = url;

  // Format file size
  const sizeKB = (file.size / 1024).toFixed(0);
  const sizeStr = file.size > 1024 * 1024
    ? `${(file.size / 1048576).toFixed(1)} MB`
    : `${sizeKB} KB`;
  previewInfo.textContent = `${file.name.replace(/.*[/\\]/, '').substring(0, 22)} · ${sizeStr}`;

  dzIdle.hidden   = true;
  dzPreview.hidden = false;
  btnAnalyze.disabled = false;

  showPane('empty');
}

function clearFile() {
  currentFile = null;
  previewImg.src = '';
  scanPreview.src = '';
  dzPreview.hidden = true;
  dzIdle.hidden   = false;
  btnAnalyze.disabled = true;
  lastJson = null;
  cancelRequest();
  showPane('empty');
}

// ── Drop zone interactions ───────────────────────────────────────────
dropZone.addEventListener('click', e => {
  if (e.target === btnRemove || btnRemove.contains(e.target)) return;
  fileInput.click();
});

dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
  fileInput.value = '';
});

// Drag events
dropZone.addEventListener('dragenter', e => {
  e.preventDefault();
  if (e.dataTransfer.types.includes('Files')) {
    dropZone.classList.add('is-drag-over');
    dzIdle.hidden   = true;
    dzDrag.hidden   = false;
    dzPreview.hidden = true;
  }
});

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
});

dropZone.addEventListener('dragleave', e => {
  if (!dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('is-drag-over');
    dzDrag.hidden = true;
    if (currentFile) {
      dzPreview.hidden = false;
    } else {
      dzIdle.hidden = false;
    }
  }
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('is-drag-over');
  dzDrag.hidden = true;

  const file = e.dataTransfer.files[0];
  if (!file) {
    restoreDropzoneIdle();
    return;
  }
  if (!file.type.startsWith('image/')) {
    restoreDropzoneIdle();
    showError('Only image files are supported (JPG, PNG, WEBP, AVIF).');
    return;
  }
  setFile(file);
});

function restoreDropzoneIdle() {
  if (currentFile) {
    dzPreview.hidden = false;
    dzIdle.hidden = true;
  } else {
    dzPreview.hidden = true;
    dzIdle.hidden = false;
  }
}

btnRemove.addEventListener('click', e => { e.stopPropagation(); clearFile(); });
btnRemove.addEventListener('mousedown', e => e.stopPropagation());

// ── Progress steps ───────────────────────────────────────────────────
const STEPS = [
  { el: lstep1, label: 'Preprocessing image…',          ms: 0    },
  { el: lstep2, label: 'Running segmentation model…',   ms: 900  },
  { el: lstep3, label: 'Fetching nutrition data…',       ms: 2200 },
];

function clearStepTimers() {
  stepTimers.forEach(clearTimeout);
  stepTimers = [];
}

function startProgressSteps() {
  clearStepTimers();

  // Reset all
  STEPS.forEach(s => s.el.className = 'lstep');
  loadingLabel.textContent = STEPS[0].label;

  // Activate each step at its time
  STEPS.forEach((step, i) => {
    const tActivate = stepTimers[stepTimers.length] = setTimeout(() => {
      // Mark previous as done
      if (i > 0) STEPS[i - 1].el.classList.replace('is-active', 'is-done');
      step.el.classList.add('is-active');
      loadingLabel.textContent = step.label;
    }, step.ms);
    stepTimers.push(tActivate);
  });
}

function finishProgressSteps() {
  clearStepTimers();
  STEPS.forEach(s => {
    s.el.className = 'lstep is-done';
  });
}

// ── Request management ───────────────────────────────────────────────
function cancelRequest() {
  if (abortCtrl) {
    abortCtrl.abort();
    abortCtrl = null;
  }
  clearStepTimers();
}

// ── Analyze ──────────────────────────────────────────────────────────
btnAnalyze.addEventListener('click', analyze);

async function analyze() {
  if (!currentFile || btnAnalyze.disabled) return;

  // Cancel any in-flight request
  cancelRequest();
  abortCtrl = new AbortController();

  // Lock UI
  btnAnalyze.disabled = true;
  btnAnalyze.classList.add('is-loading');
  btnText.textContent = 'Analyzing…';

  showPane('loading');
  startProgressSteps();

  const formData = new FormData();
  formData.append('file', currentFile);

  const visualize = toggleVisualize.checked;

  try {
    const res = await fetch(`/segment?visualize=${visualize}`, {
      method: 'POST',
      body: formData,
      signal: abortCtrl.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
      throw new Error(err.detail || `Server error ${res.status}`);
    }

    const data = await res.json();
    lastJson = data;

    finishProgressSteps();

    // Small pause so the "done" state is visible
    await sleep(300);

    renderResults(data);
    showPane('results');

  } catch (err) {
    clearStepTimers();
    if (err.name === 'AbortError') return; // User cancelled — do nothing
    showError(err.message || 'Unexpected error. Please try again.');
  } finally {
    abortCtrl = null;
    btnAnalyze.disabled = !currentFile;
    btnAnalyze.classList.remove('is-loading');
    btnText.textContent = 'Analyze Food';
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  showPane('error');
}

btnRetry.addEventListener('click', () => {
  if (currentFile) {
    analyze();
  } else {
    showPane('empty');
  }
});

// ── Render results ───────────────────────────────────────────────────
function renderResults(data) {
  const { num_ingredients, ingredients = [], nutrition, visual } = data;

  // Segmented image
  if (visual) {
    resultImg.src = visual;
    dlLink.href = visual;
    resultImgBlock.hidden = false;
  } else {
    resultImgBlock.hidden = true;
  }

  // Stats
  statIngredients.textContent = num_ingredients ?? ingredients.length;

  const totalMass = ingredients.reduce((s, i) => s + (i.estimated_mass_g ?? 0), 0);
  statMass.textContent = `${Math.round(totalMass)}g`;

  const totalCal = extractCalories(nutrition);
  statCalories.textContent = totalCal !== null ? `${Math.round(totalCal)} kcal` : '—';

  // Ingredients
  renderIngredients(ingredients);

  // Nutrition — fixed parsing: handles both { items: [...] } and { items: { items: [...] } }
  const nutItems = flattenNutritionItems(nutrition);
  if (nutItems && nutItems.length > 0) {
    renderNutrition(nutItems);
    nutritionBlock.hidden = false;
  } else {
    nutritionBlock.hidden = true;
  }

  // JSON
  renderJson(data);
}

/**
 * Safely extracts the array of nutrition items from either shape:
 *   { items: [...] }           ← CalorieNinjas direct
 *   { items: { items: [...] } } ← backend double-wrap
 */
function flattenNutritionItems(nutrition) {
  if (!nutrition) return null;
  if (Array.isArray(nutrition.items)) return nutrition.items;
  if (nutrition.items && Array.isArray(nutrition.items.items)) return nutrition.items.items;
  return null;
}

function extractCalories(nutrition) {
  const items = flattenNutritionItems(nutrition);
  if (!items || items.length === 0) return null;
  return items.reduce((sum, item) => sum + (item.calories ?? 0), 0);
}

// ── Ingredients ───────────────────────────────────────────────────────
function renderIngredients(ingredients) {
  ingList.innerHTML = '';

  if (!ingredients.length) {
    const empty = document.createElement('p');
    empty.style.cssText = 'padding:16px;text-align:center;font-size:.875rem;color:var(--c-text-lo)';
    empty.textContent = 'No ingredients detected.';
    ingList.appendChild(empty);
    ingCount.textContent = '0';
    return;
  }

  ingCount.textContent = String(ingredients.length);

  ingredients.forEach((ing, idx) => {
    const color = SWATCHES[idx % SWATCHES.length];
    const mass  = (ing.estimated_mass_g ?? 0).toFixed(1);
    const conf  = Math.round((ing.confidence ?? 0) * 100);

    const el = document.createElement('div');
    el.className = 'ing-item';
    el.setAttribute('role', 'listitem');
    el.style.animationDelay = `${idx * 50}ms`;

    el.innerHTML =
      `<span class="ing-item__dot" style="background:${color}" aria-hidden="true"></span>` +
      `<span class="ing-item__name">${escHtml(ing.ingredient)}</span>` +
      `<span class="ing-item__mass">${mass}g</span>` +
      `<span class="ing-item__conf" title="Detection confidence">${conf}%</span>`;

    ingList.appendChild(el);
  });
}

// ── Nutrition ──────────────────────────────────────────────────────────
function renderNutrition(items) {
  nutritionGrid.innerHTML = '';

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'nut-card';
    card.style.animationDelay = `${idx * 60}ms`;

    const name    = escHtml(item.name ?? 'Item');
    const cal     = fmt(item.calories, 'kcal');
    const protein = fmt(item.protein_g, 'g');
    const carbs   = fmt(item.carbohydrates_total_g, 'g');
    const fat     = fmt(item.fat_total_g, 'g');
    const fiber   = fmt(item.fiber_g, 'g');
    const sodium  = fmt(item.sodium_mg, 'mg');

    card.innerHTML =
      `<div class="nut-card__name">${name}</div>` +
      `<div class="nut-macros">` +
        `<div class="nut-macro nut-macro--cal"><span class="nut-macro__label">Cal</span><span class="nut-macro__val">${cal}</span></div>` +
        `<div class="nut-macro"><span class="nut-macro__label">Protein</span><span class="nut-macro__val">${protein}</span></div>` +
        `<div class="nut-macro"><span class="nut-macro__label">Carbs</span><span class="nut-macro__val">${carbs}</span></div>` +
        `<div class="nut-macro"><span class="nut-macro__label">Fat</span><span class="nut-macro__val">${fat}</span></div>` +
        `<div class="nut-macro"><span class="nut-macro__label">Fiber</span><span class="nut-macro__val">${fiber}</span></div>` +
        `<div class="nut-macro"><span class="nut-macro__label">Na</span><span class="nut-macro__val">${sodium}</span></div>` +
      `</div>`;

    nutritionGrid.appendChild(card);
  });
}

// ── JSON display ─────────────────────────────────────────────────────
function renderJson(data) {
  // Replace large base64 with a placeholder (use null, not undefined — JSON.stringify drops undefined)
  const display = { ...data, visual: data.visual ? '[base64 image — omitted]' : null };
  if (display.visual === null) delete display.visual; // cleaner: just omit it

  jsonCode.innerHTML = highlight(JSON.stringify(display, null, 2));
}

function highlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) return /:$/.test(match) ? `<span class="jk">${match}</span>` : `<span class="js">${match}</span>`;
        if (/true|false/.test(match))        return `<span class="jb">${match}</span>`;
        if (/null/.test(match))              return `<span class="jx">${match}</span>`;
        return `<span class="jn">${match}</span>`;
      }
    );
}

// ── Copy JSON ─────────────────────────────────────────────────────────
btnCopy.addEventListener('click', async () => {
  if (!lastJson) return;
  const display = { ...lastJson };
  if (display.visual) display.visual = '[base64 image — omitted]';

  try {
    await navigator.clipboard.writeText(JSON.stringify(display, null, 2));
    btnCopy.classList.add('is-copied');
    copyLabel.textContent = 'Copied!';
    setTimeout(() => {
      btnCopy.classList.remove('is-copied');
      copyLabel.textContent = 'Copy';
    }, 2000);
  } catch {
    // Fallback: select the text
    const range = document.createRange();
    range.selectNodeContents(jsonCode);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
  }
});

// ── Keyboard shortcut ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (currentFile && !btnAnalyze.disabled) analyze();
  }
  if (e.key === 'Escape') {
    cancelRequest();
    if (paneLoading && !paneLoading.hidden) {
      showPane(currentFile ? 'empty' : 'empty');
      btnAnalyze.disabled = !currentFile;
      btnAnalyze.classList.remove('is-loading');
      btnText.textContent = 'Analyze Food';
    }
  }
});

// ── Utilities ─────────────────────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

function fmt(val, unit) {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(1)}${unit}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
