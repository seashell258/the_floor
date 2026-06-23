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
