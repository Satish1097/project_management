"""
Enforce: transition logic lives only in workflow.TransitionService
and is exposed only via POST /api/issues/{id}/transition.
"""
import re

from django.test import SimpleTestCase

from tests.architecture._helpers import APPS_ROOT, iter_python_files

TRANSITION_LOGIC_PATTERNS = [
    re.compile(r"def\s+transition_issue"),
    re.compile(r"def\s+apply_transition"),
    re.compile(r"def\s+move_issue"),
    re.compile(r"TransitionService"),
]

FORBIDDEN_TRANSITION_MODULES = {"board", "mytasks", "sprint", "dashboard"}


class TransitionCentralizationTests(SimpleTestCase):
    def test_transition_service_is_sole_authority(self):
        transition_file = (
            APPS_ROOT / "workflow" / "services" / "transition_service.py"
        )
        if not transition_file.exists():
            self.skipTest("workflow.TransitionService not yet created — Phase 6+")

        violations = []
        for app in FORBIDDEN_TRANSITION_MODULES:
            if not (APPS_ROOT / app).exists():
                continue
            for path in iter_python_files(app):
                content = path.read_text(encoding="utf-8")
                for pattern in TRANSITION_LOGIC_PATTERNS:
                    if pattern.search(content):
                        violations.append(
                            f"{path}: transition logic must live in workflow.TransitionService"
                        )

        self.assertEqual(violations, [])

    def test_no_alternate_transition_endpoints(self):
        violations = []
        forbidden_paths = [
            "board/move",
            "me/tasks",
            "board/transition",
        ]

        for path in iter_python_files():
            if "urls.py" not in path.name:
                continue
            content = path.read_text(encoding="utf-8")
            for forbidden in forbidden_paths:
                if forbidden in content and "transition" in forbidden:
                    violations.append(f"{path}: alternate transition endpoint '{forbidden}'")

        self.assertEqual(violations, [])
