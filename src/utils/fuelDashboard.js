const FUEL_TYPES = {
  1: "Gasolina",
  2: "Álcool",
  3: "Diesel",
  4: "Gás natural",
  5: "Diesel S10",
  6: "ARLA 32",
  7: "Diesel S10 Aditivado",
  8: "Diesel S10 Especial",
  9: "Diesel S500 Comum",
  10: "Aditivo de combustível",
};

const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const litersOf = (f) => number(f.FuelAmountLiters ?? f.Liters);

const paymentOf = (f) => number(f.TotalPayment ?? f.TotalValue);

const distanceOf = (f) =>
  Math.max(0, number(f.Odometer) - number(f.PreviusOdometer ?? f.PreviousOdometer));

const firstText = (...values) => {
  for (const value of values) {
    const text =
      typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
    if (text) return text;
  }
  return null;
};

const vehicleOf = (f) =>
  firstText(
    f.VehicleIntegrationCodeClient,
    f.VehicleIntegrationCodeCentral,
    f.VehicleIntegrationCode,
    f.VehicleCode,
    f.VehicleLicensePlate,
    f.VehiclePlate,
    f.LicensePlate,
    f.Plate,
    f.VehicleName,
    f.VehicleDescription,
    f.Vehicle?.IntegrationCodeClient,
    f.Vehicle?.IntegrationCodeCentral,
    f.Vehicle?.Code,
    f.Vehicle?.LicensePlate,
    f.Vehicle?.Plate,
    f.Vehicle?.Name
  );

const stationOf = (f) =>
  f.FuelStationName || f.FuelStationIntegrationCode || f.StationName || "Não informado";

const fuelTypeOf = (f) =>
  f.FuelTypeDescription ||
  f.FuelTypeName ||
  FUEL_TYPES[f.FuelTypeCode] ||
  `Tipo ${f.FuelTypeCode ?? "não informado"}`;

export function extractFuellingItems(response) {
  if (Array.isArray(response)) return response;
  return (
    [
      response?.Data,
      response?.data,
      response?.Items,
      response?.items,
      response?.Result,
      response?.result,
    ].find(Array.isArray) ?? []
  );
}

function inDateRange(f, startDate, endDate) {
  const date = new Date(f.FuelDate);
  return (
    !Number.isNaN(date.getTime()) &&
    (!startDate || date >= new Date(`${startDate}T00:00:00`)) &&
    (!endDate || date <= new Date(`${endDate}T23:59:59.999`))
  );
}

function aggregateBy(items, keyOf, label) {
  const grouped = new Map();
  for (const item of items) {
    const key = keyOf(item);
    const row = grouped.get(key) || { [label]: key, totalLitros: 0, totalGasto: 0, abastecimentos: 0 };
    row.totalLitros += litersOf(item);
    row.totalGasto += paymentOf(item);
    row.abastecimentos += 1;
    grouped.set(key, row);
  }
  return [...grouped.values()].map((row) => ({
    ...row,
    totalLitros: round2(row.totalLitros),
    totalGasto: round2(row.totalGasto),
    precoMedio: row.totalLitros ? round2(row.totalGasto / row.totalLitros) : null,
  }));
}

function findSuspicious(fuellings) {
  const flags = [];
  const byVehicle = new Map();
  const byType = new Map();

  for (const f of fuellings) {
    const vehicle = vehicleOf(f);
    const type = fuelTypeOf(f);
    byVehicle.set(vehicle, [...(byVehicle.get(vehicle) || []), f]);
    byType.set(type, [...(byType.get(type) || []), f]);
  }

  const averagePrice = new Map(
    [...byType].map(([type, rows]) => {
      const liters = rows.reduce((sum, row) => sum + litersOf(row), 0);
      return [
        type,
        liters ? rows.reduce((sum, row) => sum + paymentOf(row), 0) / liters : 0,
      ];
    })
  );

  for (const [vehicle, rows] of byVehicle) {
    const ordered = [...rows].sort((a, b) => new Date(a.FuelDate) - new Date(b.FuelDate));
    const averageLiters = ordered.reduce((sum, row) => sum + litersOf(row), 0) / ordered.length;

    // O alerta de consumo foi substituído pelas verificações de odômetro.
    const consumptionValues = [];
    const averageConsumption = 0;

    ordered.forEach((row, index) => {
      const liters = litersOf(row);
      const price = liters ? paymentOf(row) / liters : 0;

      const add = (reason, comparison) =>
        flags.push({
          id: `${row.FuellingIntegrationCode || `${vehicle}-${index}`}-${reason}`,
          vehicleCode: vehicle,
          date: row.FuelDate,
          station: stationOf(row),
          liters,
          price: round2(price),
          fuelType: fuelTypeOf(row),
          reason,
          comparison,
        });

      const capacity = number(row.TankCapacity ?? row.VehicleTankCapacity ?? row.FuelTankCapacity);
      if (capacity && liters > capacity) {
        add(`Volume acima da capacidade informada (${capacity} L)`, {
          actual: liters,
          actualLabel: "Volume abastecido",
          reference: capacity,
          referenceLabel: "Capacidade informada do tanque",
          limit: capacity,
          limitLabel: "Máximo permitido",
          unit: "L",
        });
      }

      if (index) {
        const intervalHours =
          (new Date(row.FuelDate) - new Date(ordered[index - 1].FuelDate)) / 3600000;
        if (intervalHours < 4) {
          add("Novo abastecimento em menos de 4 horas", {
            actual: intervalHours,
            actualLabel: "Intervalo entre abastecimentos",
            reference: 4,
            referenceLabel: "Intervalo mínimo esperado",
            limit: 4,
            limitLabel: "Mínimo permitido",
            unit: "h",
          });
        }
      }

      const previousOdometer = number(ordered[index - 1]?.Odometer);
      const currentOdometer = number(row.Odometer);
      const distanceSincePrevious = currentOdometer - previousOdometer;

      if (previousOdometer > 0 && currentOdometer > 0 && distanceSincePrevious < 0) {
        add("Odômetro menor que o do abastecimento anterior", {
          actual: currentOdometer,
          actualLabel: "Odômetro do abastecimento atual",
          reference: previousOdometer,
          referenceLabel: "Odômetro do abastecimento anterior",
          limit: "",
          limitLabel: "",
          unit: "",
        });
      }

      if (previousOdometer > 0 && distanceSincePrevious > 3000) {
        add("Odômetro consideravelmente maior que o do abastecimento anterior", {
          actual: distanceSincePrevious,
          actualLabel: "Odômetro do abastecimento atual",
          reference: previousOdometer,
          referenceLabel: "Odômetro do abastecimento anterior",
          limit: "",
          limitLabel: "",
          unit: "",
        });
      }

      const typeAveragePrice = averagePrice.get(fuelTypeOf(row));
      if (typeAveragePrice && price > typeAveragePrice * 1.25) {
        add("Preço por litro mais de 25% acima da média do combustível", {
          actual: price,
          actualLabel: "Preço pago por litro",
          reference: typeAveragePrice,
          referenceLabel: "Preço médio de " + fuelTypeOf(row),
          limit: typeAveragePrice * 1.25,
          limitLabel: "Limite de alerta (+25%)",
          unit: "BRL",
        });
      }

      if (ordered.length >= 3 && liters > averageLiters * 2.5) {
        add("Quantidade de litros muito acima do padrão do veículo", {
          actual: liters,
          actualLabel: "Volume abastecido",
          reference: averageLiters,
          referenceLabel: "Média de litros do veículo",
          limit: averageLiters * 2.5,
          limitLabel: "Limite de alerta (2,5× a média)",
          unit: "L",
        });
      }

      const consumption = distanceOf(row) > 0 && liters > 0 ? distanceOf(row) / liters : null;
      if (
        consumptionValues.length >= 3 &&
        consumption &&
        (consumption < averageConsumption * 0.5 || consumption > averageConsumption * 1.5)
      ) {
        add("Consumo fora da faixa histórica do veículo", {
          actual: consumption,
          actualLabel: "Consumo deste abastecimento",
          reference: averageConsumption,
          referenceLabel: "Média histórica do veículo",
          limit:
            consumption < averageConsumption * 0.5
              ? averageConsumption * 0.5
              : averageConsumption * 1.5,
          limitLabel:
            consumption < averageConsumption * 0.5
              ? "Limite mínimo (50% da média)"
              : "Limite máximo (150% da média)",
          unit: "km/L",
        });
      }
    });
  }

  return flags.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function buildDashboard(fuellings, { startDate, endDate } = {}) {
  const filtered = fuellings.filter((f) => inDateRange(f, startDate, endDate) && vehicleOf(f));
  const vehicles = new Map();
  const days = new Map();

  for (const f of filtered) {
    const vehicleCode = vehicleOf(f);
    const liters = litersOf(f);
    const payment = paymentOf(f);
    const distance = distanceOf(f);

    if (!vehicles.has(vehicleCode)) {
      vehicles.set(vehicleCode, {
        vehicleCode,
        motorista: f.DriverIntegrationCodeClient || f.DriverName || null,
        totalLitros: 0,
        totalGasto: 0,
        distanciaTotal: 0,
        litrosCompletos: 0,
        distanciaCompleta: 0,
        numAbastecimentos: 0,
        ultimoAbastecimento: f.FuelDate || null,
      });
    }

    const vehicle = vehicles.get(vehicleCode);
    vehicle.totalLitros += liters;
    vehicle.totalGasto += payment;
    vehicle.distanciaTotal += distance;
    vehicle.numAbastecimentos += 1;

    if (f.TankComplete) {
      vehicle.litrosCompletos += liters;
      vehicle.distanciaCompleta += distance;
    }

    if (new Date(f.FuelDate) > new Date(vehicle.ultimoAbastecimento)) {
      vehicle.ultimoAbastecimento = f.FuelDate;
      vehicle.motorista = f.DriverIntegrationCodeClient || f.DriverName || vehicle.motorista;
    }

    const day = String(f.FuelDate).slice(0, 10);
    const dayData = days.get(day) || { data: day, litros: 0, gasto: 0 };
    dayData.litros += liters;
    dayData.gasto += payment;
    days.set(day, dayData);
  }

  const porVeiculo = [...vehicles.values()].map((v) => {
    const efficiency = v.litrosCompletos > 0 ? v.distanciaCompleta / v.litrosCompletos : null;
    return {
      vehicleCode: v.vehicleCode,
      motorista: v.motorista,
      totalLitros: round2(v.totalLitros),
      totalGasto: round2(v.totalGasto),
      distanciaTotal: round2(v.distanciaTotal),
      eficienciaMedia: efficiency === null ? null : round2(efficiency),
      numAbastecimentos: v.numAbastecimentos,
      precoMedioLitro: v.totalLitros ? round2(v.totalGasto / v.totalLitros) : null,
      custoPorKm: v.distanciaTotal ? round2(v.totalGasto / v.distanciaTotal) : null,
      ultimoAbastecimento: v.ultimoAbastecimento,
    };
  });

  const consumo = [...porVeiculo].sort((a, b) => b.totalLitros - a.totalLitros);
  const eficienciaMelhor = porVeiculo
    .filter((v) => v.eficienciaMedia !== null)
    .sort((a, b) => b.eficienciaMedia - a.eficienciaMedia);
  const custo = [...porVeiculo].sort((a, b) => b.totalGasto - a.totalGasto);

  return {
    resumo: {
      totalLitros: round2(porVeiculo.reduce((sum, v) => sum + v.totalLitros, 0)),
      totalGasto: round2(porVeiculo.reduce((sum, v) => sum + v.totalGasto, 0)),
      totalAbastecimentos: filtered.length,
      veiculoMaiorConsumo: consumo[0]?.vehicleCode || null,
      veiculoMelhorEficiencia: eficienciaMelhor[0]?.vehicleCode || null,
      veiculoMaisAbastecimentos:
        [...porVeiculo].sort((a, b) => b.numAbastecimentos - a.numAbastecimentos)[0]?.vehicleCode ||
        null,
    },
    porVeiculo,
    serieTemporal: [...days.values()]
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((day) => ({ ...day, litros: round2(day.litros), gasto: round2(day.gasto) })),
    rankings: {
      consumo,
      custo,
      eficienciaMelhor,
      eficienciaMenor: [...eficienciaMelhor].reverse(),
      combustivel: aggregateBy(filtered, fuelTypeOf, "combustivel").sort(
        (a, b) => b.totalLitros - a.totalLitros
      ),
      postos: aggregateBy(filtered, stationOf, "posto").sort(
        (a, b) => b.abastecimentos - a.abastecimentos
      ),
    },
    suspeitos: findSuspicious(filtered),
  };
}