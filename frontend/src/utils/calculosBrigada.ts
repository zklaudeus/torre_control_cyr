export const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getTotalCorteBrigada = (brigada: any): number => {
  const acumulados = [
    brigada.acum_14,
    brigada.acum_13,
    brigada.acum_12,
    brigada.acum_11,
    brigada.acum_10,
    brigada.acum_09,
  ];

  // Ignoramos 0 porque los campos vacíos se convierten en 0 en el estado
  const ultimoAcumulado = acumulados.find(
    (value) => value !== null && value !== undefined && value !== "" && Number(value) > 0
  );

  if (ultimoAcumulado !== undefined) {
    return toNumber(ultimoAcumulado);
  }

  return (
    toNumber(brigada.corte_en_poste) +
    toNumber(brigada.corte_en_empalme) +
    toNumber(brigada.corte_fuera_de_rango)
  );
};
