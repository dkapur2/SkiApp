import { EXAMPLES, example } from './examples';
import { MAX_BATCH_BYTES, MAX_FILES, MAX_REPORT_BYTES, entryFor, identity, originLabel, parseReport, utc, type Origin, type ReviewEntry } from './report';
import { renderReport } from './render';

const get = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const files = get<HTMLInputElement>('files'), origin = get<HTMLSelectElement>('origin');
const location = get<HTMLSelectElement>('location'), elevation = get<HTMLSelectElement>('elevation'), windowSelect = get<HTMLSelectElement>('window');
const output = get('report'), library: ReviewEntry[] = [];
let selectedId = '', hour = 48;

function options(select: HTMLSelectElement, values: { value: string; label: string }[], selected: string): void {
  select.replaceChildren(...values.map(v => new Option(v.label, v.value)));
  select.value = values.some(v => v.value === selected) ? selected : values[0]?.value ?? '';
  select.disabled = !values.length;
}

function show(): void {
  const entry = library.find(r => r.id === selectedId);
  get('empty').hidden = Boolean(entry); output.hidden = !entry;
  get('count').textContent = `${library.length} report${library.length === 1 ? '' : 's'} in memory`;
  if (!entry) { output.replaceChildren(); return; }
  output.innerHTML = renderReport(entry, hour);
  const slider = get<HTMLInputElement>('hour');
  slider?.addEventListener('input', () => {
    hour = Number(slider.value); show();
    // Retain the keyboard focus after replacing the selected-hour plot/readout.
    get<HTMLInputElement>('hour')?.focus({ preventScroll: true });
  });
}

function filter(resetElevation = false, resetWindow = false): void {
  options(location, [...new Set(library.map(r => identity(r).location))].sort().map(v => ({ value: v, label: v })), location.value);
  const atLocation = library.filter(r => identity(r).location === location.value);
  options(elevation, [...new Set(atLocation.map(r => identity(r).elevation))].map(v => ({ value: v, label: v })), resetElevation ? '' : elevation.value);
  const atElevation = atLocation.filter(r => identity(r).elevation === elevation.value);
  options(windowSelect, atElevation.map(r => ({ value: r.id, label: `${utc(r.report.analysis?.window?.startMs)} → ${utc(r.report.analysis?.window?.endMs)} · ${r.name} · ${originLabel(r)}` })), resetWindow ? '' : selectedId);
  selectedId = windowSelect.value; hour = 48; show();
}

function selectEntry(entry: ReviewEntry): void {
  if (!library.some(r => r.id === entry.id)) library.push(entry);
  // Populate the selectors before choosing a newly added location/elevation.
  filter(); location.value = identity(entry).location; filter(true, true);
  elevation.value = identity(entry).elevation; selectedId = entry.id; filter();
}

files.addEventListener('change', async () => {
  const chosen = [...files.files ?? []], errors: string[] = [];
  if (!chosen.length) return;
  get('errors').textContent = ''; get('message').textContent = 'Reading selected files locally…';
  if (chosen.length + library.length > MAX_FILES || chosen.reduce((sum, file) => sum + file.size, 0) > MAX_BATCH_BYTES) {
    get('errors').textContent = 'Choose fewer files: at most 30 reports in memory and 32 MiB per import batch.'; files.value = ''; get('message').textContent = ''; return;
  }
  const declaredOrigin = origin.value as Origin;
  files.disabled = true; get<HTMLButtonElement>('clear').disabled = true;
  get('examples').querySelectorAll('button').forEach(button => { button.disabled = true; });
  let loaded = 0;
  for (const file of chosen) {
    try {
      if (file.size > MAX_REPORT_BYTES) throw new Error('Report exceeds the 4 MiB file limit.');
      const bytes = await file.arrayBuffer();
      const report = parseReport(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
      if (library.some(r => r.id === hash)) { errors.push(`${file.name}: already loaded; duplicate skipped.`); continue; }
      selectEntry(entryFor(report, file.name, hash, declaredOrigin)); loaded++;
    } catch (error) { errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unable to read this file.'}`); }
  }
  get('errors').textContent = errors.join('\n'); get('message').textContent = `${loaded} report${loaded === 1 ? '' : 's'} loaded locally. Nothing uploaded.`;
  files.value = ''; files.disabled = false; get<HTMLButtonElement>('clear').disabled = false;
  get('examples').querySelectorAll('button').forEach(button => { button.disabled = false; });
});

get('examples').replaceChildren(...EXAMPLES.map((name, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.textContent = name;
  button.addEventListener('click', () => {
    if (library.length >= MAX_FILES && !library.some(r => r.id === `synthetic-${index}`)) { get('errors').textContent = 'Clear reports before adding more; limit is 30.'; return; }
    selectEntry(example(index)); get('message').textContent = `Synthetic example selected: ${name}.`; get('errors').textContent = '';
  });
  return button;
}));
location.addEventListener('change', () => filter(true, true));
elevation.addEventListener('change', () => filter(false, true));
windowSelect.addEventListener('change', () => { selectedId = windowSelect.value; hour = 48; show(); });
get('clear').addEventListener('click', () => { library.length = 0; selectedId = ''; get('errors').textContent = ''; get('message').textContent = 'Reports cleared from viewer memory.'; filter(); });
filter();
