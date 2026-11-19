#!/usr/bin/env python3
"""Draw the three sample photos for Neon Boulevard Press.

Every pixel here comes from PIL primitives in this script. No photo
is copied in from anywhere. Run from the repo root:

    python3 tools/draw-samples.py
"""

import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "app", "samples")
W, H = 1200, 900


def sky(draw, top, mid, bottom):
    for y in range(H):
        t = y / H
        if t < 0.55:
            f = t / 0.55
            c = tuple(int(top[i] + (mid[i] - top[i]) * f) for i in range(3))
        else:
            f = (t - 0.55) / 0.45
            c = tuple(int(mid[i] + (bottom[i] - mid[i]) * f) for i in range(3))
        draw.line([(0, y), (W, y)], fill=c)


def sun(draw, cx, cy, r, color, glow):
    for k in range(5, 0, -1):
        draw.ellipse(
            [cx - r * k / 3, cy - r * k / 3, cx + r * k / 3, cy + r * k / 3],
            fill=glow,
        )
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)


def palm(draw, x, base, h, lean, color):
    top_x = x + lean
    top_y = base - h
    draw.line([(x, base), (top_x, top_y)], fill=color, width=14)
    for a in range(7):
        ang = math.pi * (0.08 + a * 0.13)
        ln = 95 - a * 6
        ex = top_x + math.cos(ang) * ln * (1 if a % 2 == 0 else -1)
        ey = top_y + math.sin(ang) * ln * 0.55
        draw.line([(top_x, top_y), (ex, ey)], fill=color, width=7)


def windows(draw, x0, y0, x1, y1, cols, rows, lit, color):
    cw = (x1 - x0) / cols
    ch = (y1 - y0) / rows
    for r in range(rows):
        for c in range(cols):
            if random.random() < lit:
                draw.rectangle(
                    [x0 + c * cw + 4, y0 + r * ch + 4,
                     x0 + (c + 1) * cw - 4, y0 + (r + 1) * ch - 4],
                    fill=color,
                )


def avenue():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    sky(d, (38, 12, 80), (214, 74, 140), (255, 158, 74))
    sun(d, 600, 470, 110, (255, 236, 170), (255, 120, 90))
    d.rectangle([0, 620, W, H], fill=(24, 10, 44))
    d.polygon([(480, 620), (720, 620), (1080, H), (120, H)], fill=(52, 22, 70))
    for i in range(9):
        y = 640 + i * 28
        wdt = 6 + i * 3
        d.line([(600, y), (600, y)], fill=(255, 214, 120), width=wdt)
    for bx, bw, bh, col in [(40, 180, 300, (30, 8, 58)),
                            (260, 130, 210, (22, 6, 48)),
                            (980, 180, 330, (30, 8, 58)),
                            (1140, 60, 180, (22, 6, 48))]:
        d.rectangle([bx, 620 - bh, bx + bw, 620], fill=col)
        windows(d, bx + 12, 620 - bh + 14, bx + bw - 12, 610, 4, 6, 0.5,
                (255, 190, 90))
    d.rectangle([70, 300, 190, 360], fill=(255, 45, 149))
    d.rectangle([1010, 270, 1130, 330], fill=(0, 229, 255))
    palm(d, 300, 640, 260, 40, (16, 6, 30))
    palm(d, 900, 640, 300, -50, (16, 6, 30))
    d.rectangle([0, 880, W, H], fill=(12, 4, 26))
    return img


def harbor():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    sky(d, (6, 10, 38), (16, 34, 84), (52, 90, 140))
    for _ in range(90):
        x = random.randint(0, W - 1)
        y = random.randint(0, 380)
        r = random.randint(1, 2)
        d.ellipse([x, y, x + r, y + r], fill=(230, 240, 255))
    sun(d, 930, 190, 70, (244, 241, 222), (120, 140, 190))
    d.rectangle([0, 560, W, H], fill=(8, 20, 48))
    for i in range(26):
        y = 580 + i * 12
        x0 = random.randint(0, W - 200)
        ln = random.randint(80, 320)
        d.line([(x0, y), (x0 + ln, y)], fill=(90, 160, 220), width=3)
    d.polygon([(180, 560), (300, 560), (330, 470), (210, 470)], fill=(10, 14, 30))
    d.line([(270, 470), (270, 330)], fill=(10, 14, 30), width=6)
    d.polygon([(270, 340), (330, 460), (270, 460)], fill=(240, 240, 230))
    d.polygon([(560, 560), (760, 560), (800, 500), (600, 500)], fill=(14, 18, 36))
    d.rectangle([620, 440, 720, 500], fill=(20, 26, 48))
    windows(d, 630, 450, 710, 495, 4, 2, 0.7, (255, 210, 110))
    for bx in (60, 1020):
        d.rectangle([bx, 380, bx + 120, 560], fill=(8, 12, 28))
        windows(d, bx + 10, 400, bx + 110, 550, 3, 6, 0.4, (255, 190, 90))
    for i in range(7):
        x = 120 + i * 150
        d.line([(x, 560), (x, 520)], fill=(255, 200, 100), width=3)
        d.ellipse([x - 5, 512, x + 5, 522], fill=(255, 220, 140))
    return img


def rooftop():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    sky(d, (10, 8, 48), (120, 50, 140), (255, 140, 80))
    sun(d, 300, 520, 95, (255, 220, 150), (255, 110, 80))
    for bx, bw, bh in [(0, 150, 420), (180, 110, 300), (330, 170, 480),
                       (540, 130, 340), (700, 190, 520), (920, 140, 380),
                       (1090, 110, 300)]:
        d.rectangle([bx, 620 - bh, bx + bw, 620], fill=(18, 10, 40))
        windows(d, bx + 10, 620 - bh + 16, bx + bw - 10, 610, 4, 8, 0.45,
                (140, 220, 255))
    d.rectangle([0, 620, W, H], fill=(40, 18, 52))
    d.rectangle([180, 680, 1020, 840], fill=(0, 180, 200))
    d.rectangle([180, 680, 1020, 700], fill=(120, 240, 250))
    for i in range(12):
        x = 210 + i * 66
        d.line([(x, 720), (x + 40, 720)], fill=(180, 245, 255), width=4)
    d.ellipse([880, 700, 980, 760], fill=(255, 90, 160))
    d.rectangle([900, 760, 960, 800], fill=(255, 200, 90))
    d.line([(820, 700), (820, 620)], fill=(30, 12, 44), width=8)
    d.polygon([(820, 620), (740, 690), (900, 690)], fill=(255, 60, 120))
    palm(d, 120, 660, 200, 30, (12, 6, 26))
    d.rectangle([60, 640, 240, 660], fill=(20, 8, 36))
    return img


def main():
    random.seed(20261119)
    os.makedirs(OUT, exist_ok=True)
    jobs = [("avenue.jpg", avenue), ("harbor.jpg", harbor),
            ("rooftop.jpg", rooftop)]
    for name, fn in jobs:
        img = fn().filter(ImageFilter.GaussianBlur(0.4))
        img.save(os.path.join(OUT, name), quality=84)
        print("drew", name)


if __name__ == "__main__":
    main()
