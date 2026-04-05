# Professional Java Development: SE Tools & AI-Assisted Engineering

University lecture slides — 11 modules, 221 slides.

## Quick Start

```bash
# Build slides from JSON modules
node js/build-html.js

# Serve locally (pick one)
npx serve .                    # Node.js
python -m http.server 8000     # Python
```

Open `http://localhost:8000` (or just open `index.html` directly in a browser).

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
  index.html              ← generated (do not edit)
  css/
    style.css             ← presentation styles
  js/
    build-html.js         ← assembler: json/ + css/ + images/ → index.html
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
    bg2.b64 ... bg7.b64  ← background images (base64)
```

## Editing Content

Edit the `json/module_*.json` files directly. Each file is a JSON array of slide objects.

Slide types:
- **cover** — module title slide with badges and contents sidebar
- **content** — teaching slide with body elements (cards, code, tables, quotes)

After editing, rebuild:

```bash
node js/build-html.js
```

TOC slide counts and cover navigation links are computed automatically at build time.

## Dependencies

- Node.js (for building)
- A browser (for viewing)
