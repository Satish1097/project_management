"""Verify foundation public import paths stay stable across phases."""


def test_base_model_import_from_models_package():
    from apps.foundation.models import BaseModel

    assert BaseModel._meta.abstract is True


def test_soft_delete_manager_import_from_models_package():
    from apps.foundation.models import SoftDeleteManager

    assert SoftDeleteManager is not None
