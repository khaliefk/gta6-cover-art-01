#!/usr/bin/env python3
"""Draw the three sample photos for Neon Boulevard Press.

Every sample is painted in code: gradients, silhouettes, neon glow, grain.
No photo, no stock image, no borrowed art. Run from the repo root:

    python3 tools/make-samples.py

It writes app/samples/strip.jpg, app/samples/alley.jpg and
app/samples/drive.jpg at 1200 by 900.
"""

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 900
OUT = Path(__file__).resolve().parent.parent / "app" / "samples"


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(size, stops):
    """Vertical gradient. stops is a list of (position 0..1, rgb)."""
    w, h = size
    ys = np.linspace(0, 1, h)
    cols = np.zeros((h, 3))
    for i in range(len(stops) - 1):
        p0, c0 = stops[i]
        p1, c1 = stops[i + 1]
        m = (ys >= p0) & (ys <= p1)
        t = np.clip((ys[m] - p0) / max(p1 - p0, 1e-6), 0, 1)
        for ch in range(3):
            cols[m, ch] = c0[ch] + (c1[ch] - c0[ch]) * t
    cols[ys < stops[0][0]] = stops[0][1]
    cols[ys > stops[-1][0]] = stops[-1][1]
    arr = np.repeat(cols[:, None, :], w, axis=1).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def glow_layer(size, draw_fn, blur=18):
    """Draw on a black layer, blur it, and return it for screen blending."""
    layer = Image.new("RGB", size, (0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    return layer.filter(ImageFilter.GaussianBlur(blur))


def add_grain(img, amount=9):
    arr = np.asarray(img).astype(np.int16)
    noise = np.random.normal(0, amount, arr.shape[:2])[..., None]
    out = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGB")


def frond(draw, cx, cy, tipx, tipy, color):
    """One tapered frond: a filled shape along a drooping curve."""
    mx = cx + (tipx - cx) * 0.5
    my = cy + (tipy - cy) * 0.5 + 26
    steps = 8
    left = []
    right = []
    for i in range(steps + 1):
        t = i / steps
        x = (1 - t) ** 2 * cx + 2 * (1 - t) * t * mx + t * t * tipx
        y = (1 - t) ** 2 * cy + 2 * (1 - t) * t * my + t * t * tipy
        dx = 2 * (1 - t) * (mx - cx) + 2 * t * (tipx - mx)
        dy = 2 * (1 - t) * (my - cy) + 2 * t * (tipy - my)
        n = math.hypot(dx, dy) or 1
        w = 9 * (1 - t) + 1
        left.append((x - dy / n * w, y + dx / n * w))
        right.append((x + dy / n * w, y - dx / n * w))
    draw.polygon(left + right[::-1], fill=color)


def palm(draw, bx, by, length, direction, color, width=9):
    """One palm silhouette: a curved trunk and six fronds."""
    cx = bx + direction * length * 0.22
    cy = by - length
    draw.line(
        [(bx, by), (bx + direction * length * 0.12, by - length * 0.6), (cx, cy)],
        fill=color,
        width=width,
        joint="curve",
    )
    for i in range(6):
        a = -math.pi / 2 + (i - 2.5) * 0.5
        fx = cx + math.cos(a) * length * 0.45
        fy = cy + math.sin(a) * length * 0.45 + length * 0.16
        frond(draw, cx, cy, fx, fy, color)


def skyline(draw, base_y, color, lit, seed):
    rnd = random.Random(seed)
    x = 0
    while x < W:
        bw = rnd.randint(70, 170)
        bh = rnd.randint(90, 260)
        draw.rectangle([x, base_y - bh, x + bw, base_y], fill=color)
        for _ in range(14):
            if rnd.random() > 0.55:
                wx = x + rnd.randint(8, max(9, bw - 12))
                wy = base_y - bh + rnd.randint(12, max(13, bh - 16))
                draw.rectangle([wx, wy, wx + 7, wy + 9], fill=lit)
        x += bw + rnd.randint(6, 22)


def strip():
    img = vgrad((W, H), [(0.0, (43, 16, 85)), (0.42, (255, 41, 117)), (0.72, (255, 154, 61)), (1.0, (255, 211, 25))])
    glow = glow_layer((W, H), lambda d: d.ellipse([760 - 90, 260 - 90, 760 + 90, 260 + 90], fill=(255, 243, 196)), blur=40)
    img = ImageChops.screen(img, glow)
    d = ImageDraw.Draw(img)
    d.ellipse([760 - 70, 260 - 70, 760 + 70, 260 + 70], fill=(255, 243, 196))
    skyline(d, 640, (28, 11, 51), (255, 211, 25), seed=7)
    d.rectangle([0, 640, W, H], fill=(16, 7, 26))
    d.line([(W / 2 - 130, 640), (W / 2 - 260, H)], fill=(255, 211, 25), width=6)
    d.line([(W / 2 + 130, 640), (W / 2 + 260, H)], fill=(255, 211, 25), width=6)
    for i in range(5):
        y = 690 + i * 42
        half = 26 + i * 30
        d.polygon([(W / 2 - half, y), (W / 2 + half, y), (W / 2 + half + 14, y + 16), (W / 2 - half - 14, y + 16)], fill=(255, 211, 25))
    palm(d, 90, 660, 300, -1, (16, 7, 26))
    palm(d, 1120, 660, 260, 1, (16, 7, 26))
    return add_grain(img)


def alley():
    img = vgrad((W, H), [(0.0, (8, 10, 26)), (0.6, (14, 12, 34)), (1.0, (20, 14, 30))])
    d = ImageDraw.Draw(img)
    d.polygon([(0, 0), (300, 0), (430, H), (0, H)], fill=(24, 18, 44))
    d.polygon([(W, 0), (880, 0), (760, H), (W, H)], fill=(22, 16, 40))
    d.rectangle([0, 640, W, H], fill=(10, 10, 18))
    signs = [
        (70, 120, 210, 260, (255, 41, 117), "OPEN"),
        (930, 90, 180, 300, (45, 212, 191), "BAR"),
        (940, 430, 160, 140, (255, 211, 25), "24H"),
        (90, 420, 170, 120, (140, 30, 255), "RAMEN"),
    ]
    for (x, y, w, h, color, text) in signs:
        glow = glow_layer((W, H), lambda dd, x=x, y=y, w=w, h=h, c=color: dd.rectangle([x, y, x + w, y + h], outline=c, width=6), blur=22)
        img = ImageChops.screen(img, glow)
        d = ImageDraw.Draw(img)
        d.rectangle([x, y, x + w, y + h], fill=(16, 12, 30))
        d.rectangle([x, y, x + w, y + h], outline=color, width=5)
        d.rectangle([x + 12, y + 12, x + w - 12, y + h - 12], outline=color, width=2)
        size = 44
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
        while d.textlength(text, font=font) > w - 28 and size > 12:
            size -= 2
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
        tw = d.textlength(text, font=font)
        d.text((x + (w - tw) / 2, y + h / 2 - size / 2 - 2), text, font=font, fill=color)
    rnd = random.Random(11)
    for i in range(9):
        x = 320 + i * 62
        y = 60 + (i % 2) * 26
        glow = glow_layer((W, H), lambda dd, x=x, y=y: dd.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(255, 200, 120)), blur=10)
        img = ImageChops.screen(img, glow)
        d = ImageDraw.Draw(img)
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(255, 220, 150))
    d = ImageDraw.Draw(img)
    for (x, y, w, h, color, _t) in signs:
        for _ in range(26):
            rx = x + rnd.randint(0, w)
            rh = rnd.randint(30, 130)
            d.line([(rx, 650), (rx, 650 + rh)], fill=color, width=3)
    d.rectangle([0, 640, W, 652], fill=(60, 50, 90))
    return add_grain(img)


def drive():
    img = vgrad((W, H), [(0.0, (70, 180, 190)), (0.45, (255, 190, 130)), (0.62, (40, 110, 160)), (0.78, (240, 200, 140)), (1.0, (214, 164, 110))])
    glow = glow_layer((W, H), lambda d: d.ellipse([330 - 80, 300 - 80, 330 + 80, 300 + 80], fill=(255, 244, 200)), blur=36)
    img = ImageChops.screen(img, glow)
    d = ImageDraw.Draw(img)
    d.ellipse([330 - 62, 300 - 62, 330 + 62, 300 + 62], fill=(255, 246, 210))
    for (cx, cy, cw, ch) in [(820, 130, 260, 46), (180, 90, 220, 40), (1020, 210, 200, 36)]:
        cloud = glow_layer((W, H), lambda dd, cx=cx, cy=cy, cw=cw, ch=ch: dd.ellipse([cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2], fill=(255, 255, 255)), blur=22)
        img = ImageChops.screen(img, cloud)
        d = ImageDraw.Draw(img)
    d.rectangle([0, 470, W, 640], fill=(28, 96, 150))
    rnd = random.Random(23)
    for _ in range(60):
        x = rnd.randint(0, W)
        y = rnd.randint(480, 630)
        ln = rnd.randint(20, 90)
        d.line([(x, y), (x + ln, y)], fill=(220, 240, 250), width=2)
    d.rectangle([0, 640, W, H], fill=(214, 164, 110))
    d.polygon([(0, 700), (W, 660), (W, H), (0, H)], fill=(198, 148, 96))
    palm(d, 110, 700, 330, -1, (30, 40, 30))
    palm(d, 1090, 690, 290, 1, (30, 40, 30))
    d.line([(610, 760), (610, 660)], fill=(90, 60, 40), width=6)
    d.pieslice([540, 610, 680, 700], 180, 360, fill=(255, 80, 90))
    d.pieslice([540, 610, 680, 700], 180, 360, outline=(255, 255, 255), width=3)
    d.line([(610, 660), (540, 700)], fill=(255, 255, 255), width=3)
    d.line([(610, 660), (680, 700)], fill=(255, 255, 255), width=3)
    return add_grain(img)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("strip", strip), ("alley", alley), ("drive", drive)]:
        path = OUT / f"{name}.jpg"
        fn().save(path, "JPEG", quality=88)
        print(f"wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
