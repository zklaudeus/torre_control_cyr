"""v002 — Maestros de dominio y relaciones limpias

Crea tablas de dimensión limpias (dim_zona, dim_comuna, dim_sap)
y tablas de relación (rlt_supervisor_zona, rlt_supervisor_sap)
que conviven con las tablas legacy sin modificarlas.

Riesgo: bajo (solo CREATE TABLE, no afecta tablas existentes).
Rollback: DROP TABLE de las 5 tablas nuevas.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002_maestros_dominio"
down_revision: Union[str, Sequence[str], None] = "001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dim_zona",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(100), nullable=False, unique=True),
        sa.Column("codigo", sa.String(20), nullable=True, comment="Código corto opcional"),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_dim_zona_nombre", "dim_zona", ["nombre"])

    op.create_table(
        "dim_comuna",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(100), nullable=False, unique=True),
        sa.Column("zona_id", sa.Integer(), sa.ForeignKey("dim_zona.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_dim_comuna_zona", "dim_comuna", ["zona_id"])
    op.create_index("ix_dim_comuna_nombre", "dim_comuna", ["nombre"])

    op.create_table(
        "dim_sap",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("codigo_sap", sa.String(50), nullable=False, unique=True),
        sa.Column("cuenta", sa.String(100), nullable=False),
        sa.Column("tipo_brigada", sa.String(50), nullable=False, server_default=sa.text("'PXQ'")),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("validado", sa.Boolean(), server_default=sa.text("false"),
                  comment="True si un supervisor confirmó el dato"),
        sa.Column("fecha_validacion", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_dim_sap_codigo", "dim_sap", ["codigo_sap"])
    op.create_index("ix_dim_sap_cuenta", "dim_sap", ["cuenta"])
    op.create_check_constraint(
        "chk_dim_sap_tipo_brigada",
        "dim_sap",
        "tipo_brigada IN ('PXQ', 'CF')",
    )

    op.create_table(
        "rlt_supervisor_zona",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("supervisor_id", sa.Integer(), sa.ForeignKey("control_supervisores.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("zona_id", sa.Integer(), sa.ForeignKey("dim_zona.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_unique_constraint("uq_rlt_sup_zona", "rlt_supervisor_zona", ["supervisor_id", "zona_id"])
    op.create_index("idx_rlt_sup_zona_supervisor", "rlt_supervisor_zona", ["supervisor_id"])
    op.create_index("idx_rlt_sup_zona_zona", "rlt_supervisor_zona", ["zona_id"])

    op.create_table(
        "rlt_supervisor_sap",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("supervisor_id", sa.Integer(), sa.ForeignKey("control_supervisores.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("sap_id", sa.Integer(), sa.ForeignKey("dim_sap.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_unique_constraint("uq_rlt_sup_sap", "rlt_supervisor_sap", ["supervisor_id", "sap_id"])
    op.create_index("idx_rlt_sup_sap_supervisor", "rlt_supervisor_sap", ["supervisor_id"])
    op.create_index("idx_rlt_sup_sap_sap", "rlt_supervisor_sap", ["sap_id"])


def downgrade() -> None:
    op.drop_table("rlt_supervisor_sap")
    op.drop_table("rlt_supervisor_zona")
    op.drop_table("dim_sap")
    op.drop_table("dim_comuna")
    op.drop_table("dim_zona")
