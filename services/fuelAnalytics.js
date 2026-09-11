import dayjs from "dayjs";

/**
 * Filtra os abastecimentos por intervalo de datas (opcional).
 * @param {Array} fuellings
 * @param {string} startDate - ISO date, inclusive
 * @param {string} endDate - ISO date, inclusive
 */
function filterByDateRange(fuellings, startDate, endDate) {
  if (!startDate && !endDate) return fuellings;
  const start = startDate ? dayjs(startDate) : null;
  const end = endDate ? dayjs(endDate) : null;
  return fuellings.filter((f) => {
    const d = dayjs(f.FuelDate);
    if (start && d.isBefore(start, "day")) return false;
    if (end && d.isAfter(end, "day")) return false;
    return true;
  });
}

/**
 * Agrupa abastecimentos por veículo.
 */
function groupByVehicle(fuellings) {
  const map = new Map();
  for (const f of fuellings) {
    const key = f.VehicleIntegrationCodeClient || f.VehicleIntegrationCodeCentral;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }
  return map;
}

/**
 * Calcula os KPIs agregados por veículo:
 * - total de litros abastecidos
 * - total gasto (R$)
 * - distância total percorrida
 * - eficiência média (km/L), considerando apenas abastecimentos com tanque cheio
 * - número de abastecimentos
 * - preço médio do litro
 */
function calcularKpisPorVeiculo(fuellings) {
  const grupos = groupByVehicle(fuellings);
  const resultado = [];

  for (const [vehicleCode, registros] of grupos.entries()) {
    const ordenados = [...registros].sort(
      (a, b) => new Date(a.FuelDate) - new Date(b.FuelDate)
    );

    const totalLitros = ordenados.reduce((s, f) => s + f.FuelAmountLiters, 0);
    const totalGasto = ordenados.reduce((s, f) => s + f.TotalPayment, 0);
    const numAbastecimentos = ordenados.length;
    const motorista =
      ordenados[ordenados.length - 1]?.DriverIntegrationCodeClient || null;

    // Distância total: soma de (Odometer - PreviusOdometer) de cada registro
    const distanciaTotal = ordenados.reduce(
      (s, f) => s + Math.max(0, f.Odometer - f.PreviusOdometer),
      0
    );

    // Eficiência só é confiável em abastecimentos com tanque cheio
    const completos = ordenados.filter((f) => f.TankComplete);
    const litrosCompletos = completos.reduce((s, f) => s + f.FuelAmountLiters, 0);
    const distanciaCompletos = completos.reduce(
      (s, f) => s + Math.max(0, f.Odometer - f.PreviusOdometer),
      0
    );
    const eficienciaMedia =
      litrosCompletos > 0 ? distanciaCompletos / litrosCompletos : null;

    const precoMedioLitro = totalLitros > 0 ? totalGasto / totalLitros : null;
    const custoPorKm = distanciaTotal > 0 ? totalGasto / distanciaTotal : null;

    resultado.push({
      vehicleCode,
      motorista,
      totalLitros: round2(totalLitros),
      totalGasto: round2(totalGasto),
      distanciaTotal: round2(distanciaTotal),
      eficienciaMedia: eficienciaMedia !== null ? round2(eficienciaMedia) : null,
      numAbastecimentos,
      precoMedioLitro: precoMedioLitro !== null ? round2(precoMedioLitro) : null,
      custoPorKm: custoPorKm !== null ? round2(custoPorKm) : null,
      ultimoAbastecimento: ordenados[ordenados.length - 1]?.FuelDate || null,
    });
  }

  return resultado;
}

/**
 * Monta os KPIs gerais da frota + rankings, prontos pro front consumir.
 */
function montarDashboard(fuellings, { startDate, endDate } = {}) {
  const filtrados = filterByDateRange(fuellings, startDate, endDate);
  const porVeiculo = calcularKpisPorVeiculo(filtrados);

  const totalLitros = round2(porVeiculo.reduce((s, v) => s + v.totalLitros, 0));
  const totalGasto = round2(porVeiculo.reduce((s, v) => s + v.totalGasto, 0));
  const totalAbastecimentos = porVeiculo.reduce((s, v) => s + v.numAbastecimentos, 0);
  const totalDistancia = round2(porVeiculo.reduce((s, v) => s + v.distanciaTotal, 0));

  const comEficiencia = porVeiculo.filter((v) => v.eficienciaMedia !== null);

  const rankingMaiorConsumo = [...porVeiculo].sort(
    (a, b) => b.totalLitros - a.totalLitros
  );
  const rankingMelhorEficiencia = [...comEficiencia].sort(
    (a, b) => b.eficienciaMedia - a.eficienciaMedia
  );
  const rankingMaisAbastecimentos = [...porVeiculo].sort(
    (a, b) => b.numAbastecimentos - a.numAbastecimentos
  );
  const rankingMaiorCusto = [...porVeiculo].sort((a, b) => b.totalGasto - a.totalGasto);

  // Série temporal: gasto e litros por dia (útil pra gráfico de linha)
  const porDiaMap = new Map();
  for (const f of filtrados) {
    const dia = dayjs(f.FuelDate).format("YYYY-MM-DD");
    if (!porDiaMap.has(dia)) porDiaMap.set(dia, { data: dia, litros: 0, gasto: 0 });
    const entry = porDiaMap.get(dia);
    entry.litros += f.FuelAmountLiters;
    entry.gasto += f.TotalPayment;
  }
  const serieTemporal = [...porDiaMap.values()]
    .sort((a, b) => (a.data > b.data ? 1 : -1))
    .map((e) => ({ ...e, litros: round2(e.litros), gasto: round2(e.gasto) }));

  return {
    resumo: {
      totalLitros,
      totalGasto,
      totalAbastecimentos,
      totalDistancia,
      totalVeiculos: porVeiculo.length,
      veiculoMaiorConsumo: rankingMaiorConsumo[0]?.vehicleCode || null,
      veiculoMelhorEficiencia: rankingMelhorEficiencia[0]?.vehicleCode || null,
      veiculoMaisAbastecimentos: rankingMaisAbastecimentos[0]?.vehicleCode || null,
    },
    porVeiculo,
    rankings: {
      maiorConsumo: rankingMaiorConsumo,
      melhorEficiencia: rankingMelhorEficiencia,
      maisAbastecimentos: rankingMaisAbastecimentos,
      maiorCusto: rankingMaiorCusto,
    },
    serieTemporal,
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export { montarDashboard, calcularKpisPorVeiculo, filterByDateRange };
