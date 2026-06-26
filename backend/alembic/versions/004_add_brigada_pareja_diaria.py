"""Add daily brigada and pareja fields

Revision ID: 004_add_brigada_pareja_diaria
Revises: 003_add_configuracion_columns
Create Date: 2026-06-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004_add_brigada_pareja_diaria"
down_revision: Union[str, Sequence[str], None] = "003_add_configuracion_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "control_brigadas_diario",
        sa.Column("brigada", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "control_brigadas_diario",
        sa.Column("pareja", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("control_brigadas_diario", "pareja")
    op.drop_column("control_brigadas_diario", "brigada")
