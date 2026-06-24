from sqlalchemy import Column, Integer, BigInteger, Numeric, String, Boolean, Date, Time, Text, DateTime, text, UniqueConstraint, CheckConstraint, Index, ForeignKey, ForeignKeyConstraint
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
    total_cortes = Column(Integer, default=0)
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
    corte_fuera_de_rango = Column(Integer, default=0)
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
    patente_habitual = Column(String(50), nullable=True)
    brigada = Column(String(100), nullable=True)
    pareja = Column(String(100), nullable=True)
    comuna_habitual = Column(String(100), nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        UniqueConstraint('supervisor_id', 'codigo_sap', name='uq_supervisor_sap'),
        UniqueConstraint('supervisor_id', 'cuenta', name='uq_supervisor_cuenta'),
        Index('uq_control_supervisor_sap_codigo_activo', 'codigo_sap', unique=True, postgresql_where=text('activo IS TRUE')),
    )

class ControlUsuarios(Base):
    __tablename__ = "control_usuarios"

    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False, default='supervisor')
    supervisor_id = Column(Integer, nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime(timezone=True), server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))





# ==============================================================================
# MÓDULO DE PRODUCTIVIDAD Y RENDIMIENTO TÉCNICO
# ==============================================================================
class BitacoraSupervisorDiaria(Base):
    __tablename__ = "bitacoras_supervisor_diarias"

    id = Column(BigInteger, primary_key=True)
    fecha_operacional = Column(Date, nullable=False)
    supervisor_id = Column(Integer, ForeignKey("control_supervisores.id", ondelete="RESTRICT"), nullable=False)
    estado = Column(String(50), nullable=False, default='ABIERTA', server_default=text("'ABIERTA'"))
    fecha_apertura = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    fecha_cierre = Column(DateTime(timezone=True), nullable=True)
    cerrada_por_id = Column(Integer, ForeignKey("control_usuarios.id", ondelete="RESTRICT"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'supervisor_id', name='uq_bitacora_fecha_sup'),
        UniqueConstraint('id', 'supervisor_id', name='uq_bitacora_id_sup'),
        CheckConstraint("estado IN ('ABIERTA', 'CERRADA_TC')", name='chk_bitacora_estado'),
        CheckConstraint("(estado = 'CERRADA_TC' AND fecha_cierre IS NOT NULL AND cerrada_por_id IS NOT NULL) OR (estado = 'ABIERTA' AND fecha_cierre IS NULL AND cerrada_por_id IS NULL)", name='chk_bitacora_cierre_consistente'),
    )

class RendimientoTecnicoAusencia(Base):
    __tablename__ = "rendimiento_tecnico_ausencias"

    id = Column(BigInteger, primary_key=True)
    codigo_sap = Column(String(50), nullable=False)
    fecha_operacional = Column(Date, nullable=False)
    causa = Column(String(100), nullable=False)
    registrada_por_id = Column(Integer, ForeignKey("control_usuarios.id", ondelete="RESTRICT"), nullable=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        UniqueConstraint('codigo_sap', 'fecha_operacional', name='uq_ausencia_sap_fecha'),
        UniqueConstraint('id', 'codigo_sap', 'fecha_operacional', name='uq_ausencia_id_sap_fecha'),
        CheckConstraint("causa IN ('PERMISO', 'LICENCIA', 'VACACIONES', 'MAESTRO', 'NO_REPORTADO', 'OTRO')", name='chk_ausencia_causa'),
    )

class RendimientoTecnicoDiario(Base):
    __tablename__ = "rendimiento_tecnico_diario"

    id = Column(BigInteger, primary_key=True)
    fecha_operacional = Column(Date, nullable=False)
    codigo_sap = Column(String(50), nullable=False)
    usuario = Column(String(100), nullable=False)
    supervisor_id = Column(Integer, ForeignKey("control_supervisores.id", ondelete="RESTRICT"), nullable=True)
    zona = Column(String(100), nullable=True)
    tipo_brigada = Column(String(50), nullable=True)

    corte_en_poste = Column(Integer, nullable=False, default=0, server_default=text('0'))
    corte_en_empalme = Column(Integer, nullable=False, default=0, server_default=text('0'))
    corte_fuera_de_rango = Column(Integer, nullable=False, default=0, server_default=text('0'))
    visita_fallida = Column(Integer, nullable=False, default=0, server_default=text('0'))
    reconexiones = Column(Integer, nullable=False, default=0, server_default=text('0'))
    cortes_productivos = Column(Integer, nullable=False, default=0, server_default=text('0'))

    meta_aplicada = Column(Integer, nullable=False)
    cumplimiento_pct = Column(Numeric(7, 2), nullable=False)
    es_evaluable = Column(Boolean, nullable=False, default=True, server_default=text('true'))
    estado_diario = Column(String(50), nullable=True)
    motivo_no_evaluable = Column(String(100), nullable=True)
    ausencia_id = Column(BigInteger, nullable=True)
    bitacora_id = Column(BigInteger, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'codigo_sap', name='uq_rendimiento_fecha_sap'),
        UniqueConstraint('id', 'codigo_sap', 'fecha_operacional', name='uq_rendimiento_id_sap_fecha'),
        ForeignKeyConstraint(
            ['ausencia_id', 'codigo_sap', 'fecha_operacional'],
            ['rendimiento_tecnico_ausencias.id', 'rendimiento_tecnico_ausencias.codigo_sap', 'rendimiento_tecnico_ausencias.fecha_operacional'],
            name='fk_rendimiento_ausencia_consistente',
        ),
        ForeignKeyConstraint(
            ['bitacora_id', 'supervisor_id'],
            ['bitacoras_supervisor_diarias.id', 'bitacoras_supervisor_diarias.supervisor_id'],
            name='fk_rendimiento_bitacora_consistente',
        ),
        Index('idx_rendimiento_sap_fecha', 'codigo_sap', 'fecha_operacional'),
        Index('idx_rendimiento_sup_fecha', 'supervisor_id', 'fecha_operacional'),
        Index('idx_rendimiento_zona_fecha', 'zona', 'fecha_operacional'),
        CheckConstraint('corte_en_poste >= 0', name='chk_corte_poste_pos'),
        CheckConstraint('corte_en_empalme >= 0', name='chk_corte_empalme_pos'),
        CheckConstraint('corte_fuera_de_rango >= 0', name='chk_corte_fdr_pos'),
        CheckConstraint('visita_fallida >= 0', name='chk_fallida_pos'),
        CheckConstraint('reconexiones >= 0', name='chk_recon_pos'),
        CheckConstraint('cortes_productivos >= 0', name='chk_cortes_prod_pos'),
        CheckConstraint('cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango', name='chk_cortes_prod_formula'),
        CheckConstraint('meta_aplicada > 0', name='chk_meta_pos'),
        CheckConstraint('cumplimiento_pct >= 0', name='chk_cump_pos'),
        CheckConstraint("tipo_brigada IS NULL OR tipo_brigada IN ('PXQ', 'CF')", name='chk_rendimiento_tipo_brigada'),
        CheckConstraint("estado_diario IS NULL OR estado_diario IN ('CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')", name='chk_estado_diario_val'),
        CheckConstraint("(es_evaluable AND estado_diario IS NOT NULL AND motivo_no_evaluable IS NULL AND ausencia_id IS NULL AND bitacora_id IS NOT NULL AND supervisor_id IS NOT NULL AND tipo_brigada IS NOT NULL) OR (NOT es_evaluable AND estado_diario IS NULL AND motivo_no_evaluable IS NOT NULL)", name='chk_rendimiento_evaluabilidad'),
    )

class RendimientoTecnicoActual(Base):
    __tablename__ = "rendimiento_tecnico_actual"

    codigo_sap = Column(String(50), primary_key=True)
    fase_actual = Column(Integer, nullable=False, default=1, server_default=text('1'))
    estado_productivo_actual = Column(String(50), nullable=False, default='SIN_EVALUACION', server_default=text("'SIN_EVALUACION'"))
    dias_consecutivos_bajo_50 = Column(Integer, nullable=False, default=0, server_default=text('0'))
    dias_consecutivos_alto_desempeno = Column(Integer, nullable=False, default=0, server_default=text('0'))
    advertencias_fase2 = Column(Integer, nullable=False, default=0, server_default=text('0'))
    fecha_ultima_evaluacion = Column(Date, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        CheckConstraint('fase_actual IN (1, 2, 3)', name='chk_fase_actual_val'),
        CheckConstraint("estado_productivo_actual IN ('SIN_EVALUACION', 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')", name='chk_estado_actual_val'),
        CheckConstraint('dias_consecutivos_bajo_50 >= 0', name='chk_dias_bajo_50_pos'),
        CheckConstraint('dias_consecutivos_alto_desempeno >= 0', name='chk_dias_alto_desemp_pos'),
        CheckConstraint('advertencias_fase2 >= 0', name='chk_adv_fase2_pos'),
    )

class RendimientoTecnicoHistorial(Base):
    __tablename__ = "rendimiento_tecnico_historial"

    id = Column(BigInteger, primary_key=True)
    codigo_sap = Column(String(50), nullable=False)
    fecha_cambio = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    tipo_cambio = Column(String(50), nullable=False)
    fase_anterior = Column(Integer, nullable=True)
    fase_nueva = Column(Integer, nullable=True)
    estado_anterior = Column(String(50), nullable=True)
    estado_nuevo = Column(String(50), nullable=True)
    motivo = Column(Text, nullable=True)
    usuario_id = Column(Integer, ForeignKey("control_usuarios.id", ondelete="RESTRICT"), nullable=True)
    regla_disparadora = Column(String(100), nullable=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        Index('idx_rendimiento_hist_sap_fecha', 'codigo_sap', 'fecha_cambio'),
        CheckConstraint("tipo_cambio IN ('FASE', 'ESTADO_ACTUAL', 'OVERRIDE_MANUAL', 'ADVERTENCIA', 'RECALCULO')", name='chk_tipo_cambio_val'),
        CheckConstraint('fase_anterior IS NULL OR fase_anterior IN (1, 2, 3)', name='chk_fase_anterior_val'),
        CheckConstraint('fase_nueva IS NULL OR fase_nueva IN (1, 2, 3)', name='chk_fase_nueva_val'),
        CheckConstraint("estado_anterior IS NULL OR estado_anterior IN ('SIN_EVALUACION', 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')", name='chk_estado_anterior_val'),
        CheckConstraint("estado_nuevo IS NULL OR estado_nuevo IN ('SIN_EVALUACION', 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')", name='chk_estado_nuevo_val'),
        CheckConstraint("tipo_cambio <> 'OVERRIDE_MANUAL' OR usuario_id IS NOT NULL", name='chk_override_usuario'),
    )

class RendimientoTecnicoAdvertencia(Base):
    __tablename__ = "rendimiento_tecnico_advertencias"

    id = Column(BigInteger, primary_key=True)
    codigo_sap = Column(String(50), nullable=False)
    fecha_operacional = Column(Date, nullable=False)
    fase_al_momento = Column(Integer, nullable=False, default=2, server_default=text('2'))
    numero_advertencia = Column(Integer, nullable=True)
    motivo = Column(Text, nullable=False)
    estado = Column(String(50), nullable=False, default='ACTIVA', server_default=text("'ACTIVA'"))
    registrada_por_id = Column(Integer, ForeignKey("control_usuarios.id", ondelete="RESTRICT"), nullable=False)
    fecha_registro = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    anulada_por_id = Column(Integer, ForeignKey("control_usuarios.id", ondelete="RESTRICT"), nullable=True)
    fecha_anulacion = Column(DateTime(timezone=True), nullable=True)
    motivo_anulacion = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        Index('idx_rendimiento_adv_sap_estado_fase', 'codigo_sap', 'estado', 'fase_al_momento'),
        CheckConstraint("estado IN ('ACTIVA', 'ANULADA')", name='chk_adv_estado'),
        CheckConstraint('fase_al_momento IN (1, 2, 3)', name='chk_adv_fase'),
        CheckConstraint('numero_advertencia IS NULL OR numero_advertencia >= 1', name='chk_adv_numero_pos'),
        CheckConstraint("(estado = 'ANULADA' AND anulada_por_id IS NOT NULL AND fecha_anulacion IS NOT NULL AND motivo_anulacion IS NOT NULL) OR (estado = 'ACTIVA' AND anulada_por_id IS NULL AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)", name='chk_adv_anulacion_consistente'),
    )

class RendimientoTecnicoCausaFallida(Base):
    __tablename__ = "rendimiento_tecnico_causas_fallidas"

    id = Column(BigInteger, primary_key=True)
    fecha_operacional = Column(Date, nullable=False)
    codigo_sap = Column(String(50), nullable=False)
    rendimiento_diario_id = Column(BigInteger, nullable=True)
    causa_fallida = Column(String(200), nullable=False)
    cantidad = Column(Integer, nullable=False)
    observacion = Column(Text, nullable=True)
    origen = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'codigo_sap', 'causa_fallida', name='uq_fallida_fecha_sap_causa'),
        ForeignKeyConstraint(
            ['rendimiento_diario_id', 'codigo_sap', 'fecha_operacional'],
            ['rendimiento_tecnico_diario.id', 'rendimiento_tecnico_diario.codigo_sap', 'rendimiento_tecnico_diario.fecha_operacional'],
            name='fk_fallidas_rendimiento_consistente',
        ),
        Index('idx_fallida_sap_fecha', 'codigo_sap', 'fecha_operacional'),
        Index('idx_fallida_causa', 'causa_fallida'),
        Index('idx_fallida_rendimiento_id', 'rendimiento_diario_id'),
        CheckConstraint('cantidad > 0', name='chk_fallida_cantidad_pos'),
    )
