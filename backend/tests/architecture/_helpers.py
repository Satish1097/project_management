"""
Shared utilities for architecture enforcement tests.
"""
import ast
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
APPS_ROOT = BACKEND_ROOT / "apps"

# Modules allowed as cross-cutting dependencies
ALLOWED_CROSS_MODULE = {"foundation", "contracts", "permissions"}

# Legacy apps preserved for compatibility — excluded from boundary checks
LEGACY_APPS = {
    "accounts",
    "organizations",
    "projects",
    "issues",
    "sprints",
    "workflow",
    "comments",
    "activities",
    "common",
}

# Target modular apps (enforced once they exist)
MODULAR_APPS = {
    "auth",
    "identity",
    "workspace",
    "project",
    "project_settings_members",
    "workflow",
    "label",
    "sprint",
    "issue",
    "board",
    "mytasks",
    "issue_detail",
    "activity",
    "notification",
    "search",
    "dashboard",
    "integrations",
}


def iter_python_files(app_name=None):
    root = APPS_ROOT / app_name if app_name else APPS_ROOT
    if not root.exists():
        return
    for path in root.rglob("*.py"):
        if "__pycache__" in path.parts:
            continue
        yield path


def get_app_name_from_path(path: Path) -> str | None:
    try:
        rel = path.relative_to(APPS_ROOT)
        return rel.parts[0]
    except ValueError:
        return None


def extract_imports(path: Path) -> list[str]:
    try:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(path))
    except SyntaxError:
        return []

    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.append(node.module)
    return imports


def resolve_apps_import(module: str) -> str | None:
    """Return target app name from 'apps.<name>...' import, or None."""
    if not module.startswith("apps."):
        return None
    parts = module.split(".")
    return parts[1] if len(parts) > 1 else None
