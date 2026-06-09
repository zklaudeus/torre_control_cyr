from sqlalchemy import Column, Integer, String, Boolean, Date, Time, Text, DateTime, text, UniqueConstraint
from app.core.database import Base

class ReporteCYR(Base):
    __tablename__ = "reportes_cyr"

    id = Column(Integer, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False, unique=True, index=True)
    estado = Column(String(50), nullable=False, default='borrador')
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

class ControlBrigadasDiario(Base):
    __tablename__ = "control_brigadas_diario"

    id = Column(Integer, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False)
    zona = Column(String(100), nullable=False)
    codigo_sap = Column(String(50))
    patente = Column(String(50))
    usuario = Column(String(100))
    tipo_brigada = Column(String(50))
    estado_brigada = Column(String(50))
    hora_primer_movimiento = Column(Time)
    observacion_brigada = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

class ControlProgramacionZona(Base):
    __tablename__ = "control_programacion_zona"

    id = Column(Integer, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False)
    zona = Column(String(100), nullable=False)
    reconexiones_programadas = Column(Integer, default=0)
    asignacion_carga = Column(Integer, default=0)
    corte_programado = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'zona', name='uq_programacion_fecha_zona'),
    )

class ControlParametrosZona(Base):
    __tablename__ = "control_parametros_zona"

    id = Column(Integer, primary_key=True, index=True)
    zona = Column(String(100), nullable=False, unique=True)
    brigadas_contrato = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

class ControlParametrosGenerales(Base):
    __tablename__ = "control_parametros_generales"

    id = Column(Integer, primary_key=True, index=True)
    meta_diaria_cortes_brigada = Column(Integer, default=30)
    hora_inicio_jornada = Column(Time, default='08:00')
    hora_cierre_jornada = Column(Time, default='14:00')
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

class ControlResultadosRealesZona(Base):
    __tablename__ = "control_resultados_reales_zona"

    id = Column(Integer, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False)
    zona = Column(String(100), nullable=False)
    total_reconexiones_ejecutadas = Column(Integer, default=0)
    total_cortes = Column(Integer, default=0)
    corte_en_poste = Column(Integer, default=0)
    corte_en_empalme = Column(Integer, default=0)
    visita_fallida = Column(Integer, default=0)
    primer_corte = Column(Time)
    ultimo_corte = Column(Time)
    acum_09 = Column(Integer, default=0)
    acum_10 = Column(Integer, default=0)
    acum_11 = Column(Integer, default=0)
    acum_12 = Column(Integer, default=0)
    acum_13 = Column(Integer, default=0)
    acum_14 = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'zona', name='uq_resultados_fecha_zona'),
    )
