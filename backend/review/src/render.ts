import { HOUR_MS } from '../../src/services/openMeteoHourly';
import { identity, object, originLabel, timeline, utc, type ReviewEntry, type TimelineRow } from './report';

export const escapeHtml = (value: unknown): string => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const amount = (value: number | null, unit: string): string => value === null ? 'Unavailable' : `${value} ${unit}`;
const stamp = (value: unknown): string => escapeHtml(utc(value));
const names = { thaw_then_freezing: 'Thaw → freezing', rain_then_freezing: 'Rain → freezing', sustained_cold: 'Sustained cold' };

export function hourDescription(row: TimelineRow): string {
  return `${utc(row.atMs)} · ${row.period}. Temperature: ${amount(row.temperatureC, '°C')}. Liquid: ${row.interval === 'Outside analysis window' ? row.interval : amount(row.liquidMm, 'mm') + ' over ' + row.interval}.${row.missingHour ? ' Required hour missing.' : ''}`;
}

function plot(entry: ReviewEntry, rows: TimelineRow[], kind: 'temperature' | 'liquid', selected: number): string {
  if (!rows.length) return '<p>No valid timeline is available for this rejected capture.</p>';
  const start = rows[0].atMs, end = rows.at(-1)!.atMs;
  const asOf = entry.report.normalization.status === 'normalized' ? entry.report.normalization.input.asOfMs : start;
  const x = (time: number): number => 56 + (time - start) / (end - start) * 840;
  const values = rows.map(r => kind === 'temperature' ? r.temperatureC : r.liquidMm).filter((v): v is number => v !== null);
  const low = kind === 'liquid' ? 0 : Math.min(-2, ...values) - 1;
  const high = Math.max(kind === 'liquid' ? 1 : 2, ...values) + (kind === 'liquid' ? 0 : 1);
  const magnitude = Math.max(1, Math.abs(low), Math.abs(high));
  const y = (value: number): number => 166 - (value / magnitude - low / magnitude) / (high / magnitude - low / magnitude) * 126;
  const future = Math.min(896, Math.max(56, x(asOf)));
  const points: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], value = kind === 'temperature' ? row.temperatureC : row.liquidMm;
    const phase = row.atMs > asOf ? 'future-value' : 'past-value';
    if (kind === 'temperature') {
      if (value === null) { points.push(`<text x="${x(row.atMs)}" y="182" class="missing-mark">×</text>`); continue; }
      const previous = rows[i - 1];
      if (previous && previous.temperatureC !== null) points.push(`<line class="temperature-line ${phase}" x1="${x(previous.atMs)}" y1="${y(previous.temperatureC)}" x2="${x(row.atMs)}" y2="${y(value)}"/>`);
      points.push(`<circle class="${phase}" cx="${x(row.atMs)}" cy="${y(value)}" r="${i === selected ? 5 : 2}"/>`);
    } else if (i > 0) {
      const left = x(row.atMs - HOUR_MS), width = x(row.atMs) - left;
      if (value === null) points.push(`<rect class="missing-bar" x="${left + 1}" y="45" width="${width - 2}" height="121"/><text class="missing-mark" x="${left + width / 2}" y="155">?</text>`);
      else if (value === 0) points.push(`<circle class="zero-value" cx="${left + width / 2}" cy="166" r="2.5"/>`);
      else points.push(`<rect class="${phase}" x="${left + 1}" y="${y(value)}" width="${width - 2}" height="${166 - y(value)}"/>`);
    }
  }
  const evidence = entry.report.analysis?.signals.flatMap(s => s.evidence) ?? [];
  return `<svg viewBox="0 0 930 225" role="img" aria-labelledby="${kind}-title ${kind}-desc">
    <title id="${kind}-title">${kind === 'temperature' ? 'Air temperature in Celsius' : 'Liquid precipitation in millimetres over each preceding hour'}</title>
    <desc id="${kind}-desc">UTC timeline. The vertical evaluation line separates lookback model estimates from future forecasts. Gaps and question marks mean unavailable; outlined circles at zero mean known zero. Use the hour inspector or data table for exact values.</desc>
    <rect class="lookback-shade" x="56" y="30" width="840" height="146"/>
    <rect class="forecast-shade" x="${future}" y="30" width="${896 - future}" height="146"/>
    <text x="64" y="20">LOOKBACK MODEL ESTIMATES</text><text x="${Math.min(future + 8, 775)}" y="20">FUTURE FORECAST</text>
    ${[low, (low + high) / 2, high].map(v => `<line class="grid-line" x1="56" x2="896" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="47" y="${y(v) + 4}" text-anchor="end">${Number(v.toFixed(1))}</text>`).join('')}
    ${kind === 'temperature' ? `<line class="zero-line" x1="56" x2="896" y1="${y(0)}" y2="${y(0)}"/>` : ''}
    ${points.join('')}
    <line class="evaluation-line" x1="${future}" x2="${future}" y1="27" y2="184"/>
    <line class="selected-line" x1="${x(rows[selected].atMs)}" x2="${x(rows[selected].atMs)}" y1="30" y2="186"/>
    ${evidence.map(e => `<rect class="evidence-span" x="${x(e.startMs)}" y="189" width="${Math.max(2, x(e.endMs) - x(e.startMs))}" height="4"/>`).join('')}
    ${[0, 24, 48, 72].map(i => `<text class="axis-label" x="${x(rows[i].atMs)}" y="212" text-anchor="${i === 0 ? 'start' : i === 72 ? 'end' : 'middle'}">${utc(rows[i].atMs).slice(5, 16).replace('T', ' ')} UTC</text>`).join('')}
  </svg>`;
}

export function renderReport(entry: ReviewEntry, selected = 48): string {
  const { report } = entry, { location, elevation } = identity(entry);
  const rows = timeline(report), analysis = report.analysis;
  const snapshot = object(report.snapshot) ? report.snapshot : {};
  const normalized = report.normalization.status === 'normalized' ? report.normalization : null;
  const index = Math.max(0, Math.min(rows.length - 1, selected));
  const reasons = analysis?.reasons.map(r => `${r.message}${r.atMs === undefined ? '' : ' At ' + utc(r.atMs)}`) ?? [];
  if (report.normalization.status === 'rejected') reasons.push(`${report.normalization.issue.code}: ${report.normalization.issue.message}`);
  const title = report.status === 'insufficient_data' ? 'Insufficient data — analysis abstained' : analysis?.signals.length ? `${analysis.signals.length} experimental pattern${analysis.signals.length === 1 ? '' : 's'}` : 'No configured pattern';
  return `<section class="report-heading" aria-labelledby="report-title">
    <p class="eyebrow">${escapeHtml(originLabel(entry))}</p><h2 id="report-title">${escapeHtml(location)}</h2>
    <p class="subtitle">${escapeHtml(elevation)} · ${escapeHtml(entry.name)}</p>
    ${entry.origin === 'synthetic' ? '<p class="notice">Synthetic demonstration. These weather values and timestamps are invented. No real event or observation is represented.</p>' : ''}
    ${entry.origin === 'unverified' ? '<p class="notice">Origin is unverified. A structurally consistent report does not prove that its input came from a provider.</p>' : ''}
    ${entry.septemberPipeline ? '<p class="notice">September 16 pipeline check · no qualifying events. This fingerprint matches the retained capture; it does not establish provider authenticity or surface-risk accuracy.</p>' : ''}
    <div class="summary-grid"><div><span class="label">Temperature endpoints</span><strong>${rows.filter(r => r.temperatureC !== null).length} / 73</strong></div><div><span class="label">Liquid intervals</span><strong>${rows.slice(1).filter(r => r.liquidMm !== null).length} / 72</strong></div><div><span class="label">Recorded evaluation · UTC</span><strong class="timestamp">${stamp(snapshot.asOfMs)}</strong></div></div>
  </section>
  <section class="card"><div class="section-top"><h3>Hourly evidence</h3><span class="tag">°C · mm · UTC</span></div>
    <p>Temperature is instantaneous. Each liquid bar covers the preceding hour (start, end]. These include modeled lookback hours, not observations.</p>
    <h4>Air temperature</h4>${plot(entry, rows, 'temperature', index)}
    <h4>Rain + showers</h4>${plot(entry, rows, 'liquid', index)}
    <p class="chart-key">Solid / shaded left: lookback model · dashed / shaded right: future forecast · purple strips: pattern evidence · × / ?: unavailable · outlined circle: known zero liquid.</p>
    ${rows.length ? `<label for="hour">Inspect an hour with the arrow keys</label><input id="hour" type="range" min="0" max="72" step="1" value="${index}" aria-valuetext="${escapeHtml(hourDescription(rows[index]))}" aria-describedby="hour-readout"><p id="hour-readout" class="hour-readout" aria-live="polite">${escapeHtml(hourDescription(rows[index]))}</p>` : ''}
    <p class="small">Window anchor: ${stamp(analysis?.window?.anchorMs)}. The model classifies pattern periods relative to this rounded hour. The timeline splits at the exact recorded evaluation instant. Nothing is refreshed to today’s clock.</p>
  </section>
  <section class="card"><div class="section-top"><h3>${escapeHtml(title)}</h3><span class="tag">${escapeHtml(report.status)}</span></div>
    <p class="caution">Surface conditions remain unknown. “No pattern” never means good, safe, or ice-free. Snow cover, wetness, grooming and operations are not inferred.</p>
    ${reasons.length ? `<ul>${reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : ''}
    ${analysis?.signals.map(signal => `<article class="pattern"><h4>${names[signal.kind]}</h4><p class="label">${signal.period === 'includes_forecast' ? 'Includes future forecast' : 'Lookback model pattern'}</p><p>${escapeHtml(signal.reason)}</p><ul>${signal.evidence.map(e => `<li>${stamp(e.startMs)} → ${stamp(e.endMs)}</li>`).join('')}</ul></article>`).join('') ?? ''}
  </section>
  <section class="card"><h3>Source & provenance</h3><dl class="provenance">
    <dt>Weather product</dt><dd>${entry.origin === 'synthetic' ? 'Synthetic Open-Meteo-shaped input' : 'Open-Meteo forecast · weather-model estimates'}</dd>
    <dt>Origin label</dt><dd>${escapeHtml(originLabel(entry))}</dd>
    <dt>Server fetch time</dt><dd>${snapshot.fetchedAtMs == null ? 'Unavailable — not invented' : stamp(snapshot.fetchedAtMs)}</dd>
    <dt>Model-run time</dt><dd>${snapshot.modelRunAtMs == null ? 'Not provided' : stamp(snapshot.modelRunAtMs)}</dd>
    <dt>Request time</dt><dd>${stamp(object(snapshot.request) ? snapshot.request.requestedAtMs : null)}</dd>
    <dt>Request / grid</dt><dd>${object(snapshot.request) ? escapeHtml(`${snapshot.request.latitude}, ${snapshot.request.longitude}`) : 'Unavailable'} / ${normalized ? escapeHtml(`${normalized.grid.latitude}, ${normalized.grid.longitude}; ${normalized.grid.elevationM} m`) : 'Unavailable'}</dd>
    <dt>Versions</dt><dd>${escapeHtml(report.evaluationVersion)}<br>${escapeHtml(report.normalization.adapterVersion)}<br>${escapeHtml(analysis?.modelVersion ?? 'Model did not run')}<br>${escapeHtml(snapshot.schemaVersion ?? 'Unknown snapshot version')}</dd>
    <dt>Capture fingerprint / example ID</dt><dd class="hash">${escapeHtml(entry.id)}</dd>
  </dl><p>Fetch time is retrieval time, not model initialization. A historical replay is not a fresh forecast. Origin labels are not authenticated provider signatures.</p>
  <p><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. ${escapeHtml(report.attribution.modifications)} Synthetic examples contain no captured provider data.</p></section>
  <section class="card"><h3>Limitations</h3><ul>${(analysis?.limitations ?? ['Normalization rejected this capture; no model conclusions are available.']).map(l => `<li>${escapeHtml(l)}</li>`).join('')}<li>Grid centers can vary with target elevation. This does not validate local inversions or precipitation phase.</li><li>No independent surface observations are attached to this viewer.</li></ul></section>
  ${rows.length ? `<details class="card"><summary>Accessible hourly data table · 73 endpoints</summary><div class="table-scroll" tabindex="0" role="region" aria-label="Hourly values"><table><caption>UTC temperature endpoints and preceding-hour liquid intervals. Unknown values remain unavailable.</caption><thead><tr><th scope="col">UTC endpoint</th><th scope="col">Period</th><th scope="col">Temperature</th><th scope="col">Liquid</th><th scope="col">Interval / data status</th></tr></thead><tbody>${rows.map((r, i) => `<tr><th scope="row">${stamp(r.atMs)}</th><td>${escapeHtml(r.period)}</td><td>${amount(r.temperatureC, '°C')}</td><td>${i === 0 ? 'Outside window' : amount(r.liquidMm, 'mm')}</td><td>${escapeHtml(r.interval)}${r.missingHour ? ' · Missing hour' : ''}</td></tr>`).join('')}</tbody></table></div></details>` : ''}`;
}
