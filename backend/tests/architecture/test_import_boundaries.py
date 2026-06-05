"""
Enforce: cross-module communication only via contracts, foundation, permissions.
"""
from django.test import SimpleTestCase

from tests.architecture._helpers import (
    ALLOWED_CROSS_MODULE,
    APPS_ROOT,
    LEGACY_APPS,
    MODULAR_APPS,
    extract_imports,
    get_app_name_from_path,
    iter_python_files,
    resolve_apps_import,
)


class ImportBoundaryTests(SimpleTestCase):
    def test_no_direct_cross_module_imports(self):
        violations = []

        for path in iter_python_files():
            source_app = get_app_name_from_path(path)
            if not source_app or source_app in LEGACY_APPS:
                continue
            if source_app not in MODULAR_APPS and source_app not in ALLOWED_CROSS_MODULE:
                continue

            for module in extract_imports(path):
                target_app = resolve_apps_import(module)
                if not target_app:
                    continue
                if target_app == source_app:
                    continue
                if target_app in ALLOWED_CROSS_MODULE:
                    continue
                if target_app in LEGACY_APPS:
                    continue
                if target_app in MODULAR_APPS:
                    violations.append(
                        f"{path}: imports apps.{target_app} directly — use apps.contracts instead"
                    )

        self.assertEqual(
            violations,
            [],
            "Direct cross-module imports detected:\n" + "\n".join(violations),
        )

    def test_board_must_not_import_issue_internals(self):
        if not (APPS_ROOT / "board").exists():
            self.skipTest("board app not yet created — check deferred to Phase 9")

        violations = []
        for path in iter_python_files("board"):
            for module in extract_imports(path):
                if module.startswith("apps.issue") and "contract" not in module:
                    violations.append(f"{path}: forbidden import {module}")

        self.assertEqual(violations, [])
