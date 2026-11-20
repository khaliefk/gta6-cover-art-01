#!/usr/bin/env python3
"""Generate the three built-in sample photos for Vice Lights Press.

All three are flat poster-style scenes drawn from scratch with PIL: no real
people, no photographs, no borrowed art. Silhouettes only. Deterministic
output (fixed seed) so the app's screenshots are reproducible.

Usage: python3 tools/gen-samples.py  (writes app/samples/*.png)
"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

W, H = 1200, 900
OUT = "app/samples"


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(draw, w, h, stops):
    """Vertical gradient through color stops [(pos, rgb), ...]."""
    for y in range(h):
        t = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                f = (t - p0) / max(1e-6, p1 - p0)
                draw.line([(0, y), (w, y)], fill=lerp(c0, c1, f))
                break


def glow(img, draw, box, color, blur=18):
    """Soft neon glow: draw the shape on a layer, blur it, composite."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rectangle(box, fill=color + (255,))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    img.alpha_composite(layer)


def palm(draw, x, y, s, lean=0.0, flip=1):
    """A palm silhouette rooted at (x, y), height ~s."""
    pts = []
    steps = 8
    for i in range(steps + 1):
        t = i / steps
        px = x + lean * s * t * t * flip
        py = y - s * t
        pts.append((px, py))
    draw.line(pts, fill=(16, 8, 26), width=max(3, int(s * 0.03)))
    tx, ty = pts[-1]
    for k in range(9):
        ang = math.pi * (0.04 + 0.11 * k)
        length = s * (0.36 - 0.025 * abs(k - 4))
        ex = tx + math.cos(ang if flip > 0 else math.pi - ang) * length
        ey = ty + math.sin(ang) * length * 0.5 + s * 0.05
        draw.line([(tx, ty), (ex, ey)], fill=(16, 8, 26), width=max(2, int(s * 0.016)))
        # second segment drooping down
        mx, my = (tx + ex) / 2, (ty + ey) / 2
        draw.line([(mx, my), (ex + flip * length * 0.10, ey + s * 0.11)],
                  fill=(16, 8, 26), width=max(2, int(s * 0.012)))


def person(draw, x, y, s, pose="walk"):
    """A walking/standing silhouette, height ~s, feet at (x, y)."""
    ink = (12, 8, 20)
    # legs
    draw.line([(x, y - s * 0.52), (x - s * 0.09, y)], fill=ink, width=max(3, int(s * 0.045)))
    draw.line([(x, y - s * 0.52), (x + s * 0.11, y - s * 0.02)], fill=ink, width=max(3, int(s * 0.045)))
    # torso
    draw.line([(x, y - s * 0.52), (x + s * 0.02, y - s * 0.82)], fill=ink, width=max(4, int(s * 0.06)))
    # arms
    if pose == "walk":
        draw.line([(x, y - s * 0.78), (x - s * 0.16, y - s * 0.55)], fill=ink, width=max(3, int(s * 0.04)))
        draw.line([(x, y - s * 0.78), (x + s * 0.15, y - s * 0.62)], fill=ink, width=max(3, int(s * 0.04)))
    else:  # fishing: one arm up holding the rod
        draw.line([(x, y - s * 0.78), (x + s * 0.2, y - s * 0.95)], fill=ink, width=max(3, int(s * 0.04)))
        draw.line([(x, y - s * 0.78), (x - s * 0.12, y - s * 0.6)], fill=ink, width=max(3, int(s * 0.04)))
    # head
    draw.ellipse([x - s * 0.07, y - s * 0.97, x + s * 0.07, y - s * 0.83], fill=ink)


def sunset():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    vgrad(d, W, H, [(0.0, (43, 16, 74)), (0.35, (146, 32, 96)),
                    (0.62, (255, 110, 64)), (0.8, (255, 176, 92)), (1.0, (255, 214, 130))])
    # sun disc + halo
    cx, cy, r = W // 2, int(H * 0.52), 150
    for rr, alpha in ((260, 40), (210, 70), (170, 120)):
        halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        hd = ImageDraw.Draw(halo)
        hd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(255, 220, 150, alpha))
        img.paste(Image.alpha_composite(img.convert("RGBA"), halo).convert("RGB"), (0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 236, 170))
    # sea band with sun reflection
    d.rectangle([0, int(H * 0.66), W, H], fill=(46, 16, 66))
    rnd = random.Random(7)
    for _ in range(90):
        x = cx + rnd.randint(-260, 260)
        y = int(H * 0.67) + rnd.randint(0, int(H * 0.3))
        ln = rnd.randint(20, 120)
        d.line([(x, y), (x + ln, y)], fill=(255, 170, 110), width=3)
    # road wedge
    d.polygon([(W * 0.30, H), (W * 0.46, int(H * 0.66)), (W * 0.54, int(H * 0.66)), (W * 0.70, H)],
              fill=(24, 10, 34))
    for i in range(6):
        t = i / 6
        y = int(H * 0.68) + int((H * 0.30) * t * t)
        wdt = 2 + int(10 * t)
        half = 4 + int(22 * t)
        d.line([(W / 2 - half, y), (W / 2 + half, y)], fill=(255, 220, 130), width=wdt)
    # convertible silhouette
    car_y = int(H * 0.86)
    d.rounded_rectangle([W * 0.16, car_y, W * 0.52, car_y + 62], radius=26, fill=(14, 6, 20))
    d.polygon([(W * 0.22, car_y), (W * 0.28, car_y - 44), (W * 0.42, car_y - 44), (W * 0.48, car_y)],
              fill=(14, 6, 20))
    for wx in (0.24, 0.44):
        d.ellipse([W * wx - 26, car_y + 48, W * wx + 26, car_y + 100], fill=(8, 4, 12))
        d.ellipse([W * wx - 10, car_y + 64, W * wx + 10, car_y + 84], fill=(90, 70, 110))
    palm(d, 70, H, 330, lean=0.35, flip=1)
    palm(d, W - 60, H, 300, lean=0.3, flip=-1)
    palm(d, W - 210, H, 210, lean=0.2, flip=-1)
    return img


def neon():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    vgrad(d, W, H, [(0.0, (8, 8, 24)), (0.6, (16, 10, 40)), (1.0, (26, 12, 44))])
    # building blocks with lit windows
    rnd = random.Random(11)
    x = -40
    while x < W:
        bw = rnd.randint(120, 220)
        bh = rnd.randint(260, 620)
        d.rectangle([x, H - bh - 180, x + bw, H - 180], fill=(14, 12, 34))
        for wy in range(H - bh - 160, H - 200, 34):
            for wx in range(x + 14, x + bw - 14, 30):
                if rnd.random() < 0.4:
                    col = rnd.choice([(255, 214, 130), (120, 220, 255), (255, 120, 200)])
                    d.rectangle([wx, wy, wx + 14, wy + 18], fill=col)
        x += bw + rnd.randint(8, 30)
    # neon signs with glow
    img = img.convert("RGBA")
    d = ImageDraw.Draw(img)
    signs = [
        ([90, 150, 330, 210], (255, 45, 150)),
        ([W - 360, 240, W - 110, 300], (45, 235, 220)),
        ([430, 90, 700, 140], (255, 190, 60)),
        ([W - 300, 420, W - 90, 470], (255, 45, 150)),
    ]
    for box, col in signs:
        glow(img, d, box, col, blur=22)
        d.rectangle(box, fill=col + (255,))
        d.rectangle([box[0] + 8, box[1] + 8, box[2] - 8, box[3] - 8],
                    outline=(255, 255, 255, 220), width=3)
    img = img.convert("RGB")
    d = ImageDraw.Draw(img)
    # wet street + reflections
    d.rectangle([0, H - 180, W, H], fill=(10, 10, 26))
    for _ in range(70):
        x = rnd.randint(0, W)
        y = H - 180 + rnd.randint(0, 170)
        ln = rnd.randint(10, 90)
        col = rnd.choice([(255, 45, 150), (45, 235, 220), (255, 190, 60)])
        d.line([(x, y), (x, y + ln)], fill=col, width=3)
    # two friends walking
    person(d, int(W * 0.42), H - 40, 260, pose="walk")
    person(d, int(W * 0.56), H - 30, 285, pose="walk")
    return img


def pier():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    vgrad(d, W, H, [(0.0, (168, 224, 226)), (0.45, (120, 200, 210)),
                    (0.62, (64, 170, 190)), (1.0, (16, 110, 130))])
    # sun + clouds
    d.ellipse([W - 260, 70, W - 140, 190], fill=(255, 244, 200))
    for cx, cy, s in ((200, 120, 90), (300, 100, 70), (760, 180, 80), (880, 160, 60)):
        d.ellipse([cx - s, cy - s // 2, cx + s, cy + s // 2], fill=(255, 255, 255))
    # sea sparkle
    rnd = random.Random(23)
    for _ in range(120):
        x = rnd.randint(0, W)
        y = int(H * 0.6) + rnd.randint(0, int(H * 0.38))
        d.line([(x, y), (x + rnd.randint(15, 70), y)], fill=(220, 245, 245), width=2)
    # pier planks in perspective
    d.polygon([(W * 0.34, H), (W * 0.46, int(H * 0.58)), (W * 0.56, int(H * 0.58)), (W * 0.72, H)],
              fill=(122, 84, 52))
    for i in range(12):
        t = i / 12
        y = int(H * 0.60) + int((H * 0.38) * t)
        xl = W * 0.46 - (W * 0.12) * t
        xr = W * 0.56 + (W * 0.16) * t
        d.line([(xl, y), (xr, y)], fill=(84, 56, 32), width=3)
    d.line([(W * 0.46, int(H * 0.58)), (W * 0.34, H)], fill=(96, 64, 38), width=6)
    d.line([(W * 0.56, int(H * 0.58)), (W * 0.72, H)], fill=(96, 64, 38), width=6)
    # fisherman at the pier end + rod
    fx, fy = int(W * 0.51), int(H * 0.60)
    person(d, fx, fy, 150, pose="fish")
    d.line([(fx + 30, fy - 140), (fx + 190, fy - 260)], fill=(20, 16, 30), width=4)
    d.line([(fx + 190, fy - 260), (fx + 150, fy - 60)], fill=(200, 220, 220), width=1)
    # gulls
    for gx, gy, s in ((300, 220, 26), (360, 190, 20), (900, 260, 24)):
        d.arc([gx - s, gy - s // 2, gx, gy + s // 2], 200, 340, fill=(40, 60, 70), width=3)
        d.arc([gx, gy - s // 2, gx + s, gy + s // 2], 200, 340, fill=(40, 60, 70), width=3)
    return img


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    for name, fn in (("sunset", sunset), ("neon", neon), ("pier", pier)):
        im = fn()
        im.save(f"{OUT}/{name}.png")
        print(name, im.size)
