"""
Enforce: board module is read-only projection — no mutations or transitions.
"""
import re

from django.test import SimpleTestCase

from tests.architecture._helpers import APPS_ROOT, iter_python_files

MUTATION_PATTERNS = [
    re.compile(r"\.save\("),
    re.compile(r"\.delete\("),
    re.compile(r"\.update\("),
    re.compile(r"\.create\("),
    re.compile(r"TransitionService"),
    re.compile(r"apply_status_change"),
]


class BoardReadOnlyTests(SimpleTestCase):
    def test_board_has_no_mutation_logic(self):
        board_dir = APPS_ROOT / "board"
        if not board_dir.exists():
            self.skipTest("board app not yet created — check deferred to Phase 9")

        violations = []
        for path in iter_python_files("board"):
            if "test" in path.name:
                continue
            content = path.read_text(encoding="utf-8")
            for pattern in MUTATION_PATTERNS:
                if pattern.search(content):
                    violations.append(f"{path}: contains {pattern.pattern}")

        self.assertEqual(
            violations,
            [],
            "Board module must be read-only:\n" + "\n".join(violations),
        )

    def test_board_urls_are_get_only(self):
        urls_file = APPS_ROOT / "board" / "api" / "urls.py"
        if not urls_file.exists():
            self.skipTest("board api/urls.py not yet created")

        content = urls_file.read_text(encoding="utf-8")
        self.assertNotIn("POST", content, "Board must not expose POST endpoints")
        self.assertNotIn("PATCH", content, "Board must not expose PATCH endpoints")
        self.assertNotIn("DELETE", content, "Board must not expose DELETE endpoints")
