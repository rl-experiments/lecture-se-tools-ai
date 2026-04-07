#!/usr/bin/env python3
"""
Export all slides to a single landscape PDF.

Usage:
    pip install playwright pypdf
    playwright install chromium
    python tools/export_pdf.py                    # default output: export/slides.pdf
    python tools/export_pdf.py -o export/my.pdf   # custom output name
    python tools/export_pdf.py --port 8080        # custom server port
"""

import argparse
import http.server
import os
import subprocess
import sys
import threading
import time


def start_server(directory, port):
    """Start a simple HTTP server in a background thread."""
    os.chdir(directory)
    handler = http.server.SimpleHTTPRequestHandler

    # Suppress request logs
    class QuietHandler(handler):
        def log_message(self, format, *args):
            pass

    httpd = http.server.HTTPServer(("127.0.0.1", port), QuietHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def export_pdf(output, port, width, height):
    """Use Playwright to navigate slides and export to PDF."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Error: playwright is not installed.")
        print("  pip install playwright")
        print("  playwright install chromium")
        sys.exit(1)

    url = f"http://127.0.0.1:{port}"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(url, wait_until="networkidle")

        # Wait for slides to render
        page.wait_for_selector(".slide.active", timeout=10000)
        time.sleep(0.5)

        # Get total slide count
        total = page.evaluate("() => document.querySelectorAll('.slide').length")
        print(f"Found {total} slides")

        # Hide nav/progress, kill animations, disable transitions
        page.evaluate("""() => {
            const nav = document.getElementById('nav');
            if (nav) nav.style.display = 'none';
            const progress = document.getElementById('progress');
            if (progress) progress.style.display = 'none';
            if (window.toggleCritters) window.toggleCritters(false);
            document.querySelectorAll('.slide').forEach(s => {
                s.style.transition = 'none';
                s.style.display = 'none';
            });
        }""")

        pdf_pages = []

        for i in range(total):
            # Show only the current slide scaled to fit, hide the rest
            page.evaluate(f"""() => {{
                document.querySelectorAll('.slide').forEach(s => s.style.display = 'none');
                const slides = document.querySelectorAll('.slide');
                const sl = slides[{i}];
                sl.style.display = '';
                sl.classList.add('active');
                sl.style.visibility = 'visible';
                sl.style.opacity = '1';
            }}""")
            time.sleep(0.1)

            pdf_bytes = page.pdf(
                width=f"{width}px",
                height=f"{height}px",
                print_background=True,
                margin={"top": "0px", "right": "0px", "bottom": "0px", "left": "0px"},
                scale=0.75,
            )
            pdf_pages.append(pdf_bytes)

            pct = (i + 1) / total * 100
            print(f"\r  Exporting: {i + 1}/{total} ({pct:.0f}%)", end="", flush=True)

        print()
        browser.close()

    # Merge all single-page PDFs into one
    merge_pdfs(pdf_pages, output)
    print(f"Done: {output} ({total} slides)")


def merge_pdfs(pdf_pages, output):
    """Merge list of single-page PDF bytes into one file."""
    import io

    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        try:
            from PyPDF2 import PdfReader, PdfWriter
        except ImportError:
            print("Error: pypdf is not installed.")
            print("  pip install pypdf")
            sys.exit(1)

    writer = PdfWriter()
    for pdf_bytes in pdf_pages:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for p in reader.pages:
            writer.add_page(p)
    with open(output, "wb") as f:
        writer.write(f)


def main():
    parser = argparse.ArgumentParser(description="Export slides to landscape PDF")
    parser.add_argument("-o", "--output", default="export/slides.pdf", help="Output PDF filename")
    parser.add_argument("--port", type=int, default=9876, help="Local server port")
    parser.add_argument("--width", type=int, default=1280, help="Slide width in pixels")
    parser.add_argument("--height", type=int, default=720, help="Slide height in pixels")
    args = parser.parse_args()

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    slides_dir = os.path.join(project_root, "slides")
    if not os.path.isdir(slides_dir):
        print(f"Error: slides directory not found at {slides_dir}")
        sys.exit(1)

    # Resolve output path relative to project root before chdir
    args.output = os.path.join(project_root, args.output)
    os.makedirs(os.path.dirname(args.output), exist_ok=True)

    print(f"Starting server on port {args.port}...")
    httpd = start_server(slides_dir, args.port)

    try:
        export_pdf(args.output, args.port, args.width, args.height)
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()
