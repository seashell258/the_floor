import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from generate_pdf import find_image, calc_image_rect, generate_pdf, IMAGE_DIR, PLANTS


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


def test_generate_pdf_creates_file_with_content(tmp_path):
    out = tmp_path / "test.pdf"
    generate_pdf(IMAGE_DIR, PLANTS[:3], out)
    assert out.exists()
    assert out.stat().st_size > 10_000  # at least 10 KB for 3 real image pages


def test_plants_list_has_36_entries():
    assert len(PLANTS) == 36
