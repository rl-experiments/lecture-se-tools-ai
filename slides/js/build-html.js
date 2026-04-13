const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jsonDir = path.join(root, 'json');

// Assemble from module files
const config = JSON.parse(fs.readFileSync(path.join(jsonDir, 'slides-config.json'), 'utf8'));
const data = {
  title: config.title,
  modules: config.modules,
  bg_rotation: config.bg_rotation,
  toc: config.toc,
  slides: [config.cover] // title cover is first
};

// Load all module files in order
for (let m = 0; m <= 20; m++) {
  const modFile = path.join(jsonDir, `module_${m}.json`);
  if (fs.existsSync(modFile)) {
    const modSlides = JSON.parse(fs.readFileSync(modFile, 'utf8'));
    data.slides.push(...modSlides);
  }
}
console.log(`Assembled ${data.slides.length} slides from module files`);

// Update TOC slide positions and cover contents
function updateTocAndCovers() {
  // Update TOC positions
  data.toc.forEach(entry => {
    if (entry.mod === '0') {
      entry.slide = 2;
    } else {
      const ci = data.slides.findIndex(s => s.type === 'cover' && s.h1 === `Module ${entry.mod}`);
      if (ci >= 0) entry.slide = ci;
    }
  });

  // Update cover contents for all modules
  for (let m = 0; m <= 20; m++) {
    const mod = String(m);
    const coverIdx = data.slides.findIndex(s => s.type === 'cover' && s.h1 === `Module ${mod}`);
    if (coverIdx < 0) continue;
    const modSlides = [];
    for (let i = 0; i < data.slides.length; i++) {
      if (data.slides[i].mod === mod && data.slides[i].type === 'content') {
        modSlides.push({ title: data.slides[i].title, index: i });
      }
    }
    const mc = modColors[mod] || '#737373';
    data.slides[coverIdx].contents = modSlides.map(s =>
      `<span onclick="event.stopPropagation();go(${s.index})" style="cursor:pointer;display:block;padding:2px 8px;font-size:15px;border-radius:4px" onmouseover="this.style.background='var(--accent)'" onmouseout="this.style.background='transparent'"><span style="color:${mc};margin-right:6px">&#x2022;</span>${s.title}</span>`
    ).join('\n');
  }
}
updateTocAndCovers();

// Map bg rotation numbers to extracted image files
const bgImageMap = { 2: 'slide_bg_001.jpg', 3: 'slide_bg_002.jpg', 4: 'slide_bg_006.jpg', 5: 'slide_bg_003.jpg', 6: 'slide_bg_004.jpg', 7: 'slide_bg_005.jpg' };

function getBgStyle(bgNum) {
  if (!bgNum || !bgImageMap[bgNum]) return '';
  return ` style="background-image:url('images/${bgImageMap[bgNum]}')"`;
}

// Which bg to use for a given slide index
function bgForSlide(idx) {
  const rot = data.bg_rotation;
  return rot[idx % rot.length];
}

// Build module color lookup
const modColors = {};
for (const [k, v] of Object.entries(data.modules)) {
  modColors[k] = v.color;
}

function renderModBadge(mod) {
  if (!mod) return '';
  const c = modColors[mod] || '#737373';
  return `<span class="module-badge" style="background:${c}20;color:${c}">Module ${mod}</span>`;
}

function renderTypeBadge(tag) {
  if (!tag) return '';
  const map = {
    exercise: ['EXERCISE', 'type-exercise'],
    demo: ['DEMO', 'type-demo'],
    industry: ['INDUSTRY', 'type-industry'],
    mistake: ['COMMON MISTAKE', 'type-mistake'],
    takeaway: ['KEY TAKEAWAYS', 'type-takeaway']
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
    for (const li of item.items) {
      html += `<li>${li}</li>`;
    }
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
  let html = `<div class="card"><div class="card-table"><table><thead><tr>`;
  for (const h of t.headers) {
    html += `<th>${h}</th>`;
  }
  html += `</tr></thead><tbody>`;
  for (const row of t.rows) {
    html += `<tr>`;
    for (let i = 0; i < row.length; i++) {
      if (i === 0) {
        html += `<td>${row[i]}</td>`;
      } else {
        html += `<td>${row[i]}</td>`;
      }
    }
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
  if (item.src) {
    html += `<p class="quote-src">&mdash; ${item.src}</p>`;
  }
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

function renderToc(slideData) {
  // Toggle buttons
  let html = `<div style="display:flex;gap:8px;margin-bottom:8px">`;
  html += `<button class="btn" id="toc-btn-modules" onclick="tocToggle('modules')" style="font-size:13px;height:30px;padding:4px 14px">Modules</button>`;
  html += `<button class="btn-ghost" id="toc-btn-slides" onclick="tocToggle('slides')" style="font-size:13px;height:30px;padding:4px 14px;border:1px solid var(--border)">All Slides</button>`;
  html += `</div>`;

  // View 1: Module overview (default)
  html += `<div class="card card-toc" id="toc-modules">`;
  for (const entry of slideData.toc) {
    const c = modColors[entry.mod] || '#737373';
    html += `<div class="toc-row" onclick="go(${entry.slide})" style="cursor:pointer">`;
    html += `<span class="toc-dot" style="background:${c}"></span>`;
    html += `<span class="toc-label" style="color:${c}">${data.modules[entry.mod].label}</span>`;
    html += `<span class="toc-title">${entry.title}</span>`;
    html += `<span class="toc-topics">${entry.topics}</span>`;
    html += `</div>`;
  }
  html += `</div>`;

  // View 2: All slides grouped by module (hidden by default)
  // Uses CSS grid for strict 3-column alignment: [label 80px] [title flex] [slide# 70px]
  const gridStyle = `display:grid;grid-template-columns:80px 1fr 70px;align-items:center;gap:0 12px;padding:6px 24px;border-bottom:1px solid var(--border);cursor:pointer;font-size:15px`;
  html += `<div class="card card-toc" id="toc-slides" style="display:none;max-height:70vh;overflow-y:auto">`;
  for (let i = 0; i < data.slides.length; i++) {
    const s = data.slides[i];
    const mod = s.mod || null;

    // Module group header for cover slides
    if (s.type === 'cover' && s.h1 && s.h1.startsWith('Module')) {
      const modNum = s.h1.replace('Module ', '');
      const c = modColors[modNum] || '#737373';
      html += `<div style="${gridStyle};background:${c}10;border-left:3px solid ${c};font-weight:600" onclick="go(${i})">`;
      html += `<span style="color:${c};font-size:13px;font-weight:700;letter-spacing:0.02em;text-align:right">${s.h1}</span>`;
      html += `<span style="color:var(--foreground);padding-left:16px">${s.lead || ''}</span>`;
      html += `<span style="text-align:right;font-variant-numeric:tabular-nums;color:var(--muted-foreground);font-size:13px">Slide ${i + 1}</span>`;
      html += `</div>`;
      continue;
    }

    // First cover slide (title)
    if (s.type === 'cover' && i === 0) {
      html += `<div style="${gridStyle};font-weight:600;padding-top:10px;padding-bottom:10px" onclick="go(0)">`;
      html += `<span></span>`;
      html += `<span style="color:var(--foreground);font-size:16px;letter-spacing:-0.01em;padding-left:16px">${s.h1} ${s.lead || ''}</span>`;
      html += `<span style="text-align:right;font-variant-numeric:tabular-nums;color:var(--muted-foreground);font-size:13px">Slide 1</span>`;
      html += `</div>`;
      continue;
    }

    // Content slides
    if (s.type === 'content' && s.title) {
      const c = mod ? (modColors[mod] || '#737373') : '#737373';
      const tag = s.tag ? ` <span style="color:var(--muted-foreground);font-size:11px">[${s.tag.toUpperCase()}]</span>` : '';
      html += `<div style="${gridStyle}" onclick="go(${i})" onmouseover="this.style.background='var(--accent)'" onmouseout="this.style.background='transparent'">`;
      html += `<span style="color:${c};font-size:11px;font-weight:600;text-align:right">${mod ? 'M' + mod : ''}</span>`;
      html += `<span style="font-weight:400;padding-left:16px">${s.title}${tag}</span>`;
      html += `<span style="text-align:right;font-variant-numeric:tabular-nums;color:var(--muted-foreground);font-size:13px">Slide ${i + 1}</span>`;
      html += `</div>`;
    }
  }
  html += `</div>`;

  return html;
}

function renderImage(item) {
  let html = `<div class="card" style="text-align:center;padding:12px">`;
  html += `<img src="images/${item.img}" alt="${item.alt || ''}" style="max-height:420px;border-radius:6px">`;
  if (item.caption) {
    html += `<p style="font-size:14px;color:var(--muted-foreground);margin-top:8px">${item.caption}</p>`;
  }
  html += `</div>`;
  return html;
}

function renderBodyElement(item) {
  if (typeof item === 'string') return ''; // special like "toc" handled elsewhere
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
    // Cover slide
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
        if (b.startsWith('*')) {
          html += `<span class="badge">${b.slice(1)}</span>`;
        } else {
          html += `<span class="badge-outline">${b}</span>`;
        }
      }
      html += `</div>`;
    }
    html += `</div>`;
    // Contents sidebar
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

  // Exercise overlay
  if (slide.tag === 'exercise') {
    html += `<div class="slide-overlay"></div>`;
  }

  // Header
  html += `<div class="slide-header"><div class="header-row"><div>`;
  html += `<h2 class="slide-title">${slide.title}</h2>`;
  if (slide.desc) html += `<p class="slide-desc">${slide.desc}</p>`;
  html += `</div><div class="header-badges">`;
  html += renderModBadge(slide.mod);
  html += renderTypeBadge(slide.tag);
  html += `</div></div></div>`;

  // Body
  html += `<div class="cols">`;
  if (slide.body === 'toc') {
    html += renderToc(data);
  } else if (Array.isArray(slide.body)) {
    for (const item of slide.body) {
      html += renderBodyElement(item);
    }
  }
  html += `</div>`;

  html += `</div>`;
  return html;
}

// Build full HTML
const N = data.slides.length;
let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.title}</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<div id="progress"></div>
<div class="zone zone-l" onclick="prev()"></div>
<div class="zone zone-r" onclick="next()"></div>

`;

for (let i = 0; i < data.slides.length; i++) {
  html += renderSlide(data.slides[i], i);
}

html += `
<div id="nav">
  <span class="nav-hint">Arrow keys &middot; Space &middot; Click counter to jump</span>
  <button class="btn-ghost" onclick="go(1)" title="Table of Contents">TOC</button>
  <button class="btn" id="bp" onclick="prev()">&larr; Prev</button>
  <span id="counter" onclick="jumpPrompt()" style="cursor:pointer" title="Click to jump to slide">1 / ${N}</span>
  <button class="btn" id="bn" onclick="next()">Next &rarr;</button>
  <span class="nav-fs"><button class="btn-ghost" onclick="fs()">Fullscreen</button></span>
</div>

<script>
const S=document.querySelectorAll(".slide"),N=S.length;let c=0;
function go(n){if(n<0||n>=N)return;S[c].classList.remove("active");c=n;S[c].classList.add("active");ui()}
function next(){go(c+1)}function prev(){go(c-1)}
function ui(){document.getElementById("counter").textContent=(c+1)+" / "+N;document.getElementById("bp").disabled=(c===0);document.getElementById("bn").disabled=(c===N-1);document.getElementById("progress").style.width=((c+1)/N*100)+"%"}
function fs(){if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen()}
document.addEventListener("keydown",e=>{const k=e.key;if(k==="ArrowRight"||k===" "||k==="PageDown"){e.preventDefault();next()}if(k==="ArrowLeft"||k==="Backspace"||k==="PageUp"){e.preventDefault();prev()}if(k==="Home"){e.preventDefault();go(0)}if(k==="End"){e.preventDefault();go(N-1)}if(k==="f"||k==="F")fs()});
let ht;function rh(){document.getElementById("nav").classList.remove("hidden");clearTimeout(ht);ht=setTimeout(()=>{if(document.fullscreenElement)document.getElementById("nav").classList.add("hidden")},3000)}
function jumpPrompt(){var n=prompt("Jump to slide (1-"+N+"):");if(n){var v=parseInt(n);if(v>=1&&v<=N)go(v-1)}}
function tocToggle(view){var m=document.getElementById("toc-modules"),s=document.getElementById("toc-slides"),bm=document.getElementById("toc-btn-modules"),bs=document.getElementById("toc-btn-slides");if(!m||!s)return;if(view==="slides"){m.style.display="none";s.style.display="";bm.className="btn-ghost";bm.style.border="1px solid var(--border)";bs.className="btn";bs.style.border="none"}else{m.style.display="";s.style.display="none";bm.className="btn";bm.style.border="none";bs.className="btn-ghost";bs.style.border="1px solid var(--border)"}}
document.addEventListener("mousemove",rh);document.addEventListener("click",rh);ui();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log(`Generated index.html with ${N} slides (${(html.length / 1024 / 1024).toFixed(1)} MB)`);
