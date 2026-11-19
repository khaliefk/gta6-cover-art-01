#!/usr/bin/env python3
"""Draw the three sample photos for Neon Boulevard Press.

Every pixel comes from this file. No photo, no stock image, no game art.
Each scene is a flat vector style picture: sky gradient, sun or moon,
a skyline or boats, and a few palms. Run it from the repo root:

    python3 tools/draw-samples.py
"""

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

W, H = 1080, 1350
OUT = Path(__file__).resolve().parent.parent / "app" / "samples"


def blend(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sky(draw, top, bottom):
    for y in range(H):
        draw.line([(0, y), (W, y)], fill=blend(top, bottom, y / H))


def sun(draw, cx, cy, r, core, glow):
    for k in range(5, 0, -1):
        draw.ellipse(
            [cx - r * k, cy - r * k, cx + r * k, cy + r * k],
            fill=blend(glow, core, k / 5),
        )
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=core)


def palm(draw, x, y, s, dark):
    draw.line([(x, y), (x + 8 * s, y - 150 * s)], fill=dark, width=max(6, int(12 * s)))
    top = (x + 8 * s, y - 150 * s)
    for ang in range(-170, 30, 28):
        rad = math.radians(ang)
        tip = (top[0] + math.cos(rad) * 110 * s, top[1] + math.sin(rad) * 55 * s - 20 * s)
        draw.line([top, tip], fill=dark, width=max(4, int(8 * s)))
        mid = ((top[0] + tip[0]) / 2, (top[1] + tip[1]) / 2 + 22 * s)
        draw.line([top, mid], fill=dark, width=max(3, int(5 * s)))


def windows(draw, x, y, w, h, lit, dark):
    for wy in range(y + 18, y + h - 12, 34):
        for wx in range(x + 14, x + w - 14, 30):
            if random.random() < 0.55:
                draw.rectangle([wx, wy, wx + 14, wy + 18], fill=lit)
            else:
                draw.rectangle([wx, wy, wx + 14, wy + 18], fill=dark)


def marina():
    img = Image.new("RGB", (W, H), (20, 10, 40))
    d = ImageDraw.Draw(img)
    sky(d, (255, 122, 60), (120, 30, 110))
    sun(d, 540, 620, 150, (255, 214, 120), (255, 110, 80))
    d.rectangle([0, 900, W, H], fill=(24, 16, 66))
    for i in range(26):
        y = 920 + i * 16
        d.line([(0, y), (W, y)], fill=blend((255, 150, 90), (24, 16, 66), i / 26))
    for bx, bw in [(90, 260), (430, 330), (800, 240)]:
        d.polygon([(bx, 900), (bx + bw, 900), (bx + bw - 30, 850), (bx + 30, 850)], fill=(12, 8, 34))
        d.line([(bx + bw // 2, 850), (bx + bw // 2, 640)], fill=(12, 8, 34), width=8)
        d.polygon(
            [(bx + bw // 2, 650), (bx + bw // 2 + 150, 840), (bx + bw // 2, 840)],
            fill=(245, 240, 230),
        )
    d.rectangle([0, 1080, W, H], fill=(10, 8, 30))
    palm(d, 120, 1120, 1.1, (8, 6, 22))
    palm(d, 960, 1140, 0.9, (8, 6, 22))
    return img


def rooftop():
    img = Image.new("RGB", (W, H), (8, 8, 26))
    d = ImageDraw.Draw(img)
    sky(d, (10, 8, 40), (70, 20, 90))
    random.seed(7)
    for _ in range(120):
        x, y = random.randint(0, W), random.randint(0, 500)
        r = random.choice([1, 1, 2])
        d.ellipse([x, y, x + r, y + r], fill=(240, 240, 255))
    d.ellipse([830, 130, 950, 250], fill=(235, 230, 200))
    d.ellipse([860, 150, 880, 170], fill=(200, 195, 170))
    d.ellipse([900, 190, 925, 210], fill=(200, 195, 170))
    towers = [(0, 700, 190, 650), (200, 560, 170, 790), (380, 760, 200, 590),
              (590, 620, 180, 730), (780, 780, 160, 570), (950, 660, 130, 690)]
    for x, top, w, h in towers:
        d.rectangle([x, top, x + w, top + h], fill=(16, 12, 38))
        windows(d, x, top, w, h, (255, 200, 90), (30, 26, 60))
    d.rectangle([0, 1180, W, H], fill=(6, 5, 20))
    d.rectangle([60, 1090, 420, 1180], fill=(255, 60, 120))
    d.rectangle([60, 1090, 420, 1120], fill=(255, 220, 90))
    d.rectangle([660, 1120, 1020, 1180], fill=(60, 220, 255))
    return img


def boardwalk():
    img = Image.new("RGB", (W, H), (120, 200, 240))
    d = ImageDraw.Draw(img)
    sky(d, (110, 190, 245), (255, 235, 190))
    sun(d, 850, 240, 110, (255, 246, 200), (255, 220, 140))
    d.rectangle([0, 700, W, 980], fill=(40, 170, 200))
    for i in range(8):
        y = 720 + i * 32
        d.arc([-200, y, W + 200, y + 90], 0, 180, fill=(255, 255, 255), width=5)
    d.rectangle([0, 980, W, H], fill=(245, 214, 150))
    for x in range(-40, W + 40, 90):
        d.line([(x, 980), (x + 46, H)], fill=(214, 178, 110), width=6)
    d.rectangle([180, 760, 330, 980], fill=(255, 90, 90))
    d.rectangle([180, 760, 330, 800], fill=(255, 255, 255))
    d.rectangle([180, 860, 330, 900], fill=(255, 255, 255))
    d.line([(255, 760), (255, 620)], fill=(120, 70, 40), width=10)
    d.polygon([(255, 560), (255, 660), (370, 660)], fill=(255, 60, 90))
    palm(d, 900, 1030, 1.2, (30, 90, 40))
    palm(d, 90, 1060, 1.0, (30, 90, 40))
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("marina", marina), ("rooftop", rooftop), ("boardwalk", boardwalk)]:
        fn().save(OUT / f"{name}.jpg", quality=88)
        print(f"drew app/samples/{name}.jpg")


if __name__ == "__main__":
    main()
