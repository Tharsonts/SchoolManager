"""Generate School Manager Android launcher icons (requires Pillow)."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "android/app/src/main/res"
PURPLE = (93, 48, 221, 255)
WHITE = (255, 255, 255, 255)


def cap(draw, scale, offset=(0, 0)):
    def points(coords):
        return [(int(offset[0] + x * scale), int(offset[1] + y * scale)) for x, y in coords]

    # A simple graduation cap, matching the mark on the login screen.
    draw.polygon(points([(0.18, 0.43), (0.5, 0.25), (0.82, 0.43), (0.5, 0.61)]), fill=WHITE)
    draw.polygon(points([(0.29, 0.55), (0.5, 0.68), (0.71, 0.55), (0.71, 0.69),
                         (0.5, 0.82), (0.29, 0.69)]), fill=WHITE)
    draw.line(points([(0.82, 0.43), (0.82, 0.7)]), fill=WHITE, width=max(3, int(scale * 0.035)))
    x, y = points([(0.82, 0.73)])[0]
    r = int(scale * 0.035)
    draw.ellipse((x-r, y-r, x+r, y+r), fill=WHITE)


def legacy(size):
    s = size * 4
    image = Image.new("RGBA", (s, s))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, s-1, s-1), radius=int(s * 0.23), fill=PURPLE)
    cap(draw, s * 0.72, (s * 0.14, s * 0.14))
    return image.resize((size, size), Image.Resampling.LANCZOS)


for density, size in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    folder = ROOT / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    icon = legacy(size)
    icon.save(folder / "ic_launcher.png")
    icon.save(folder / "ic_launcher_round.png")

# Adaptive icons leave room for Android's circular and shaped masks.
size = 432
foreground = Image.new("RGBA", (size, size))
cap(ImageDraw.Draw(foreground), size * 0.52, (size * 0.24, size * 0.24))
for density, output_size in {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}.items():
    foreground.resize((output_size, output_size), Image.Resampling.LANCZOS).save(
        ROOT / f"mipmap-{density}" / "ic_launcher_foreground.png"
    )
