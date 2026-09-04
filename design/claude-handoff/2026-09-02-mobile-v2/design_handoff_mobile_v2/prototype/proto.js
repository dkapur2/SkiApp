/* SkiTheEast mobile v2 — prototype interaction controller.
   Shared by the Design Component source and the static index.html export.
   No dependencies. All data in the prototype is illustrative. */
(function () {
  'use strict';

  var NO_TABS = ['welcome', 'onb-1', 'onb-2', 'onb-3', 'onb-4', 'origin', 'filters', 'compare'];
  var TAB_OF = {
    today: 'today', 'explore-map': 'explore', 'explore-list': 'explore', saved: 'saved',
    alerts: 'saved', 'st-loading': 'today', 'st-stale': 'today', 'st-partial': 'today',
    'st-offline': 'today', 'st-location-denied': 'today', 'st-notif-denied': 'saved',
    'st-offseason': 'today', 'st-insufficient': 'today', 'st-empty': 'explore'
  };

  var SEG_ON = { background: 'var(--surface)', color: 'var(--text)', boxShadow: '0 1px 4px rgba(16,35,41,.10)', fontWeight: '750' };
  var SEG_OFF = { background: 'transparent', color: 'var(--text-soft)', boxShadow: 'none', fontWeight: '650' };
  var CHIP_ON = { background: 'var(--brand-soft)', color: 'var(--brand-strong)', borderColor: 'var(--brand)' };
  var CHIP_OFF = { background: 'var(--surface)', color: 'var(--text-soft)', borderColor: 'var(--line)' };

  var current = 'today';
  var previous = 'today';
  var toastTimer = null;

  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function one(sel, ctx) { return (ctx || document).querySelector(sel); }
  function css(el, map) { if (!el) return; for (var k in map) { el.style[k] = map[k]; } }
  function reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ---------------------------------------------------------------- routing */

  function showScreen(name, opts) {
    var target = one('[data-screen="' + name + '"]');
    if (!target) return;
    if (current !== name && NO_TABS.indexOf(current) < 0 && current.indexOf('st-') !== 0) previous = current;
    if (opts && opts.from) previous = opts.from;
    current = name;

    all('[data-screen]').forEach(function (s) { s.style.display = s === target ? 'block' : 'none'; });

    var bar = one('#tabbar');
    if (bar) bar.style.display = NO_TABS.indexOf(name) >= 0 ? 'none' : 'grid';

    var header = one('#appheader');
    if (header) header.style.display = NO_TABS.indexOf(name) >= 0 && name !== 'filters' && name !== 'compare' ? 'none' : 'flex';

    var tab = TAB_OF[name] || null;
    all('[data-tab]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      css(b, on
        ? { color: 'var(--brand)', background: 'var(--brand-soft)' }
        : { color: 'var(--text-faint)', background: 'transparent' });
    });

    var scroll = one('#scroll');
    if (scroll) scroll.scrollTop = 0;
    if (!reduced()) {
      target.style.animation = 'none';
      void target.offsetWidth;
      target.style.animation = 'scr .19s ease-out';
    }

    all('[data-jump]').forEach(function (b) {
      var on = b.getAttribute('data-jump') === name;
      css(b, on
        ? { background: 'var(--brand-soft)', color: 'var(--brand-strong)', borderColor: 'var(--brand)' }
        : { background: 'transparent', color: 'var(--text-soft)', borderColor: 'var(--line)' });
    });
  }

  /* ----------------------------------------------------------------- toast  */

  function toast(msg) {
    var t = one('#toast');
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translate(-50%,0)';
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      t.style.opacity = '0';
      t.style.transform = 'translate(-50%,10px)';
    }, 1900);
  }

  /* ------------------------------------------------------- generic controls */

  function wireSegments() {
    all('[data-seg]').forEach(function (group) {
      var opts = all('[data-seg-opt]', group);
      opts.forEach(function (opt) {
        opt.addEventListener('click', function () {
          opts.forEach(function (o) {
            var on = o === opt;
            css(o, on ? SEG_ON : SEG_OFF);
            o.setAttribute('aria-selected', String(on));
          });
          var handler = group.getAttribute('data-seg');
          if (handler === 'appearance') setTheme(opt.getAttribute('data-seg-opt'));
          if (handler === 'exploreview') showScreen(opt.getAttribute('data-seg-opt') === 'map' ? 'explore-map' : 'explore-list');
          if (handler === 'elevation') setElevation(opt.getAttribute('data-seg-opt'));
          if (handler === 'day') toast('Illustrative: only Sat Jan 17 carries prototype data');
        });
      });
    });
  }

  function wireChips() {
    all('[data-chip]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var on = chip.getAttribute('aria-pressed') !== 'true';
        chip.setAttribute('aria-pressed', String(on));
        css(chip, on ? CHIP_ON : CHIP_OFF);
      });
    });
  }

  function wireSwitches() {
    all('[role="switch"]').forEach(function (sw) {
      sw.addEventListener('click', function () {
        var on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(on));
        var track = one('[data-track]', sw);
        var knob = one('[data-knob]', sw);
        if (track) track.style.background = on ? 'var(--brand)' : 'var(--switch-off)';
        if (knob) knob.style.transform = on ? 'translateX(20px)' : 'translateX(0)';
        if (sw.getAttribute('data-alert')) toast(on ? 'Alert concept enabled' : 'Alert concept disabled');
      });
    });
  }

  function wireDisclosures() {
    all('[data-disc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var body = one('[data-disc-body="' + btn.getAttribute('data-disc') + '"]');
        if (!body) return;
        var open = body.style.display === 'block';
        body.style.display = open ? 'none' : 'block';
        btn.setAttribute('aria-expanded', String(!open));
        var mark = one('[data-disc-mark]', btn);
        if (mark) mark.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
        var lbl = btn.getAttribute('data-disc-open');
        if (lbl) {
          var text = one('[data-disc-text]', btn);
          if (text) text.textContent = open ? btn.getAttribute('data-disc-closed') : lbl;
        }
      });
    });
  }

  function wireRadio() {
    all('[data-radio]').forEach(function (group) {
      var opts = all('[data-radio-opt]', group);
      opts.forEach(function (opt) {
        opt.addEventListener('click', function () {
          var multi = group.getAttribute('data-radio') === 'multi';
          if (multi) {
            var on = opt.getAttribute('aria-checked') !== 'true';
            paintRadio(opt, on);
          } else {
            opts.forEach(function (o) { paintRadio(o, o === opt); });
          }
        });
      });
    });
  }

  function paintRadio(opt, on) {
    opt.setAttribute('aria-checked', String(on));
    css(opt, on
      ? { borderColor: 'var(--brand)', background: 'var(--brand-soft)' }
      : { borderColor: 'var(--line)', background: 'var(--surface)' });
    var dot = one('[data-radio-dot]', opt);
    if (dot) {
      dot.style.borderColor = on ? 'var(--brand)' : 'var(--line)';
      dot.style.background = on ? 'var(--brand)' : 'transparent';
      dot.style.boxShadow = on ? 'inset 0 0 0 3px var(--surface)' : 'none';
    }
  }

  /* ------------------------------------------------ constraint re-rank demo */

  function wireConstraints() {
    all('[data-loosen]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var kind = chip.getAttribute('data-loosen');
        if (kind !== 'drive') { toast('Loosening this constraint does not change the ranking'); return; }
        var loosened = chip.getAttribute('data-loosened') === 'true';
        chip.setAttribute('data-loosened', String(!loosened));
        applyDriveLoosen(!loosened, chip);
      });
    });
  }

  function applyDriveLoosen(loose, chip) {
    var diff = one('#rank-diff');
    var promoted = one('#alt-killington');
    var list = one('#alt-list');
    var weekend = one('#weekend-slot');
    var label = one('[data-chip-label]', chip);
    var leader = one('#leader-card');
    var leaderNote = one('#leader-swap-note');

    if (loose) {
      css(chip, { background: 'var(--warning-soft)', color: 'var(--warning)', borderColor: 'var(--warning)' });
      if (label) label.textContent = 'Drive limit off';
      if (promoted && list) list.insertBefore(promoted, list.firstChild);
      if (promoted) {
        promoted.style.borderColor = 'var(--brand)';
        var badge = one('[data-rank-badge]', promoted);
        if (badge) { badge.textContent = '1'; badge.style.background = 'var(--brand)'; badge.style.color = 'var(--on-brand)'; }
        var flag = one('[data-outside-flag]', promoted);
        if (flag) flag.style.display = 'inline-block';
      }
      if (weekend) weekend.style.display = 'none';
      if (diff) {
        diff.style.display = 'flex';
        one('#rank-diff-text').textContent = 'Killington moved to #1 · 5 hr 12 min, outside your 2 hr 30 min limit. Elk Mountain is now #2.';
      }
      if (leader) leader.style.opacity = '.55';
      if (leaderNote) leaderNote.style.display = 'block';
      toast('Re-ranked without the drive limit');
    } else {
      css(chip, CHIP_ON);
      if (label) label.textContent = 'Under 2 hr 30 min';
      if (promoted && weekend) {
        weekend.appendChild(promoted);
        weekend.style.display = 'block';
        promoted.style.borderColor = 'var(--line)';
        var b2 = one('[data-rank-badge]', promoted);
        if (b2) { b2.textContent = '—'; b2.style.background = 'var(--seg-bg)'; b2.style.color = 'var(--text-faint)'; }
        var f2 = one('[data-outside-flag]', promoted);
        if (f2) f2.style.display = 'inline-block';
      }
      if (diff) diff.style.display = 'none';
      if (leader) leader.style.opacity = '1';
      if (leaderNote) leaderNote.style.display = 'none';
      toast('Drive limit restored');
    }
    renumber();
  }

  function renumber() {
    var list = one('#alt-list');
    if (!list) return;
    var n = one('#alt-killington') && one('#alt-killington').parentNode === list ? 2 : 2;
    all(':scope > [data-alt]', list).forEach(function (card) {
      if (card.id === 'alt-killington') return;
      var badge = one('[data-rank-badge]', card);
      if (badge) badge.textContent = String(n);
      n++;
    });
  }

  /* ------------------------------------------------------- resort detail    */

  var ELEV = {
    base: { temp: '21°F', feels: '13°F', snow: '5.2 in', surface: 'Soft packed', wind: '11 mph', gust: '19 mph', fl: 'Below base', ft: '1,693 ft' },
    mid: { temp: '18°F', feels: '9°F', snow: '5.6 in', surface: 'Packed powder', wind: '16 mph', gust: '24 mph', fl: 'Below mid', ft: '2,192 ft' },
    peak: { temp: '14°F', feels: '2°F', snow: '6.1 in', surface: 'Wind-affected powder', wind: '22 mph', gust: '29 mph', fl: 'Below summit', ft: '2,693 ft' }
  };

  function setElevation(which) {
    var d = ELEV[which];
    if (!d) return;
    for (var key in d) {
      var node = one('[data-elev="' + key + '"]');
      if (node) node.textContent = d[key];
    }
  }

  /* ------------------------------------------------------------- appearance */

  function setTheme(mode) {
    var root = document.documentElement;
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    try { window.localStorage.setItem('skitheeast-v2-appearance', mode); } catch (e) { /* ignore */ }
  }

  function restoreTheme() {
    var mode = 'auto';
    try { mode = window.localStorage.getItem('skitheeast-v2-appearance') || 'auto'; } catch (e) { /* ignore */ }
    setTheme(mode);
    var group = one('[data-seg="appearance"]');
    if (!group) return;
    all('[data-seg-opt]', group).forEach(function (o) {
      var on = o.getAttribute('data-seg-opt') === mode;
      css(o, on ? SEG_ON : SEG_OFF);
      o.setAttribute('aria-selected', String(on));
    });
  }

  /* ------------------------------------------------------------- save state */

  function wireSave() {
    all('[data-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        var text = one('[data-save-text]', btn) || btn;
        text.textContent = on ? 'Saved' : 'Save';
        css(btn, on
          ? { background: 'var(--brand-soft)', color: 'var(--brand-strong)', borderColor: 'var(--brand)' }
          : { background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--line)' });
        toast(on ? 'Added to your mountains' : 'Removed from your mountains');
      });
    });
  }

  /* ------------------------------------------------------------ radar layer */

  function wireRadar() {
    var btn = one('#radar-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      css(btn, on ? CHIP_ON : CHIP_OFF);
      var layer = one('#radar-layer');
      if (layer) layer.style.display = on ? 'block' : 'none';
      var controls = one('#radar-controls');
      if (controls) controls.style.display = on ? 'flex' : 'none';
      var note = one('#radar-note');
      if (note) note.style.display = on ? 'block' : 'none';
    });
  }

  /* ---------------------------------------------------------- compare picks */

  function wireCompare() {
    // Columns are cells of one table, so hiding a column is hiding its cells;
    // the remaining rows keep their alignment because the table owns row height.
    all('[data-cmp-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cells = all('[data-cmp-cell="' + btn.getAttribute('data-cmp-remove') + '"]');
        if (cells.length < 2) return;
        cells.forEach(function (cell) { cell.style.display = 'none'; });
        var restore = one('#cmp-restore');
        if (restore) restore.style.display = 'inline-flex';
        toast('Removed from compare');
      });
    });

    var restore = one('#cmp-restore');
    if (restore) {
      restore.addEventListener('click', function () {
        all('[data-cmp-cell]').forEach(function (cell) {
          cell.style.display = cell.tagName === 'TH' ? 'table-cell' : 'table-cell';
        });
        restore.style.display = 'none';
        toast('All three mountains restored');
      });
    }
  }

  /* -------------------------------------------------------------- init      */

  function init() {
    if (document.documentElement.getAttribute('data-skiproto') === 'on') return;
    document.documentElement.setAttribute('data-skiproto', 'on');

    all('[data-go]').forEach(function (btn) {
      btn.addEventListener('click', function () { showScreen(btn.getAttribute('data-go')); });
    });
    all('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-tab');
        showScreen(t === 'explore' ? 'explore-map' : t);
      });
    });
    all('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var explicit = btn.getAttribute('data-back');
        showScreen(explicit && explicit !== 'auto' ? explicit : previous);
      });
    });
    all('[data-jump]').forEach(function (btn) {
      btn.addEventListener('click', function () { showScreen(btn.getAttribute('data-jump')); });
    });

    wireSegments();
    wireChips();
    wireSwitches();
    wireDisclosures();
    wireRadio();
    wireConstraints();
    wireSave();
    wireRadar();
    wireCompare();
    restoreTheme();
    showScreen('today');
  }

  window.SkiProto = { init: init, showScreen: showScreen, toast: toast };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (!document.querySelector('x-dc')) init();
    });
  } else if (!document.querySelector('x-dc')) {
    init();
  }
})();
