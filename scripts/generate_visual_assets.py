from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "visuals"
OUT.mkdir(parents=True, exist_ok=True)

BG = (247, 241, 230)
INK = (45, 37, 29)
CREAM = (255, 250, 240)
GREEN = (65, 143, 102)
COFFEE = (128, 88, 54)


def font(size, bold=False):
    names = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
    ]
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def title_lines(draw, title, max_width=500):
    words = title.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=font(34, True))[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:2]


def product(path, title, label, color, kind):
    img = Image.new("RGB", (640, 640), BG)
    d = ImageDraw.Draw(img)
    rounded(d, (44, 44, 596, 596), 54, (255, 252, 244), (229, 216, 194), 3)
    d.ellipse((330, 76, 610, 356), fill=tuple(min(255, c + 34) for c in color))
    d.ellipse((18, 382, 226, 590), fill=(235, 224, 204))

    if kind == "cup":
        rounded(d, (220, 190, 420, 438), 34, color)
        rounded(d, (196, 166, 444, 220), 28, (248, 244, 235), (80, 61, 47), 4)
        rounded(d, (238, 438, 402, 476), 16, tuple(max(0, c - 28) for c in color))
        d.arc((390, 250, 512, 360), 280, 80, fill=color, width=22)
    elif kind == "tea":
        rounded(d, (218, 164, 422, 470), 30, color)
        rounded(d, (200, 140, 440, 188), 22, (255, 249, 236), (80, 61, 47), 4)
        for x in (260, 318, 376):
            d.ellipse((x, 402, x + 28, 430), fill=(72, 52, 40))
        d.line((372, 126, 436, 62), fill=(80, 61, 47), width=10)
    elif kind == "combo":
        rounded(d, (170, 204, 336, 430), 30, color)
        rounded(d, (150, 176, 356, 226), 22, (255, 249, 236), (80, 61, 47), 4)
        rounded(d, (364, 272, 498, 420), 26, (219, 169, 92))
        d.polygon([(376, 272), (486, 272), (432, 214)], fill=(243, 205, 130))
    elif kind == "duo":
        left = color
        right = tuple(min(255, c + 38) for c in color)
        rounded(d, (154, 194, 304, 432), 28, left)
        rounded(d, (136, 166, 322, 214), 22, (255, 249, 236), (80, 61, 47), 4)
        rounded(d, (336, 194, 486, 432), 28, right)
        rounded(d, (318, 166, 504, 214), 22, (255, 249, 236), (80, 61, 47), 4)
        for x in (178, 220, 262, 360, 402, 444):
            d.rounded_rectangle((x, 230, x + 22, 252), radius=5, fill=(236, 226, 208))
        d.line((242, 166, 208, 104), fill=(80, 61, 47), width=8)
        d.line((424, 166, 458, 104), fill=(80, 61, 47), width=8)
    elif kind == "sprint":
        rounded(d, (210, 178, 430, 448), 34, color)
        rounded(d, (188, 148, 452, 208), 28, (42, 40, 38), (80, 61, 47), 4)
        rounded(d, (232, 390, 408, 448), 18, tuple(max(0, c - 26) for c in color))
        bolt = (245, 177, 52)
        d.polygon([(270, 244), (326, 244), (302, 294), (344, 294), (274, 374), (290, 316), (250, 316)], fill=bolt)
        d.polygon([(368, 232), (400, 232), (386, 266), (410, 266), (370, 318), (380, 280), (354, 280)], fill=bolt)
    else:
        rounded(d, (218, 176, 422, 462), 36, color)
        d.ellipse((246, 220, 394, 370), outline=(255, 255, 255), width=16)
        d.line((270, 314, 370, 254), fill=(255, 255, 255), width=12)

    lines = title_lines(d, title)
    title_y = 482 if len(lines) > 1 else 500
    for index, line in enumerate(lines):
        d.text((72, title_y + index * 38), line, fill=INK, font=font(34, True))
    d.text((72, 562 if len(lines) > 1 else 544), label, fill=COFFEE, font=font(20, True))
    img.save(OUT / path)


def robot():
    img = Image.new("RGB", (720, 540), (242, 234, 220))
    d = ImageDraw.Draw(img)
    d.ellipse((390, 40, 750, 360), fill=(226, 214, 193))
    rounded(d, (198, 86, 522, 464), 44, (63, 73, 64), (35, 35, 30), 5)
    rounded(d, (238, 124, 482, 252), 28, (238, 246, 235))
    d.ellipse((286, 162, 326, 202), fill=GREEN)
    d.ellipse((394, 162, 434, 202), fill=GREEN)
    rounded(d, (270, 298, 450, 392), 20, (255, 250, 240))
    for x in (298, 342, 386):
        rounded(d, (x, 320, x + 28, 370), 8, (176, 126, 77))
    rounded(d, (142, 178, 204, 360), 24, (89, 101, 91))
    rounded(d, (516, 178, 578, 360), 24, (89, 101, 91))
    d.text((70, 46), "G&A Robot", fill=INK, font=font(38, True))
    d.text((70, 92), "fresh drinks · cloud pickup", fill=COFFEE, font=font(22, True))
    img.save(OUT / "robot-vm.png")


def banner():
    img = Image.new("RGB", (1200, 560), (38, 48, 42))
    d = ImageDraw.Draw(img)
    d.ellipse((720, -80, 1290, 490), fill=(66, 112, 82))
    d.ellipse((600, 250, 980, 640), fill=(199, 146, 79))
    rounded(d, (82, 82, 1118, 478), 48, (247, 241, 230), (221, 204, 176), 4)
    d.text((138, 132), "Morning Coffee Pass", fill=INK, font=font(58, True))
    d.text((142, 208), "Member pricing before 10 AM", fill=COFFEE, font=font(34, True))
    rounded(d, (142, 294, 388, 362), 24, GREEN)
    d.text((184, 312), "View offer", fill=(255, 255, 255), font=font(28, True))
    rounded(d, (760, 142, 956, 392), 36, (133, 86, 52))
    rounded(d, (730, 108, 986, 166), 24, CREAM, INK, 4)
    d.arc((930, 220, 1060, 330), 280, 80, fill=(133, 86, 52), width=22)
    img.save(OUT / "home-banner-morning.png")


products = [
    ("sku-1.png", "Iced Americano", "Cafe · light roast", (168, 118, 82), "cup"),
    ("sku-2.png", "Oat Milk Latte", "Oat · creamy", (212, 180, 137), "cup"),
    ("sku-3.png", "Bubble Tea", "Milk tea · boba", (200, 146, 79), "tea"),
    ("sku-4.png", "Latte Set", "Combo · bakery", (155, 111, 77), "combo"),
    ("sku-5.png", "Bubble Tea Duo", "Combo · share", (184, 120, 85), "tea"),
    ("sku-6.png", "Jasmine Tea", "Tea · low sugar", (127, 163, 106), "tea"),
    ("sku-7.png", "Protein Latte", "Protein · oat", (138, 155, 101), "cup"),
    ("sku-8.png", "Sparkling Water", "Hydrate · light", (110, 160, 162), "bottle"),
    ("sku-9.png", "Sea Salt Caramel Cold Brew", "Cafe · signature cold brew", (151, 101, 67), "cup"),
    ("sku-10.png", "Maple Cinnamon Flat White", "Cafe · warm maple spice", (184, 128, 73), "cup"),
    ("sku-11.png", "Coconut Espresso Cloud", "Cafe · coconut cream", (176, 145, 112), "cup"),
    ("sku-12.png", "Roasted Oolong Milk Tea", "Milk tea · roasted aroma", (157, 111, 73), "tea"),
    ("sku-13.png", "Strawberry Matcha Milk Tea", "Milk tea · fruity matcha", (143, 159, 103), "tea"),
    ("sku-14.png", "Couple's Ice Duo", "Combo · coffee + barley tea", (112, 139, 151), "duo"),
    ("sku-15.png", "Study Night Pair", "Combo · latte + oolong tea", (101, 109, 129), "duo"),
    ("sku-16.png", "Exam Sprint Mocha", "Cafe · double-shot focus", (83, 56, 43), "sprint"),
]

for item in products:
    product(*item)
robot()
banner()
print(f"Generated {len(products) + 2} assets in {OUT}")
