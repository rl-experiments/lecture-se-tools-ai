# Professional Java Development: SE Tools & AI-Assisted Engineering

University lecture slides — 11 modules, 221 slides.

## Quick Start

```bash
# Serve locally (pick one)
cd slides
npx live-server --port=3000    # Auto-reloads browser on file changes
npx serve                      # Node.js (manual refresh)
python -m http.server 8000     # Python (manual refresh)
```

Open `http://localhost:8000`. Slides load JSON at runtime — no build step needed.

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
```

## Editing Content

Edit the `json/module_*.json` files directly. Each file is a JSON array of slide objects.

Slide types:
- **cover** — module title slide with badges and contents sidebar
- **content** — teaching slide with body elements (cards, code, tables, quotes)

TOC slide counts and cover navigation links are computed automatically at runtime.

## Dependencies

- A browser and a local HTTP server (for `fetch` to work)
