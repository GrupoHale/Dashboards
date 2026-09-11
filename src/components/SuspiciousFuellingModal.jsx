import { useEffect, useMemo, useState } from "react";
import SuspiciousFuellingTable from "./SuspiciousFuellingTable.jsx";
import SuspiciousFuellingDetails from "./SuspiciousFuellingDetails.jsx";

const PAGE_SIZE = 10;

export default function SuspiciousFuellingModal({ data, onClose }) {
  const [page, setPage] = useState(1);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const filteredData = useMemo(() => {
    const query = vehicleQuery.trim().toLocaleLowerCase("pt-BR");
    return data.filter((item) => {
      const date = String(item.date).slice(0, 10);
      return (!query || item.vehicleCode.toLocaleLowerCase("pt-BR").includes(query)) &&
        (!startDate || date >= startDate) &&
        (!endDate || date <= endDate);
    });
  }, [data, vehicleQuery, startDate, endDate]);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pageData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [data, vehicleQuery, startDate, endDate]);
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="suspicious-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div><h2 id="suspicious-title">Alertas de abastecimentos</h2><p>{filteredData.length} alerta(s) encontrado(s)</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="modal-filters">
          <input type="search" value={vehicleQuery} onChange={(event) => setVehicleQuery(event.target.value)} placeholder="Buscar por veículo" aria-label="Buscar por veículo" />
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="Data inicial" />
          <span>até</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-label="Data final" />
        </div>
        <SuspiciousFuellingTable data={pageData} onDetails={setSelectedItem} />
        {filteredData.length > PAGE_SIZE && <div className="pagination">
          <button type="button" onClick={() => setPage((value) => value - 1)} disabled={page === 1}>Anterior</button>
          <span>Página {page} de {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => value + 1)} disabled={page === totalPages}>Próxima</button>
        </div>}
      </section>
      {selectedItem && <SuspiciousFuellingDetails item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
