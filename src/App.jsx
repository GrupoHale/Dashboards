import { useCallback, useEffect, useMemo, useState } from "react";
import KpiCard from "./components/KpiCard.jsx";
import VehicleTable from "./components/VehicleTable.jsx";
import ConsumptionChart from "./components/ConsumptionChart.jsx";
import EfficiencyChart from "./components/EfficiencyChart.jsx";
import SpendTrendChart from "./components/SpendTrendChart.jsx";
import FuelTypePie from "./components/FuelTypePie.jsx";
import RankingTable from "./components/RankingTable.jsx";
import SuspiciousFuellingModal from "./components/SuspiciousFuellingModal.jsx";
import { buildDashboard, extractFuellingItems } from "./utils/fuelDashboard.js";
import logo from '../public/favicon.png';


const API_URL = "/api/fuel/dashboard";

export default function App() {
  const [fuellings, setFuellings] = useState([]);
  const [status, setStatus] = useState("loading");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSuspiciousModalOpen, setIsSuspiciousModalOpen] = useState(false);

  const carregarDados = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error("Falha ao buscar dados");
      setFuellings(extractFuellingItems(await res.json()));
      setStatus("ready");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);
  const { resumo, porVeiculo, serieTemporal, rankings, suspeitos } = useMemo(
    () => buildDashboard(fuellings, { startDate, endDate }),
    [fuellings, startDate, endDate]
  );

  if (status === "loading") return <div className="loading">Carregando...</div>;
  if (status === "error") return <div className="error">Não foi possível carregar os dados.</div>;

  return (
    <main className="container">
      <header className="header">
        <div className="brand"><span className=""> <img className="logo" src={logo} alt='logo'/> </span><div><p>Gestão de frota</p><h1>Dashboard de combustível</h1></div></div>
        <div className="header-actions">
          <button className="alert-button" type="button" onClick={() => setIsSuspiciousModalOpen(true)}>Alertas <span>{suspeitos.length}</span></button>
          <div className="filters"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /><span>até</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
      </header>

      <section className="kpi-grid" aria-label="Resumo da frota">
        <KpiCard label="Litros abastecidos" value={`${resumo.totalLitros.toLocaleString("pt-BR")} L`} />
        <KpiCard label="Gasto total" value={resumo.totalGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
        <KpiCard label="Total de abastecimentos" value={resumo.totalAbastecimentos} />
        <KpiCard label="Veículo menos eficiente" value={resumo.veiculoMaiorConsumo || "-"} />
        <KpiCard label="Veículo mais eficiente" value={resumo.veiculoMelhorEficiencia || "-"} />
        <KpiCard label="Veículo mais abastecido" value={resumo.veiculoMaisAbastecimentos || "-"} />
      </section>

      <section className="section-heading"><div><p>Visão geral</p><h2></h2></div></section>
      <div className="charts-row">
        <div className="panel"><h2>Consumo por veículo</h2><ConsumptionChart data={porVeiculo} /></div>
        <div className="panel"><h2>Eficiência por veículo</h2><EfficiencyChart data={porVeiculo} /></div>
      </div>
      <div className="charts-row overview-row">
        <div className="panel"><h2>Evolução de gasto e consumo</h2><SpendTrendChart data={serieTemporal} /></div>
        <div className="panel"><h2>Composição por combustível</h2><FuelTypePie data={rankings.combustivel} /></div>
      </div>
      <section className="panel"><h2>Detalhamento por veículo</h2><VehicleTable data={porVeiculo} /></section>

      <section className="section-heading"><div><p>Comparativos</p><h2>Rankings da operação</h2></div></section>
      <div className="charts-row">
        <div className="panel"><h2>Veículos por consumo</h2><RankingTable data={rankings.consumo} columns={[{ key: "vehicleCode", label: "Veículo" }, { key: "totalLitros", label: "Litros", format: "liters" }, { key: "numAbastecimentos", label: "Abastecimentos", format: "number" }]} /></div>
        <div className="panel"><h2>Custo de combustível por veículo</h2><RankingTable data={rankings.custo} columns={[{ key: "vehicleCode", label: "Veículo" }, { key: "totalGasto", label: "Gasto", format: "money" }, { key: "custoPorKm", label: "Custo/km", format: "money" }]} /></div>
      </div>
      <div className="charts-row">
        <div className="panel"><h2>Preço médio por combustível</h2><RankingTable data={rankings.combustivel} columns={[{ key: "combustivel", label: "Combustível" }, { key: "precoMedio", label: "Preço médio/L", format: "money" }, { key: "totalLitros", label: "Litros", format: "liters" }]} /></div>
        <div className="panel"><h2>Abastecimentos por posto</h2><RankingTable data={rankings.postos} columns={[{ key: "posto", label: "Posto" }, { key: "abastecimentos", label: "Abastecimentos", format: "number" }, { key: "totalGasto", label: "Gasto", format: "money" }]} /></div>
      </div>
      <div className="charts-row">
        <div className="panel"><h2>Veículos mais eficientes</h2><RankingTable data={rankings.eficienciaMelhor} columns={[{ key: "vehicleCode", label: "Veículo" }, { key: "eficienciaMedia", label: "Eficiência", format: "efficiency" }, { key: "totalLitros", label: "Litros", format: "liters" }]} /></div>
        <div className="panel"><h2>Veículos menos eficientes</h2><RankingTable data={rankings.eficienciaMenor} columns={[{ key: "vehicleCode", label: "Veículo" }, { key: "eficienciaMedia", label: "Eficiência", format: "efficiency" }, { key: "totalLitros", label: "Litros", format: "liters" }]} /></div>
      </div>
      {isSuspiciousModalOpen && <SuspiciousFuellingModal data={suspeitos} onClose={() => setIsSuspiciousModalOpen(false)} />}
    </main>
  );
}
