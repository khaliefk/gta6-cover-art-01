#!/usr/bin/env bash
# Take the 4 screenshots for Vice Lights Press with headless Chrome.
# Serves app/ on localhost:8901, shoots each ?shot= scene from shots.json,
# converts to JPEG under the gate caps (long side <= 1280, short >= 480,
# each file <= 256 KiB) into screenshots/.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="$HOME/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"
PORT=8901
mkdir -p screenshots .shots-tmp

python3 -m http.server "$PORT" --directory app >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1

python3 - "$CHROME" "$PORT" <<'EOF'
import json, subprocess, sys
from PIL import Image
chrome, port = sys.argv[1], sys.argv[2]
shots = json.load(open("shots.json"))
for s in shots:
    png = f".shots-tmp/{s['name']}.png"
    url = f"http://127.0.0.1:{port}/index.html{s['query']}"
    subprocess.run([chrome, "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    f"--window-size={s['w']},{s['h']}",
                    "--virtual-time-budget=9000",
                    f"--screenshot={png}", url],
                   check=True, capture_output=True, timeout=120)
    im = Image.open(png).convert("RGB")
    # scale to the gate cap: long side <= 1280 (already), keep exact window size
    q = 88
    out = f"screenshots/{s['name']}"
    while True:
        im.save(out, "JPEG", quality=q, optimize=True)
        import os
        if os.path.getsize(out) <= 256 * 1024 or q <= 55:
            break
        q -= 8
    im2 = Image.open(out)
    print(s["name"], im2.size, os.path.getsize(out), "bytes q", q)
EOF
echo done
