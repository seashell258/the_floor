from pathlib import Path
from io import BytesIO
from PIL import Image as PILImage
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

IMAGE_DIR = Path(__file__).parent / "飢餓遊戲角色"
OUTPUT_PATH = Path(__file__).parent / "飢餓遊戲角色.pdf"
PAGE_W, PAGE_H = 595, 802
PADDING = 10
MAX_IMG_H = 680
TEXT_FONT_SIZE = 28
FONT_NAME = "STSong-Light"
EXTENSIONS = ["jpg", "jpeg", "JPG", "JPEG", "avif", "png", "PNG", "webp", "WEBP"]

PLANTS = [  "Katniss Everdeen 凱妮絲・艾佛丁",
  "Peeta Mellark 比德・梅爾拉克",
  "Gale Hawthorne 蓋爾・霍桑",
  "Effie Trinket 艾菲・純克",
  "Haymitch Abernathy 黑密契・亞伯納西",
  "President Snow 史諾總統",
  "Plutarch Heavensbee 普魯塔克・希文斯比",
  "Caesar Flickerman 凱薩・弗利克曼",
  "Primrose Everdeen 波麗姆・艾佛丁（Prim）",
  "Finnick Odair 芬尼克・歐戴爾",
  "Johanna Mason 喬安娜・梅森",
  "Alma Coin 艾瑪・柯茵",
  "Cinna 秦納",
  "Rue 露"
]
def find_image(n: int, image_dir: Path) -> Path:
    for ext in EXTENSIONS:
        p = image_dir / f"{n}.{ext}"
        if p.exists():
            return p
    raise FileNotFoundError(f"找不到第 {n} 張圖片（目錄：{image_dir}）")


def calc_image_rect(
    img_w: float, img_h: float,
    available_w: float, available_h: float,
) -> tuple[float, float]:
    """Return (draw_w, draw_h) scaled to fit within available bounds, aspect ratio preserved."""
    scale = min(available_w / img_w, available_h / img_h)
    return img_w * scale, img_h * scale


def generate_pdf(
    image_dir: Path,
    names: list[str],
    output_path: Path,
) -> None:
    pdfmetrics.registerFont(UnicodeCIDFont(FONT_NAME))
    c = canvas.Canvas(str(output_path), pagesize=(PAGE_W, PAGE_H))

    avail_w = PAGE_W - 2 * PADDING
    img_top_y = PAGE_H - PADDING
    text_zone_top = PAGE_H - PADDING - MAX_IMG_H   # 172
    text_zone_bottom = PADDING                      # 10
    text_center_y = (text_zone_top + text_zone_bottom) / 2  # 91

    for i, name in enumerate(names, start=1):
        try:
            img_path = find_image(i, image_dir)
            with PILImage.open(img_path) as pil_img:
                pil_img = pil_img.convert("RGB")
                iw, ih = pil_img.size
                buf = BytesIO()
                pil_img.save(buf, format="JPEG", quality=95)
                buf.seek(0)
                img_reader = ImageReader(buf)
        except FileNotFoundError as e:
            c.setFont("Helvetica", 14)
            c.setFillColorRGB(1, 0, 0)
            c.drawCentredString(PAGE_W / 2, PAGE_H / 2, str(e))
            c.showPage()
            continue

        draw_w, draw_h = calc_image_rect(iw, ih, avail_w, MAX_IMG_H)
        img_x = PADDING + (avail_w - draw_w) / 2
        img_y = img_top_y - draw_h

        c.drawImage(img_reader, img_x, img_y, draw_w, draw_h)

        c.setFont(FONT_NAME, TEXT_FONT_SIZE)
        c.setFillColorRGB(0, 0, 0)
        c.drawCentredString(PAGE_W / 2, text_center_y - TEXT_FONT_SIZE / 2, name)

        c.showPage()

    c.save()


if __name__ == "__main__":
    generate_pdf(IMAGE_DIR, PLANTS, OUTPUT_PATH)
    print(f"輸出：{OUTPUT_PATH}（{len(PLANTS)} 頁）")
