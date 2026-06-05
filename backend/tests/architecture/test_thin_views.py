"""
Enforce: view methods stay thin (≤ 15 lines excluding serializer setup).
Business logic belongs in services/selectors.
"""
import ast

from django.test import SimpleTestCase

from tests.architecture._helpers import iter_python_files

MAX_VIEW_METHOD_LINES = 15
SERIALIZER_SETUP_NAMES = {"get_serializer", "get_serializer_class", "get_serializer_context"}


class ThinViewsTests(SimpleTestCase):
    def _count_logic_lines(self, node: ast.FunctionDef) -> int:
        logic_lines = set()
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                func = child.func
                if isinstance(func, ast.Attribute) and func.attr in SERIALIZER_SETUP_NAMES:
                    continue
            if hasattr(child, "lineno"):
                logic_lines.add(child.lineno)
        return len(logic_lines)

    def test_view_methods_are_thin(self):
        violations = []

        for path in iter_python_files():
            if "api/views" not in str(path) and path.name != "views.py":
                continue
            if "foundation" in str(path):
                continue

            try:
                tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
            except SyntaxError:
                continue

            for node in ast.walk(tree):
                if not isinstance(node, ast.FunctionDef):
                    continue
                if node.name.startswith("_"):
                    continue
                if node.name in ("get", "post", "put", "patch", "delete", "list", "create", "retrieve", "update", "destroy"):
                    line_count = self._count_logic_lines(node)
                    if line_count > MAX_VIEW_METHOD_LINES:
                        violations.append(
                            f"{path}:{node.lineno}: {node.name}() has ~{line_count} logic lines "
                            f"(max {MAX_VIEW_METHOD_LINES})"
                        )

        self.assertEqual(
            violations,
            [],
            "Fat view methods detected:\n" + "\n".join(violations),
        )
