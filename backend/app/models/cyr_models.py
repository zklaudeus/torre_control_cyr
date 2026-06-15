from sqlalchemy import Column, Integer, String, Boolean, Date, Time, Text, DateTime, text, UniqueConstraint, CheckConstraint
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
    # Planificación supervisor
    corte_programado = Column(Integer, default=0)
    reconexiones_programadas = Column(Integer, default=0)
    # Columnas de resultados por brigada (ajuste Fase 5.1)
    reconexiones_ejecutadas = Column(Integer, default=0)
    primer_corte = Column(Time)
    ultimo_corte = Column(Time)
    acum_09 = Column(Integer, default=0)
    acum_10 = Column(Integer, default=0)
    acum_11 = Column(Integer, default=0)
    acum_12 = Column(Integer, default=0)
    acum_13 = Column(Integer, default=0)
    acum_14 = Column(Integer, default=0)
    corte_en_poste = Column(Integer, default=0)
    corte_en_empalme = Column(Integer, default=0)
    visita_fallida = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        CheckConstraint("tipo_brigada IN ('PXQ', 'CF')", name='chk_tipo_brigada'),
    )

class ControlProgramacionZona(Base):
    __tablename__ = "control_programacion_zona"

    id = Column(Integer, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False)
    zona = Column(String(100), nullable=False)
    tipo_brigada = Column(String(50), nullable=False, default='PXQ')
    reconexiones_programadas = Column(Integer, default=0)
    asignacion_carga = Column(Integer, default=0)
    corte_programado = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'zona', 'tipo_brigada', name='uq_programacion_fecha_zona_tipo'),
        CheckConstraint("tipo_brigada IN ('PXQ', 'CF')", name='chk_prog_tipo_brigada'),
    )

class ControlParametrosZona(Base):
    __tablename__ = "control_parametros_zona"

    id = Column(Integer, primary_key=True, index=True)
    zona = Column(String(100), nullable=False)
    tipo_brigada = Column(String(50), nullable=False, default='PXQ')
    brigadas_contrato = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint('zona', 'tipo_brigada', name='uq_parametros_zona_tipo'),
        CheckConstraint("tipo_brigada IN ('PXQ', 'CF')", name='chk_param_tipo_brigada'),
    )

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

class ControlParametrosCFGenerales(Base):
    __tablename__ = "control_parametros_cf_generales"

    id = Column(Integer, primary_key=True, index=True)
    meta_diaria_cortes_brigada = Column(Integer, default=6)
    hora_inicio_jornada = Column(Time, default='08:00')
    hora_cierre_jornada = Column(Time, default='14:00')
    meta_acumulada_09 = Column(Integer, default=1)
    meta_acumulada_10 = Column(Integer, default=1)
    meta_acumulada_11 = Column(Integer, default=1)
    meta_acumulada_12 = Column(Integer, default=1)
    meta_acumulada_13 = Column(Integer, default=1)
    meta_acumulada_14 = Column(Integer, default=1)
    umbral_semaforo_logrado = Column(Integer, default=30)
    umbral_semaforo_mejora = Column(Integer, default=20)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

class ControlParametrosCFZona(Base):
    __tablename__ = "control_parametros_cf_zona"

    id = Column(Integer, primary_key=True, index=True)
    zona = Column(String(100), nullable=False, unique=True)
    brigadas_cf_contrato = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

class ControlProgramacionCFZona(Base):
    __tablename__ = "control_programacion_cf_zona"

    id = Column(Integer, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False)
    zona = Column(String(100), nullable=False)
    reconexiones_programadas = Column(Integer, default=0)
    total_reconexiones_ejecutadas = Column(Integer, default=0)
    cortes_programados = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'zona', name='uq_programacion_cf_fecha_zona'),
    )

class DimTipoBrigadaUsuario(Base):
    __tablename__ = "dim_tipo_brigada_usuario"

    id = Column(Integer, primary_key=True, index=True)
    usuario_normalizado = Column(String(100), nullable=False, unique=True)
    tipo_brigada = Column(String(50), nullable=False, default='PXQ')
    activo = Column(Boolean, default=True)
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        CheckConstraint("tipo_brigada IN ('PXQ', 'CF')", name='chk_dim_tipo_brigada'),
    )

class ControlSupervisores(Base):
    __tablename__ = "control_supervisores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

class ControlSupervisorComunasZonas(Base):
    __tablename__ = "control_supervisor_comunas_zonas"

    id = Column(Integer, primary_key=True, index=True)
    supervisor_id = Column(Integer, nullable=False)
    comuna = Column(String(100), nullable=False)
    zona_principal = Column(String(100), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint('supervisor_id', 'comuna', name='uq_supervisor_comuna'),
    )

class ControlSupervisorUsuariosSAP(Base):
    __tablename__ = "control_supervisor_usuarios_sap"

    id = Column(Integer, primary_key=True, index=True)
    supervisor_id = Column(Integer, nullable=False)
    codigo_sap = Column(String(50), nullable=False)
    cuenta = Column(String(100), nullable=False)
    tipo_brigada = Column(String(50), default='PXQ')
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint('supervisor_id', 'codigo_sap', name='uq_supervisor_sap'),
        UniqueConstraint('supervisor_id', 'cuenta', name='uq_supervisor_cuenta'),
    )
