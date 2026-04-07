# Professional Java Development: SE Tools & AI-Assisted Engineering

University lecture slides — 10 modules, 221 slides.

## Quick Start

No build step needed — slides load JSON at runtime.

**Auto-reload** (browser refreshes on every file change):
```bash
cd slides
npx live-server --port=3000
```
Open `http://localhost:3000`

**Manual refresh** (start a static server, refresh browser yourself):
```bash
cd slides
npx serve                      # Node.js
python -m http.server 8000     # Python
```
Open `http://localhost:3000` (serve) or `http://localhost:8000` (Python)

## Navigation

| Key | Action |
|-----|--------|
| `→` / `Space` / `PageDown` | Next slide |
| `←` / `Backspace` / `PageUp` | Previous slide |
| `Home` | First slide |
| `End` | Last slide |
| `F` | Toggle fullscreen |
| Click slide counter | Jump to slide number |

## Project Structure

```
slides/
  index.html              ← lightweight shell (loads JS + CSS)
  css/
    style.css             ← presentation styles
  js/
    slides.js             ← runtime renderer: fetches JSON, builds slides in browser
    build-html.js         ← optional static build (Node.js fallback)
    butterfly.js          ← animated butterfly for cover slides
    bug.js                ← animated bugs for code quality slides
  json/
    slides-config.json    ← metadata (title, modules, TOC, cover)
    module_0.json         ← M0: Introduction (19 slides)
    module_1.json         ← M1: Version Control with Git (25 slides)
    module_2.json         ← M2: Build Management with Maven (19 slides)
    module_3.json         ← M3: Code Quality (29 slides)
    module_4.json         ← M4: Automated Testing (19 slides)
    module_5.json         ← M5: Continuous Integration (21 slides)
    module_6.json         ← M6: Security & Trust (26 slides)
    module_7.json         ← M7: Agent Architecture (28 slides)
    module_8.json         ← M8: Prompt Engineering & Context (12 slides)
    module_9.json         ← M9: Capstone Project (14 slides)
    module_10.json        ← M10: Exam / Presentation (8 slides)
  images/
    slide_bg_001.jpg ...  ← background images (6 JPEGs)
tools/
  export_pdf.py           ← export all slides to landscape PDF
  templates/
    *.potx                ← PowerPoint templates
export/                   ← generated output (gitignored)
```

## Editing Content

Edit the `json/module_*.json` files directly. Each file is a JSON array of slide objects.

Slide types:
- **cover** — module title slide with badges and contents sidebar
- **content** — teaching slide with body elements (cards, code, tables, quotes)

TOC slide counts and cover navigation links are computed automatically at runtime.

## PDF Export

```bash
pip install playwright pypdf
playwright install chromium
python tools/export_pdf.py
```
Output: `export/slides.pdf` (landscape, 221 pages)

## Dependencies

- A browser and a local HTTP server (for `fetch` to work)
- PDF export: Python 3, playwright, pypdf
