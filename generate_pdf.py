from pathlib import Path
from io import BytesIO
from PIL import Image as PILImage
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

IMAGE_DIR = Path(__file__).parent / "台灣行道樹＆園藝植物"
OUTPUT_PATH = Path(__file__).parent / "台灣行道樹＆園藝植物.pdf"
PAGE_W, PAGE_H = 595, 842
PADDING = 10
MAX_IMG_H = 660
TEXT_FONT_SIZE = 28
FONT_NAME = "STSong-Light"
EXTENSIONS = ["jpg", "jpeg", "JPG", "JPEG", "avif", "png", "PNG", "webp", "WEBP"]

PLANTS = [
    "榕樹", "虎尾蘭", "茄苳", "唐竹", "阿勃勒",
    "班葉鵝掌藤", "臺灣欒樹", "黑松", "雪茄花", "樟樹",
    "琴葉榕", "重陽木", "蒲葵", "苦楝", "天堂鳥",
    "九芎", "日本女貞", "臺灣櫸（雞油）", "龜背芋", "白千層",
    "厚葉石斑木", "山櫻花（緋寒櫻）", "百合竹", "楓香", "五爪木",
    "水黃皮", "蘭嶼肉桂", "光臘樹", "臺北海桐", "黃槿",
    "印度橡膠樹", "青楓", "竹柏", "朴樹", "白水木", "瓊崖海棠",
]


def find_image(n: int, image_dir: Path) -> Path:
    raise NotImplementedError


def calc_image_rect(
    img_w: float, img_h: float,
    available_w: float, available_h: float,
) -> tuple[float, float]:
    raise NotImplementedError


def generate_pdf(
    image_dir: Path,
    names: list[str],
    output_path: Path,
) -> None:
    raise NotImplementedError


if __name__ == "__main__":
    generate_pdf(IMAGE_DIR, PLANTS, OUTPUT_PATH)
    print(f"輸出：{OUTPUT_PATH}（{len(PLANTS)} 頁）")
