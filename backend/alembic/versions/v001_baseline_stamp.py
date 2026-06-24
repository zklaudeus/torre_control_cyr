"""v001 — Baseline de esquema existente (21 tablas legacy + 012)

Stamp inicial. No modifica la BD: el esquema ya fue creado por
los scripts SQL 001–012. Alembic marca esta revisión como cabeza
para que futuras migraciones se apilen sobre ella.

Rollback: no aplica (primera revisión).
"""
from typing import Sequence, Union
from alembic import op

revision: str = "001_baseline"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
