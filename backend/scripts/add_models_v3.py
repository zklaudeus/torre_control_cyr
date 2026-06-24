new_models = """
# ==============================================================================
# MÓDULO DE PRODUCTIVIDAD Y RENDIMIENTO TÉCNICO
# ==============================================================================
from sqlalchemy import ForeignKey

class BitacoraSupervisorDiaria(Base):
    __tablename__ = "bitacoras_supervisor_diarias"

    id = Column(BigInteger, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False)
    supervisor_id = Column(BigInteger, nullable=False)
    estado = Column(String(50), nullable=False, default='ABIERTA')
    fecha_apertura = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    fecha_cierre = Column(DateTime(timezone=True), nullable=True)
    cerrada_por_id = Column(BigInteger, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'supervisor_id', name='uq_bitacora_fecha_sup'),
        CheckConstraint("estado IN ('ABIERTA', 'CERRADA_TC')", name='chk_bitacora_estado'),
        CheckConstraint("(estado = 'CERRADA_TC' AND fecha_cierre IS NOT NULL AND cerrada_por_id IS NOT NULL) OR (estado = 'ABIERTA' AND fecha_cierre IS NULL AND cerrada_por_id IS NULL)", name='chk_bitacora_cierre_consistente'),
    )

class RendimientoTecnicoAusencia(Base):
    __tablename__ = "rendimiento_tecnico_ausencias"

    id = Column(BigInteger, primary_key=True, index=True)
    codigo_sap = Column(String(50), nullable=False)
    fecha_operacional = Column(Date, nullable=False)
    causa = Column(String(100), nullable=False)
    registrada_por_id = Column(BigInteger, nullable=False)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        UniqueConstraint('codigo_sap', 'fecha_operacional', name='uq_ausencia_sap_fecha'),
        CheckConstraint("causa IN ('PERMISO', 'LICENCIA', 'VACACIONES', 'MAESTRO', 'NO_REPORTADO', 'OTRO')", name='chk_ausencia_causa'),
    )

class RendimientoTecnicoDiario(Base):
    __tablename__ = "rendimiento_tecnico_diario"

    id = Column(BigInteger, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False)
    codigo_sap = Column(String(50), nullable=False)
    usuario = Column(String(100), nullable=False)
    supervisor_id = Column(BigInteger, nullable=True)
    zona = Column(String(100), nullable=True)
    tipo_brigada = Column(String(50), nullable=True)
    
    corte_en_poste = Column(Integer, nullable=False, default=0)
    corte_en_empalme = Column(Integer, nullable=False, default=0)
    corte_fuera_de_rango = Column(Integer, nullable=False, default=0)
    visita_fallida = Column(Integer, nullable=False, default=0)
    reconexiones = Column(Integer, nullable=False, default=0)
    cortes_productivos = Column(Integer, nullable=False, default=0)
    
    meta_aplicada = Column(Integer, nullable=False)
    cumplimiento_pct = Column(Numeric(7, 2), nullable=False)
    es_evaluable = Column(Boolean, nullable=False, default=True)
    estado_diario = Column(String(50), nullable=True)
    motivo_no_evaluable = Column(String(100), nullable=True)
    ausencia_id = Column(BigInteger, ForeignKey("rendimiento_tecnico_ausencias.id"), nullable=True)
    bitacora_id = Column(BigInteger, ForeignKey("bitacoras_supervisor_diarias.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'codigo_sap', name='uq_rendimiento_fecha_sap'),
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
        CheckConstraint("estado_diario IS NULL OR estado_diario IN ('CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')", name='chk_estado_diario_val'),
    )

class RendimientoTecnicoActual(Base):
    __tablename__ = "rendimiento_tecnico_actual"

    codigo_sap = Column(String(50), primary_key=True)
    fase_actual = Column(Integer, nullable=False, default=1)
    estado_productivo_actual = Column(String(50), nullable=False, default='SIN_EVALUACION')
    dias_consecutivos_bajo_50 = Column(Integer, nullable=False, default=0)
    dias_consecutivos_alto_desempeno = Column(Integer, nullable=False, default=0)
    advertencias_fase2 = Column(Integer, nullable=False, default=0)
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

    id = Column(BigInteger, primary_key=True, index=True)
    codigo_sap = Column(String(50), nullable=False)
    fecha_cambio = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    tipo_cambio = Column(String(50), nullable=False)
    fase_anterior = Column(Integer, nullable=True)
    fase_nueva = Column(Integer, nullable=True)
    estado_anterior = Column(String(50), nullable=True)
    estado_nuevo = Column(String(50), nullable=True)
    motivo = Column(Text, nullable=True)
    usuario_id = Column(BigInteger, nullable=True)
    regla_disparadora = Column(String(100), nullable=False)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        Index('idx_rendimiento_hist_sap_fecha', 'codigo_sap', 'fecha_cambio'),
        CheckConstraint("tipo_cambio IN ('FASE', 'ESTADO_ACTUAL', 'OVERRIDE_MANUAL', 'ADVERTENCIA', 'RECALCULO')", name='chk_tipo_cambio_val'),
        CheckConstraint('fase_anterior IS NULL OR fase_anterior IN (1, 2, 3)', name='chk_fase_anterior_val'),
        CheckConstraint('fase_nueva IS NULL OR fase_nueva IN (1, 2, 3)', name='chk_fase_nueva_val'),
    )

class RendimientoTecnicoAdvertencia(Base):
    __tablename__ = "rendimiento_tecnico_advertencias"

    id = Column(BigInteger, primary_key=True, index=True)
    codigo_sap = Column(String(50), nullable=False)
    fecha_operacional = Column(Date, nullable=False)
    fase_al_momento = Column(Integer, nullable=False, default=2)
    numero_advertencia = Column(Integer, nullable=True)
    motivo = Column(Text, nullable=False)
    estado = Column(String(50), nullable=False, default='ACTIVA')
    registrada_por_id = Column(BigInteger, nullable=False)
    fecha_registro = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    anulada_por_id = Column(BigInteger, nullable=True)
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

    id = Column(BigInteger, primary_key=True, index=True)
    fecha_operacional = Column(Date, nullable=False)
    codigo_sap = Column(String(50), nullable=False)
    rendimiento_diario_id = Column(BigInteger, ForeignKey("rendimiento_tecnico_diario.id"), nullable=True)
    causa_fallida = Column(String(200), nullable=False)
    cantidad = Column(Integer, nullable=False)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))

    __table_args__ = (
        UniqueConstraint('fecha_operacional', 'codigo_sap', 'causa_fallida', name='uq_fallida_fecha_sap_causa'),
        Index('idx_fallida_sap_fecha', 'codigo_sap', 'fecha_operacional'),
        CheckConstraint('cantidad >= 0', name='chk_fallida_cantidad_pos'),
    )
"""

filepath = r"c:\Users\claud\Desktop\TorreDeControl\backend\app\models\cyr_models.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

idx = content.find("# ==============================================================================\n# MÓDULO DE PRODUCTIVIDAD Y RENDIMIENTO TÉCNICO")
if idx != -1:
    content = content[:idx] + new_models
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Models overwritten with V3.")
else:
    print("Marker not found in cyr_models.py")
