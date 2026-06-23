import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from generate_pdf import find_image, calc_image_rect, generate_pdf, IMAGE_DIR, PLANTS


def test_placeholder():
    pass
