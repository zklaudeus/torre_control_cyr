import { useState, useCallback, useEffect } from 'react';
import { getConfiguracion, saveConfiguracion } from '../api/parametrosConfiguracion.api';
import type { ConfiguracionCompleta } from '../types/parametrosConfiguracion';

export const useParametrosConfiguracion = () => {
  const [config, setConfig] = useState<ConfiguracionCompleta | null>(null);
  const [originalConfig, setOriginalConfig] = useState<ConfiguracionCompleta | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConfiguracion();
      setConfig(JSON.parse(JSON.stringify(data))); // Deep copy
      setOriginalConfig(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      console.error(err);
      setError('Error al cargar la configuración.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const isDirty = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const handleChangeGenerales = (field: keyof ConfiguracionCompleta['generales'], value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      generales: { ...config.generales, [field]: value }
    });
  };

  const handleChangeAutomatizacion = (field: keyof ConfiguracionCompleta['automatizacion'], value: boolean) => {
    if (!config) return;
    setConfig({
      ...config,
      automatizacion: { ...config.automatizacion, [field]: value }
    });
  };

  const handleChangePxq = (zona: string, field: keyof ConfiguracionCompleta['pxq'][0], value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      pxq: config.pxq.map(z => z.zona === zona ? { ...z, [field]: value } : z)
    });
  };

  const handleChangeCf = (zona: string, field: keyof ConfiguracionCompleta['cf'][0], value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      cf: config.cf.map(z => z.zona === zona ? { ...z, [field]: value } : z)
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await saveConfiguracion(config);
      setOriginalConfig(JSON.parse(JSON.stringify(config)));
      setSuccess('Configuración guardada correctamente.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalConfig) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
      setError(null);
      setSuccess(null);
    }
  };

  return {
    config,
    loading,
    saving,
    error,
    success,
    isDirty,
    handleChangeGenerales,
    handleChangeAutomatizacion,
    handleChangePxq,
    handleChangeCf,
    handleSave,
    handleCancel,
    fetchConfig
  };
};
