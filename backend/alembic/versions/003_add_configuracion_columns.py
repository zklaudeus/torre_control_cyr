"""Add missing columns to configuracion tables

Adds columns to control_parametros_zona, control_parametros_generales,
and control_parametros_cf_generales so that all frontend configuration
fields are persisted.

Revision ID: 003_add_configuracion_columns
Revises: d98a40ab6219
Create Date: 2026-06-25
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '003_add_configuracion_columns'
down_revision: Union[str, Sequence[str], None] = 'd98a40ab6219'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- control_parametros_zona ---
    op.add_column('control_parametros_zona', sa.Column('meta_diaria_cortes', sa.Integer(), server_default=sa.text('30')))
    op.add_column('control_parametros_zona', sa.Column('meta_acumulada_09', sa.Integer(), server_default=sa.text('5')))
    op.add_column('control_parametros_zona', sa.Column('meta_acumulada_10', sa.Integer(), server_default=sa.text('10')))
    op.add_column('control_parametros_zona', sa.Column('meta_acumulada_11', sa.Integer(), server_default=sa.text('15')))
    op.add_column('control_parametros_zona', sa.Column('meta_acumulada_12', sa.Integer(), server_default=sa.text('20')))
    op.add_column('control_parametros_zona', sa.Column('meta_acumulada_13', sa.Integer(), server_default=sa.text('25')))
    op.add_column('control_parametros_zona', sa.Column('meta_acumulada_14', sa.Integer(), server_default=sa.text('30')))
    op.add_column('control_parametros_zona', sa.Column('hora_inicio', sa.Time(), server_default=sa.text("'08:00'")))
    op.add_column('control_parametros_zona', sa.Column('hora_cierre', sa.Time(), server_default=sa.text("'18:00'")))

    # --- control_parametros_generales ---
    op.add_column('control_parametros_generales', sa.Column('hora_corte_gps', sa.Time(), server_default=sa.text("'16:00'")))
    op.add_column('control_parametros_generales', sa.Column('meta_diaria_reconexiones', sa.Integer(), server_default=sa.text('15')))
    op.add_column('control_parametros_generales', sa.Column('tramo_horario_inicial', sa.Time(), server_default=sa.text("'09:00'")))
    op.add_column('control_parametros_generales', sa.Column('tramo_horario_final', sa.Time(), server_default=sa.text("'14:00'")))
    op.add_column('control_parametros_generales', sa.Column('alerta_sin_brigadas', sa.Boolean(), server_default=sa.text('true')))
    op.add_column('control_parametros_generales', sa.Column('alerta_brigadas_efectivas', sa.Boolean(), server_default=sa.text('true')))
    op.add_column('control_parametros_generales', sa.Column('calcular_cumplimiento_carga', sa.Boolean(), server_default=sa.text('true')))
    op.add_column('control_parametros_generales', sa.Column('calcular_promedio_cortes', sa.Boolean(), server_default=sa.text('true')))
    op.add_column('control_parametros_generales', sa.Column('calcular_promedio_reconexiones', sa.Boolean(), server_default=sa.text('true')))
    op.add_column('control_parametros_generales', sa.Column('calcular_total_actividades', sa.Boolean(), server_default=sa.text('true')))
    op.add_column('control_parametros_generales', sa.Column('calcular_cumplimiento_promedio', sa.Boolean(), server_default=sa.text('true')))
    op.add_column('control_parametros_generales', sa.Column('generar_observacion_automatica', sa.Boolean(), server_default=sa.text('true')))

    # --- control_parametros_cf_generales ---
    op.add_column('control_parametros_cf_generales', sa.Column('meta_diaria_reconexiones', sa.Integer(), server_default=sa.text('15')))
    op.add_column('control_parametros_cf_generales', sa.Column('tramo_horario_inicial', sa.Time(), server_default=sa.text("'09:00'")))
    op.add_column('control_parametros_cf_generales', sa.Column('tramo_horario_final', sa.Time(), server_default=sa.text("'14:00'")))


def downgrade() -> None:
    # --- control_parametros_cf_generales ---
    op.drop_column('control_parametros_cf_generales', 'tramo_horario_final')
    op.drop_column('control_parametros_cf_generales', 'tramo_horario_inicial')
    op.drop_column('control_parametros_cf_generales', 'meta_diaria_reconexiones')

    # --- control_parametros_generales ---
    op.drop_column('control_parametros_generales', 'generar_observacion_automatica')
    op.drop_column('control_parametros_generales', 'calcular_cumplimiento_promedio')
    op.drop_column('control_parametros_generales', 'calcular_total_actividades')
    op.drop_column('control_parametros_generales', 'calcular_promedio_reconexiones')
    op.drop_column('control_parametros_generales', 'calcular_promedio_cortes')
    op.drop_column('control_parametros_generales', 'calcular_cumplimiento_carga')
    op.drop_column('control_parametros_generales', 'alerta_brigadas_efectivas')
    op.drop_column('control_parametros_generales', 'alerta_sin_brigadas')
    op.drop_column('control_parametros_generales', 'tramo_horario_final')
    op.drop_column('control_parametros_generales', 'tramo_horario_inicial')
    op.drop_column('control_parametros_generales', 'meta_diaria_reconexiones')
    op.drop_column('control_parametros_generales', 'hora_corte_gps')

    # --- control_parametros_zona ---
    op.drop_column('control_parametros_zona', 'hora_cierre')
    op.drop_column('control_parametros_zona', 'hora_inicio')
    op.drop_column('control_parametros_zona', 'meta_acumulada_14')
    op.drop_column('control_parametros_zona', 'meta_acumulada_13')
    op.drop_column('control_parametros_zona', 'meta_acumulada_12')
    op.drop_column('control_parametros_zona', 'meta_acumulada_11')
    op.drop_column('control_parametros_zona', 'meta_acumulada_10')
    op.drop_column('control_parametros_zona', 'meta_acumulada_09')
    op.drop_column('control_parametros_zona', 'meta_diaria_cortes')
