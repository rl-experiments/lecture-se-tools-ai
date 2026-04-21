"""One-shot: screenshot Table of Contents slide to .github/toc.webp."""
import http.server, os, socketserver, threading, time
from playwright.sync_api import sync_playwright
from PIL import Image

OUTPUT_SCALE = 0.5  # 2560 raw width → 1280 to match cover.webp width

PORT = 9877
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLIDES = os.path.join(ROOT, "slides")
OUT = os.path.join(ROOT, ".github", "toc.webp")
TMP_PNG = os.path.join(ROOT, ".github", "_toc_tmp.png")

os.chdir(SLIDES)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k): pass
httpd = socketserver.TCPServer(("127.0.0.1", PORT), Q)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 1170}, device_scale_factor=2)
        page.goto(f"http://127.0.0.1:{PORT}", wait_until="networkidle")
        page.wait_for_selector(".slide.active", timeout=10000)
        page.evaluate("window.go(1)")
        page.evaluate("""() => {
            const nav = document.getElementById('nav'); if (nav) nav.style.display = 'none';
            const pr = document.getElementById('progress'); if (pr) pr.style.display = 'none';
            const s = document.querySelector('.slide.active');
            const cs = getComputedStyle(s);
            document.body.style.backgroundImage = cs.backgroundImage;
            document.body.style.backgroundColor = cs.backgroundColor;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            s.style.backgroundImage = 'none';
            s.style.backgroundColor = 'transparent';
            s.style.transform = 'scale(0.75)';
            s.style.transformOrigin = 'center center';
        }""")
        time.sleep(1.2)
        page.screenshot(path=TMP_PNG, full_page=False)
        browser.close()
    img = Image.open(TMP_PNG)
    new_size = (int(img.width * OUTPUT_SCALE), int(img.height * OUTPUT_SCALE))
    img.resize(new_size, Image.LANCZOS).save(OUT, "WEBP", quality=85, method=6)
    os.remove(TMP_PNG)
    print(f"wrote {OUT} at {new_size}")
finally:
    httpd.shutdown()
