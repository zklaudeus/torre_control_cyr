"""
Modelos de dominio (maestros y relaciones).
Convivir con legacy — sin retirar tablas actuales.
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint, Index, text
)
from app.core.database import Base


class DimZona(Base):
    __tablename__ = "dim_zona"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    codigo = Column(String(20), nullable=True, comment="Código corto opcional")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))


class DimComuna(Base):
    __tablename__ = "dim_comuna"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    zona_id = Column(Integer, ForeignKey("dim_zona.id", ondelete="RESTRICT"), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        Index("idx_dim_comuna_zona", "zona_id"),
    )


class DimSap(Base):
    __tablename__ = "dim_sap"

    id = Column(Integer, primary_key=True, index=True)
    codigo_sap = Column(String(50), nullable=False, unique=True)
    cuenta = Column(String(100), nullable=False)
    tipo_brigada = Column(String(50), nullable=False, default='PXQ')
    activo = Column(Boolean, default=True)
    validado = Column(Boolean, default=False, comment="True si un supervisor confirmó el dato")
    fecha_validacion = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        CheckConstraint("tipo_brigada IN ('PXQ', 'CF')", name="chk_dim_sap_tipo_brigada"),
    )


class RltSupervisorZona(Base):
    """Relación limpia supervisor ↔ zona (reemplazo gradual de control_supervisor_comunas_zonas)."""
    __tablename__ = "rlt_supervisor_zona"

    id = Column(Integer, primary_key=True, index=True)
    supervisor_id = Column(Integer, ForeignKey("control_supervisores.id", ondelete="RESTRICT"), nullable=False)
    zona_id = Column(Integer, ForeignKey("dim_zona.id", ondelete="RESTRICT"), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint("supervisor_id", "zona_id", name="uq_rlt_sup_zona"),
        Index("idx_rlt_sup_zona_supervisor", "supervisor_id"),
        Index("idx_rlt_sup_zona_zona", "zona_id"),
    )


class RltSupervisorSap(Base):
    """Relación limpia supervisor ↔ SAP (reemplazo gradual de control_supervisor_usuarios_sap)."""
    __tablename__ = "rlt_supervisor_sap"

    id = Column(Integer, primary_key=True, index=True)
    supervisor_id = Column(Integer, ForeignKey("control_supervisores.id", ondelete="RESTRICT"), nullable=False)
    sap_id = Column(Integer, ForeignKey("dim_sap.id", ondelete="RESTRICT"), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint("supervisor_id", "sap_id", name="uq_rlt_sup_sap"),
        Index("idx_rlt_sup_sap_supervisor", "supervisor_id"),
        Index("idx_rlt_sup_sap_sap", "sap_id"),
    )
