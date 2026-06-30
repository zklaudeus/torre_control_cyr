"""add user zone access

Revision ID: f6a1b2c3d4e5
Revises: e88cd9c1e280
Create Date: 2026-06-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a1b2c3d4e5"
down_revision: Union[str, Sequence[str], None] = "e88cd9c1e280"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("control_usuarios", sa.Column("nombre", sa.String(length=150), nullable=True))
    op.add_column("control_usuarios", sa.Column("email", sa.String(length=150), nullable=True))
    op.create_unique_constraint("uq_control_usuarios_email", "control_usuarios", ["email"])
    op.execute("UPDATE control_usuarios SET nombre = usuario WHERE nombre IS NULL")

    op.create_table(
        "user_zone_access",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("zona", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["control_usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "zona", name="uq_user_zone_access_user_zona"),
    )
    op.create_index("idx_user_zone_access_user_id", "user_zone_access", ["user_id"], unique=False)
    op.create_index("idx_user_zone_access_zona", "user_zone_access", ["zona"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_user_zone_access_zona", table_name="user_zone_access")
    op.drop_index("idx_user_zone_access_user_id", table_name="user_zone_access")
    op.drop_table("user_zone_access")
    op.drop_constraint("uq_control_usuarios_email", "control_usuarios", type_="unique")
    op.drop_column("control_usuarios", "email")
    op.drop_column("control_usuarios", "nombre")

