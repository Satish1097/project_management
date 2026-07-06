"""
Enforce: no inline role checks in views or services.
Authorization must flow through PermissionService (Phase 3+).
"""
import re

from django.test import SimpleTestCase

from tests.architecture._helpers import iter_python_files

FORBIDDEN_PATTERNS = [
    re.compile(r"if\s+\w+\.role\s*=="),
    re.compile(r"if\s+\w+\.role\s+in\s*\("),
    re.compile(r"if\s+request\.user\.is_staff"),
    re.compile(r"if\s+user\.is_staff"),
    re.compile(r'if\s+\w+\.role\s*==\s*["\']admin["\']'),
]

SCAN_DIRS = ("api", "services", "views.py")


class NoInlineRoleCheckTests(SimpleTestCase):
    def test_no_inline_role_checks_in_views_and_services(self):
        violations = []

        for path in iter_python_files():
            rel = str(path)
            if not any(part in rel for part in ("api", "services", "views.py")):
                continue

            try:
                lines = path.read_text(encoding="utf-8").splitlines()
            except OSError:
                continue

            for lineno, line in enumerate(lines, start=1):
                stripped = line.strip()
                if stripped.startswith("#"):
                    continue
                for pattern in FORBIDDEN_PATTERNS:
                    if pattern.search(line):
                        violations.append(f"{path}:{lineno}: {stripped}")

        self.assertEqual(
            violations,
            [],
            "Inline role checks detected (use PermissionService):\n" + "\n".join(violations),
        )
