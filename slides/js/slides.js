/* ══════════════════════════════════════
   Runtime slide renderer — loads JSON, builds DOM
   ══════════════════════════════════════ */

(async function () {
  'use strict';

  // ── Background image map ───────────────────────────
  const bgImageMap = {
    2: 'slide_bg_001.jpg', 3: 'slide_bg_002.jpg', 4: 'slide_bg_006.jpg',
    5: 'slide_bg_003.jpg', 6: 'slide_bg_004.jpg', 7: 'slide_bg_005.jpg'
  };

  // ── Load JSON ──────────────────────────────────────
  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) return null;
    return r.json();
  }

  const config = await fetchJSON('json/slides-config.json');
  const data = {
    title: config.title,
    defaultSws: config.defaultSws,
    modules: config.modules,
    bg_rotation: config.bg_rotation,
    toc: config.toc,
    tocGroups: config.tocGroups,
    slides: [config.cover]
  };

  const moduleKeys = Object.keys(data.modules).map(Number);
  for (const m of moduleKeys) {
    const modSlides = await fetchJSON(`json/module_${m}.json`);
    if (modSlides) data.slides.push(...modSlides);
  }

  document.title = data.title;

  // ── Module colors ──────────────────────────────────
  const modColors = {};
  const labelToMod = {};
  for (const [k, v] of Object.entries(data.modules)) {
    modColors[k] = v.color;
    labelToMod[v.label] = k;
  }

  // ── TOC & cover contents ───────────────────────────
  function updateTocAndCovers() {
    data.toc.forEach(entry => {
      const ci = data.slides.findIndex(s => s.type === 'cover' && s.h1 === data.modules[entry.mod].label);
      if (ci >= 0) entry.slide = ci;
    });

    const modCounts = {};
    data.slides.forEach(s => { if (s.mod) modCounts[s.mod] = (modCounts[s.mod] || 0) + 1; });

    for (let m = 0; m <= 20; m++) {
      const mod = String(m);
      if (!data.modules[mod]) continue;
      const coverIdx = data.slides.findIndex(s => s.type === 'cover' && s.h1 === data.modules[mod].label);
      if (coverIdx < 0) continue;
      const modSlides = [];
      for (let i = 0; i < data.slides.length; i++) {
        if (data.slides[i].mod === mod && data.slides[i].type === 'content') {
          modSlides.push({ title: data.slides[i].title, index: i, tag: data.slides[i].tag });
        }
      }
      const mc = modColors[mod] || '#737373';
      const tagLabels = { exercise: 'EXERCISE', takeaway: 'TAKEAWAY', demo: 'DEMO', industry: 'INDUSTRY', mistake: 'MISTAKE', important: 'IMPORTANT' };
      data.slides[coverIdx].contents = modSlides.map(s => {
        const label = tagLabels[s.tag];
        const badge = label ? ` <span class="type-badge type-${s.tag}" style="font-size:10px;padding:2px 8px;margin-left:6px">${label}</span>` : '';
        return `<span onclick="event.stopPropagation();go(${s.index})" style="cursor:pointer;display:block;padding:2px 8px;font-size:15px;border-radius:4px" onmouseover="this.style.background='var(--accent)'" onmouseout="this.style.background='transparent'"><span style="color:${mc};margin-right:6px">&#x2022;</span>${s.title}${badge}</span>`;
      }).join('\n');
    }
  }
  updateTocAndCovers();

  // ── Background helpers ─────────────────────────────
  function getBgStyle(bgNum) {
    if (!bgNum || !bgImageMap[bgNum]) return '';
    return ` style="background-image:url('images/bg/${bgImageMap[bgNum]}')"`;
  }

  function bgForSlide(idx) {
    const rot = data.bg_rotation;
    return rot[idx % rot.length];
  }

  // ── Render helpers ─────────────────────────────────
  function renderModBadge(mod) {
    if (!mod) return '';
    const c = modColors[mod] || '#737373';
    const label = (data.modules[mod] && data.modules[mod].label) || `Module ${mod}`;
    return `<span class="module-badge" style="background:${c}20;color:${c}">${label}</span>`;
  }

  function renderSwsBadge(slide) {
    if (!slide) return '';
    const modSws = data.modules[slide.mod] && data.modules[slide.mod].sws;
    const sws = slide.sws !== undefined ? slide.sws
              : modSws !== undefined ? modSws
              : data.defaultSws;
    if (!sws) return '';
    return `<span class="type-badge sws-badge">${sws} SWS</span>`;
  }

  function renderTypeBadge(tag) {
    if (!tag) return '';
    const map = {
      exercise: ['EXERCISE', 'type-exercise'],
      demo: ['DEMO', 'type-demo'],
      industry: ['INDUSTRY', 'type-industry'],
      mistake: ['COMMON MISTAKE', 'type-mistake'],
      takeaway: ['KEY TAKEAWAYS', 'type-takeaway'],
      important: ['IMPORTANT', 'type-important']
    };
    const m = map[tag];
    if (!m) return '';
    return `<span class="type-badge ${m[1]}">${m[0]}</span>`;
  }

  function renderCard(item) {
    const warnClass = item.warn ? ' warn' : '';
    let html = `<div class="card${warnClass}">`;
    if (item.card) {
      html += `<div class="card-header"><div class="card-title">${item.card}</div></div>`;
    }
    if (item.items && item.items.length > 0) {
      html += `<div class="card-content"><ul>`;
      for (const li of item.items) html += `<li>${li}</li>`;
      html += `</ul></div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderCode(item) {
    let html = `<div class="card"><div class="card-code"><pre>${item.code}</pre></div>`;
    if (item.note) {
      html += `<div class="card-content" style="padding-top:4px"><p style="font-size:15px;color:var(--muted-foreground)">${item.note}</p></div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderTable(item) {
    const t = item.table;
    let html = `<div class="card"><div class="card-table"><table>`;
    if (t.widths) {
      html += `<colgroup>${t.widths.map(w => `<col style="width:${w}">`).join('')}</colgroup>`;
    }
    html += `<thead><tr>`;
    for (const h of t.headers) html += `<th>${h}</th>`;
    html += `</tr></thead><tbody>`;
    for (const row of t.rows) {
      html += `<tr>`;
      for (const cell of row) html += `<td>${cell}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;
    if (t.note) {
      html += `<div class="card-content" style="padding-top:4px"><p style="font-size:15px;color:var(--muted-foreground)">${t.note}</p></div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderQuote(item) {
    let html = `<div class="card card-quote-card"><div class="card-content"><p class="quote">${item.quote}</p>`;
    if (item.src) html += `<p class="quote-src">&mdash; ${item.src}</p>`;
    html += `</div></div>`;
    return html;
  }

  function renderResource(item) {
    let html = `<div class="card card-resource"><div class="card-content">`;
    if (item.resource.title) {
      html += `<p style="font-weight:600;font-size:17px;margin-bottom:6px">${item.resource.title}</p>`;
    }
    if (item.resource.links) {
      for (const link of item.resource.links) {
        html += `<a class="resource-link" href="${link.url}" target="_blank">${link.label}</a> `;
      }
    }
    html += `</div></div>`;
    return html;
  }

  function renderToc() {
    const swsCount = data.slides.filter(s => s.type === 'content' && renderSwsBadge(s)).length;
    const totalCount = data.slides.length;
    // Toolbar grid mirrors the All Slides row grid so the 2 SWS button
    // sits exactly above the 2 SWS badge column in the rows below.
    let html = `<div style="display:grid;grid-template-columns:80px 1fr 64px 70px;gap:0 12px;padding:0 54px 8px 24px;align-items:center">`;
    html += `<div style="grid-column:1 / 3;display:flex;gap:8px">`;
    html += `<button class="btn" id="toc-btn-modules" onclick="tocToggle('modules')" style="font-size:13px;height:30px;padding:4px 14px">Modules</button>`;
    html += `<button class="btn-ghost" id="toc-btn-slides" onclick="tocToggle('slides')" style="font-size:13px;height:30px;padding:4px 14px;border:1px solid var(--border)">All Slides</button>`;
    html += `</div>`;
    html += `<div id="toc-slides-actions" style="display:none;text-align:center">`;
    html += `<button class="btn-ghost" id="toc-btn-sws" onclick="tocSwsFilter()" style="font-size:13px;height:30px;padding:4px 10px;border:1px solid var(--border);white-space:nowrap">2 SWS</button>`;
    html += `</div>`;
    html += `<div id="toc-sws-count" data-total="${totalCount}" data-filtered="${swsCount}" style="display:none;text-align:right;font-variant-numeric:tabular-nums;color:var(--muted-foreground);font-size:13px">${totalCount}</div>`;
    html += `</div>`;

    // Module overview with groups as separate cards
    html += `<div id="toc-modules">`;
    const tocByMod = {};
    for (const entry of data.toc) tocByMod[entry.mod] = entry;
    const groups = data.tocGroups || [{ label: null, mods: data.toc.map(e => e.mod) }];
    for (const group of groups) {
      html += `<div class="card card-toc" style="margin-bottom:8px">`;
      if (group.label) {
        html += `<div style="padding:10px 24px 14px;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted-foreground)">${group.label}</div>`;
      }
      for (const mod of group.mods) {
        const entry = tocByMod[mod];
        if (!entry) continue;
        const c = modColors[entry.mod] || '#737373';
        html += `<div class="toc-row" onclick="go(${entry.slide})" style="cursor:pointer">`;
        html += `<span class="toc-dot" style="background:${c}"></span>`;
        html += `<span class="toc-label" style="color:${c}">${data.modules[entry.mod].label}</span>`;
        html += `<span class="toc-title">${entry.title}</span>`;
        html += `<span class="toc-topics">${entry.topics}</span>`;
        html += `</div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;

    // All slides view: one card per module (cover + its content), standalone slides (main cover, TOC) get their own card
    const gridStyle = `display:grid;grid-template-columns:80px 1fr 64px 70px;align-items:center;gap:0 12px;padding:10px 24px;cursor:pointer;font-size:15px`;
    const allSlidesTagLabels = { exercise: 'EXERCISE', takeaway: 'TAKEAWAY', demo: 'DEMO', industry: 'INDUSTRY', mistake: 'MISTAKE', important: 'IMPORTANT' };
    const swsCell = (s) => {
      const badge = s.type === 'content' ? renderSwsBadge(s) : '';
      return badge ? `<span style="text-align:center">${badge}</span>` : `<span></span>`;
    };
    html += `<div id="toc-slides" style="display:none;max-height:70vh;overflow-y:auto;padding-right:10px">`;

    let cardOpen = false;
    const openCard = () => {
      if (cardOpen) html += `</div>`;
      html += `<div class="card card-toc" style="margin-bottom:8px">`;
      cardOpen = true;
    };

    for (let i = 0; i < data.slides.length; i++) {
      const s = data.slides[i];
      const mod = s.mod || null;

      // Main cover (i===0) → own card
      if (s.type === 'cover' && i === 0) {
        openCard();
        html += `<div class="toc-slide-row" data-sws="title" style="${gridStyle};font-weight:600;padding-top:10px;padding-bottom:10px" onclick="go(0)">`;
        html += `<span></span>`;
        html += `<span style="color:var(--foreground);font-size:16px;letter-spacing:-0.01em;padding-left:16px">${s.h1} ${s.lead || ''}</span>`;
        html += swsCell(s);
        html += `<span style="text-align:right;font-variant-numeric:tabular-nums;color:var(--muted-foreground);font-size:13px">Slide 1</span>`;
        html += `</div>`;
        continue;
      }

      // Module cover → new card
      if (s.type === 'cover' && s.h1 && labelToMod[s.h1] !== undefined) {
        openCard();
        const modNum = labelToMod[s.h1];
        const c = modColors[modNum] || '#737373';
        html += `<div class="toc-slide-row" data-sws="no" style="${gridStyle};background:${c}10;border-left:3px solid ${c};font-weight:600;padding-top:14px;padding-bottom:14px" onclick="go(${i})">`;
        html += `<span style="color:${c};font-size:13px;font-weight:700;letter-spacing:0.02em;text-align:right">${s.h1}</span>`;
        html += `<span style="color:var(--foreground);padding-left:16px">${s.lead || ''}</span>`;
        html += swsCell(s);
        html += `<span style="text-align:right;font-variant-numeric:tabular-nums;color:var(--muted-foreground);font-size:13px">Slide ${i + 1}</span>`;
        html += `</div>`;
        continue;
      }

      if (s.type === 'content' && s.title) {
        // Standalone content (no mod, e.g. TOC) → own card
        if (!mod) openCard();
        else if (!cardOpen) openCard();
        const c = mod ? (modColors[mod] || '#737373') : '#737373';
        const tlabel = allSlidesTagLabels[s.tag];
        const tag = tlabel ? ` <span class="type-badge type-${s.tag}" style="font-size:10px;padding:2px 8px;margin-left:6px">${tlabel}</span>` : '';
        const swsAttr = s.body === 'toc' ? 'title' : (renderSwsBadge(s) ? 'yes' : 'no');
        html += `<div class="toc-slide-row" data-sws="${swsAttr}" style="${gridStyle}" onclick="go(${i})" onmouseover="this.style.background='var(--accent)'" onmouseout="this.style.background='transparent'">`;
        html += `<span style="color:${c};font-size:11px;font-weight:600;text-align:right">${mod && data.modules[mod] ? data.modules[mod].label : ''}</span>`;
        html += `<span style="font-weight:400;padding-left:16px">${s.title}${tag}</span>`;
        html += swsCell(s);
        html += `<span style="text-align:right;font-variant-numeric:tabular-nums;color:var(--muted-foreground);font-size:13px">Slide ${i + 1}</span>`;
        html += `</div>`;
      }
    }
    if (cardOpen) html += `</div>`;
    html += `</div>`;
    return html;
  }

  function renderImage(item) {
    let html = `<div class="card"><div class="card-content" style="padding:12px">`;
    // height > 0: force that pixel height (width auto-scales, upscaling small sources)
    // height === 0: no cap (natural size)
    // no height: default 400px max-height cap
    let sizeStyle;
    if (item.height && item.height > 0) {
      sizeStyle = `height:${item.height}px;width:auto;max-width:100%`;
    } else if (item.height === 0) {
      sizeStyle = item.fill ? 'width:100%;height:auto' : 'width:auto;height:auto;max-width:100%';
    } else {
      const widthStyle = item.fill ? 'width:100%' : 'width:auto;max-width:100%';
      sizeStyle = `height:auto;${widthStyle};max-height:400px`;
    }
    html += `<img src="images/content/${item.img}" alt="${item.alt || ''}" style="display:block;${sizeStyle}">`;
    if (item.caption) {
      html += `<p style="font-size:14px;color:var(--muted-foreground);margin-top:8px">${item.caption}</p>`;
    }
    html += `</div></div>`;
    return html;
  }

  function renderBodyElement(item) {
    if (typeof item === 'string') return '';
    if (item.card !== undefined || item.items) return renderCard(item);
    if (item.code) return renderCode(item);
    if (item.table) return renderTable(item);
    if (item.quote) return renderQuote(item);
    if (item.resource) return renderResource(item);
    if (item.img) return renderImage(item);
    return '';
  }

  function renderSlide(slide, idx) {
    const bgNum = bgForSlide(idx);
    const bgStyle = getBgStyle(bgNum);

    if (slide.type === 'cover') {
      const activeClass = idx === 0 ? ' active' : '';
      const coverBgStyle = slide.bg ? getBgStyle(slide.bg) : bgStyle;
      let html = `<div class="slide${activeClass} slide-cover"${coverBgStyle}>`;
      html += `<div class="cover-card">`;
      html += `<h1>${slide.h1}</h1>`;
      if (slide.lead) html += `<p class="lead">${slide.lead}</p>`;
      if (slide.sub) html += `<p class="sub">${slide.sub}</p>`;
      if (slide.badges) {
        html += `<div class="badges">`;
        for (const b of slide.badges) {
          if (b.startsWith('DRAFT')) {
            html += `<span class="badge-draft">${b}</span>`;
          } else if (b.startsWith('*')) {
            html += `<span class="badge">${b.slice(1)}</span>`;
          } else {
            html += `<span class="badge-outline">${b}</span>`;
          }
        }
        html += `</div>`;
      }
      html += `</div>`;
      if (slide.contents) {
        html += `<div class="cover-contents">${slide.contents}</div>`;
      }
      html += `</div>`;
      return html;
    }

    // Content slide
    const layout = slide.layout || 'left';
    const activeClass = idx === 0 ? ' active' : '';
    let html = `<div class="slide${activeClass} slide-content layout-${layout}"${bgStyle}>`;

    if (slide.tag === 'exercise') {
      html += `<div class="slide-overlay"></div>`;
    }

    html += `<div class="slide-header"><div class="header-row"><div>`;
    html += `<h2 class="slide-title">${slide.title}</h2>`;
    if (slide.desc) html += `<p class="slide-desc">${slide.desc}</p>`;
    html += `</div><div class="header-badges">`;
    html += renderModBadge(slide.mod);
    html += renderTypeBadge(slide.tag);
    html += renderSwsBadge(slide);
    html += `</div></div></div>`;

    html += `<div class="cols">`;
    if (slide.body === 'toc') {
      html += renderToc();
    } else if (Array.isArray(slide.body)) {
      for (const item of slide.body) html += renderBodyElement(item);
    }
    html += `</div></div>`;
    return html;
  }

  // ── Render all slides ──────────────────────────────
  const container = document.getElementById('slides-container');
  let allHtml = '';
  for (let i = 0; i < data.slides.length; i++) {
    allHtml += renderSlide(data.slides[i], i);
  }
  container.innerHTML = allHtml;

  // ── Per-slide scripts (bug, butterfly, etc.) ────────
  const scriptMap = {};
  data.slides.forEach((s, i) => { if (s.script) scriptMap[i] = s.script; });
  let activeScript = null;   // { name, instance }

  const scriptInits = { bug: window.initBug, butterfly: window.initButterfly };
  let activeScripts = [];
  let crittersEnabled = true;

  function activateScript(idx) {
    activeScripts.forEach(s => s.instance.destroy());
    activeScripts = [];
    if (!crittersEnabled) return;
    const scripts = scriptMap[idx];
    if (!scripts) return;
    const list = Array.isArray(scripts) ? scripts : [scripts];
    for (const entry of list) {
      const name = typeof entry === 'string' ? entry : entry.name;
      const opts = typeof entry === 'string' ? {} : (entry.opts || {});
      const initFn = scriptInits[name];
      if (initFn) activeScripts.push({ name, instance: initFn(opts) });
    }
  }

  window.toggleCritters = function (on) {
    crittersEnabled = on;
    if (!on) {
      activeScripts.forEach(s => s.instance.destroy());
      activeScripts = [];
    } else {
      activateScript(c);
    }
  };

  // ── Navigation ─────────────────────────────────────
  const S = document.querySelectorAll('.slide');
  const N = S.length;
  let c = 0;

  function ui() {
    document.getElementById('counter').textContent = (c + 1) + ' / ' + N;
    document.getElementById('bp').disabled = (c === 0);
    document.getElementById('bn').disabled = (c === N - 1);
    document.getElementById('progress').style.width = ((c + 1) / N * 100) + '%';
  }

  window.go = function (n) {
    if (n < 0 || n >= N) return;
    S[c].classList.remove('active');
    c = n;
    S[c].classList.add('active');
    ui();
    activateScript(c);
  };
  window.next = function () { go(c + 1); };
  window.prev = function () { go(c - 1); };
  window.fs = function () {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  window.jumpPrompt = function () {
    var n = prompt('Jump to slide (1-' + N + '):');
    if (n) { var v = parseInt(n); if (v >= 1 && v <= N) go(v - 1); }
  };
  window.tocToggle = function (view) {
    var m = document.getElementById('toc-modules'), s = document.getElementById('toc-slides'),
        bm = document.getElementById('toc-btn-modules'), bs = document.getElementById('toc-btn-slides'),
        actions = document.getElementById('toc-slides-actions'),
        count = document.getElementById('toc-sws-count');
    if (!m || !s) return;
    if (view === 'slides') {
      m.style.display = 'none'; s.style.display = '';
      if (actions) actions.style.display = '';
      if (count) count.style.display = '';
      bm.className = 'btn-ghost'; bm.style.border = '1px solid var(--border)';
      bs.className = 'btn'; bs.style.border = 'none';
    } else {
      m.style.display = ''; s.style.display = 'none';
      if (actions) actions.style.display = 'none';
      if (count) count.style.display = 'none';
      bm.className = 'btn'; bm.style.border = 'none';
      bs.className = 'btn-ghost'; bs.style.border = '1px solid var(--border)';
    }
  };
  window.tocSwsFilter = function () {
    var s = document.getElementById('toc-slides'), b = document.getElementById('toc-btn-sws'),
        count = document.getElementById('toc-sws-count');
    if (!s || !b) return;
    tocToggle('slides');
    var active = !s.classList.contains('sws-filtered');
    s.classList.toggle('sws-filtered', active);
    b.className = active ? 'btn' : 'btn-ghost';
    b.style.border = active ? 'none' : '1px solid var(--border)';
    if (count) count.textContent = active ? count.dataset.filtered : count.dataset.total;
  };

  document.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown') { e.preventDefault(); next(); }
    if (k === 'ArrowLeft' || k === 'Backspace' || k === 'PageUp') { e.preventDefault(); prev(); }
    if (k === 'Home') { e.preventDefault(); go(0); }
    if (k === 'End') { e.preventDefault(); go(N - 1); }
    if ((k === 'f' || k === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) fs();
  });

  let ht;
  function rh() {
    document.getElementById('nav').classList.remove('hidden');
    clearTimeout(ht);
    ht = setTimeout(() => {
      if (document.fullscreenElement) document.getElementById('nav').classList.add('hidden');
    }, 3000);
  }
  document.addEventListener('mousemove', rh);
  document.addEventListener('click', rh);

  ui();
  activateScript(0);
})();
