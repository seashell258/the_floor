# 台灣行道樹 PDF 生成器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a 36-page A4 PDF where each page has a plant image (top ~80%) and a Chinese plant name (bottom).

**Architecture:** Single Python script `generate_pdf.py` with three pure functions (`find_image`, `calc_image_rect`, `generate_pdf`) plus a `__main__` entry point. Tests live in `tests/test_generate_pdf.py`. Run inside `/app/.venv`.

**Tech Stack:** Python 3.12, ReportLab 5 (CID font STSong-Light for Chinese), Pillow 12 (image decode + avif support), pytest

## Global Constraints

- Python interpreter: `/app/.venv/bin/python3`
- Run tests with: `/app/.venv/bin/pytest tests/ -v`
- Image directory: `/app/台灣行道樹＆園藝植物/` (already exists, 36 images, mixed extensions)
- Output path: `/app/台灣行道樹＆園藝植物.pdf`
- A4 page: 595 × 842 pt (ReportLab points, origin bottom-left)
- PADDING = 10 pt (all sides)
- MAX_IMG_H = 660 pt (~80% of page height)
- TEXT_FONT_SIZE = 28 pt
- No external font files — use `UnicodeCIDFont('STSong-Light')` from reportlab.pdfbase.cidfonts

---

### Task 1: Project scaffold

**Files:**
- Create: `/app/generate_pdf.py`
- Create: `/app/tests/__init__.py`
- Create: `/app/tests/test_generate_pdf.py`

**Interfaces:**
- Produces: `find_image(n, image_dir)`, `calc_image_rect(img_w, img_h, avail_w, avail_h)`, `generate_pdf(image_dir, names, output_path)` — stubs only, raise `NotImplementedError`
- Produces: `PLANTS` list (36 entries), `IMAGE_DIR`, `OUTPUT_PATH`, `PAGE_W`, `PAGE_H` constants

- [ ] **Step 1: Install pytest in the venv**

```bash
/app/.venv/bin/pip install pytest
```

Expected: `Successfully installed pytest-...`

- [ ] **Step 2: Create `/app/generate_pdf.py` with constants, PLANTS list, and function stubs**

```python
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
```

- [ ] **Step 3: Create `/app/tests/__init__.py`** (empty file)

- [ ] **Step 4: Create `/app/tests/test_generate_pdf.py` skeleton**

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from generate_pdf import find_image, calc_image_rect, generate_pdf, IMAGE_DIR, PLANTS


def test_placeholder():
    pass
```

- [ ] **Step 5: Run tests to confirm setup works**

```bash
cd /app && /app/.venv/bin/pytest tests/ -v
```

Expected: `1 passed`

- [ ] **Step 6: Commit**

```bash
git add generate_pdf.py tests/
git commit -m "feat: add PDF generator scaffold with stubs"
```

---

### Task 2: Implement find_image()

**Files:**
- Modify: `/app/generate_pdf.py` — implement `find_image()`
- Modify: `/app/tests/test_generate_pdf.py` — add tests for `find_image()`

**Interfaces:**
- Consumes: `IMAGE_DIR` (Path to `/app/台灣行道樹＆園藝植物/`), `EXTENSIONS` list
- Produces: `find_image(n: int, image_dir: Path) -> Path` — returns Path to existing file, raises `FileNotFoundError` if none found

- [ ] **Step 1: Write the failing tests**

Replace the `test_placeholder` function in `tests/test_generate_pdf.py` with:

```python
def test_find_image_returns_existing_path():
    path = find_image(1, IMAGE_DIR)
    assert path.exists()
    assert path.stem == "1"


def test_find_image_finds_all_36():
    for n in range(1, 37):
        path = find_image(n, IMAGE_DIR)
        assert path.exists(), f"Missing image {n}"


def test_find_image_raises_for_missing(tmp_path):
    with pytest.raises(FileNotFoundError, match="99"):
        find_image(99, tmp_path)
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd /app && /app/.venv/bin/pytest tests/test_generate_pdf.py::test_find_image_returns_existing_path -v
```

Expected: `FAILED` with `NotImplementedError`

- [ ] **Step 3: Implement `find_image()` in `generate_pdf.py`**

Replace the `find_image` stub with:

```python
def find_image(n: int, image_dir: Path) -> Path:
    for ext in EXTENSIONS:
        p = image_dir / f"{n}.{ext}"
        if p.exists():
            return p
    raise FileNotFoundError(f"找不到第 {n} 張圖片（目錄：{image_dir}）")
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /app && /app/.venv/bin/pytest tests/ -v
```

Expected: all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add generate_pdf.py tests/test_generate_pdf.py
git commit -m "feat: implement find_image with multi-extension fallback"
```

---

### Task 3: Implement calc_image_rect()

**Files:**
- Modify: `/app/generate_pdf.py` — implement `calc_image_rect()`
- Modify: `/app/tests/test_generate_pdf.py` — add tests for `calc_image_rect()`

**Interfaces:**
- Produces: `calc_image_rect(img_w, img_h, available_w, available_h) -> tuple[float, float]` — returns `(draw_w, draw_h)` that fit within bounds while preserving aspect ratio

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_generate_pdf.py`:

```python
def test_calc_image_rect_fits_within_bounds_wide_image():
    draw_w, draw_h = calc_image_rect(1000, 500, 575, 660)
    assert draw_w <= 575 + 0.001
    assert draw_h <= 660 + 0.001


def test_calc_image_rect_fits_within_bounds_tall_image():
    draw_w, draw_h = calc_image_rect(200, 1000, 575, 660)
    assert draw_w <= 575 + 0.001
    assert draw_h <= 660 + 0.001


def test_calc_image_rect_preserves_aspect_ratio():
    draw_w, draw_h = calc_image_rect(400, 200, 575, 660)
    assert abs(draw_w / draw_h - 2.0) < 0.001


def test_calc_image_rect_uses_full_available_space():
    draw_w, draw_h = calc_image_rect(575, 660, 575, 660)
    assert abs(draw_w - 575) < 0.001
    assert abs(draw_h - 660) < 0.001
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd /app && /app/.venv/bin/pytest tests/test_generate_pdf.py::test_calc_image_rect_fits_within_bounds_wide_image -v
```

Expected: `FAILED` with `NotImplementedError`

- [ ] **Step 3: Implement `calc_image_rect()` in `generate_pdf.py`**

Replace the `calc_image_rect` stub with:

```python
def calc_image_rect(
    img_w: float, img_h: float,
    available_w: float, available_h: float,
) -> tuple[float, float]:
    """Return (draw_w, draw_h) scaled to fit within available bounds, aspect ratio preserved."""
    scale = min(available_w / img_w, available_h / img_h)
    return img_w * scale, img_h * scale
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
cd /app && /app/.venv/bin/pytest tests/ -v
```

Expected: all 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add generate_pdf.py tests/test_generate_pdf.py
git commit -m "feat: implement calc_image_rect with aspect-ratio scaling"
```

---

### Task 4: Implement generate_pdf() and run end-to-end

**Files:**
- Modify: `/app/generate_pdf.py` — implement `generate_pdf()`
- Modify: `/app/tests/test_generate_pdf.py` — add end-to-end test

**Interfaces:**
- Consumes: `find_image(n, image_dir)`, `calc_image_rect(img_w, img_h, avail_w, avail_h)`
- Produces: PDF file at `output_path` with `len(names)` pages

Layout math (A4 in ReportLab points, origin at bottom-left):
- `avail_w = PAGE_W - 2 * PADDING` = 575 pt
- `img_top_y = PAGE_H - PADDING` = 832 pt (top of image area from bottom)
- `text_zone_top = PAGE_H - PADDING - MAX_IMG_H` = 172 pt
- `text_zone_bottom = PADDING` = 10 pt
- `text_center_y = (text_zone_top + text_zone_bottom) / 2` = 91 pt
- Image bottom-left: x = `PADDING + (avail_w - draw_w) / 2`, y = `img_top_y - draw_h`
- Text baseline: y = `text_center_y - TEXT_FONT_SIZE / 2`

- [ ] **Step 1: Write the failing end-to-end test**

Append to `tests/test_generate_pdf.py`:

```python
def test_generate_pdf_creates_file_with_content(tmp_path):
    out = tmp_path / "test.pdf"
    generate_pdf(IMAGE_DIR, PLANTS[:3], out)
    assert out.exists()
    assert out.stat().st_size > 10_000  # at least 10 KB for 3 real image pages


def test_plants_list_has_36_entries():
    assert len(PLANTS) == 36
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd /app && /app/.venv/bin/pytest tests/test_generate_pdf.py::test_generate_pdf_creates_file_with_content -v
```

Expected: `FAILED` with `NotImplementedError`

- [ ] **Step 3: Implement `generate_pdf()` in `generate_pdf.py`**

Replace the `generate_pdf` stub with:

```python
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
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
cd /app && /app/.venv/bin/pytest tests/ -v
```

Expected: all 9 tests pass

- [ ] **Step 5: Run the full script to generate the PDF**

```bash
cd /app && /app/.venv/bin/python3 generate_pdf.py
```

Expected output:
```
輸出：/app/台灣行道樹＆園藝植物.pdf（36 頁）
```

- [ ] **Step 6: Verify the PDF exists and is a reasonable size**

```bash
ls -lh "/app/台灣行道樹＆園藝植物.pdf"
```

Expected: file exists, size > 1 MB (36 pages with full-resolution images)

- [ ] **Step 7: Commit**

```bash
git add generate_pdf.py tests/test_generate_pdf.py
git commit -m "feat: implement generate_pdf and produce 36-page plant PDF"
```
