import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import compute_ranges


class TestForecastOrdering(unittest.TestCase):
    def test_newer_report_wins_across_month_boundary(self):
        with TemporaryDirectory() as directory:
            for filename, bounds in (
                ("30_06_2026.json", (450, 550)),
                ("01_07_2026.json", (190, 300)),
            ):
                section = {
                    "id": "pichi_picun_leufu",
                    "levels": [{"type": "programmed", "date": "2026-07-01", "min": bounds[0], "max": bounds[1]}],
                }
                (Path(directory) / filename).write_text(json.dumps({"sections": [section]}))
            with patch.object(compute_ranges, "DOCS", directory):
                _, programmed, count = compute_ranges.load_observations()

        self.assertEqual(count, 2)
        self.assertEqual(programmed["pichi_picun_leufu"]["2026-07-01"], (190, 300))
