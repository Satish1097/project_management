import ast
import re
from pathlib import Path


LABEL_ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN_IMPORT_PREFIXES = (
    "apps.issues",
    "apps.sprints",
    "apps.workflow",
)

INLINE_ROLE_CHECK_PATTERNS = (
    re.compile(r"if\s+\w+\.role\s*=="),
    re.compile(r"if\s+\w+\.role\s+in\s*\("),
    re.compile(r"if\s+request\.user\.is_staff"),
    re.compile(r"if\s+user\.is_staff"),
)


def _iter_label_python_files():
    for path in LABEL_ROOT.rglob("*.py"):
        if "__pycache__" in path.parts or "tests" in path.parts:
            continue
        yield path


def _extract_imports(path: Path) -> list[str]:
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(path))
    modules = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            modules.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.append(node.module)
    return modules


def test_label_module_has_no_forbidden_cross_module_imports():
    violations = []

    for path in _iter_label_python_files():
        for module in _extract_imports(path):
            if module.startswith(FORBIDDEN_IMPORT_PREFIXES):
                violations.append(f"{path}: forbidden import {module}")

    assert violations == []


def test_label_module_has_no_inline_role_checks():
    violations = []

    for path in _iter_label_python_files():
        if not any(part in str(path) for part in ("api", "services", "views.py")):
            continue

        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            for pattern in INLINE_ROLE_CHECK_PATTERNS:
                if pattern.search(line):
                    violations.append(f"{path}:{lineno}: {stripped}")

    assert violations == []
