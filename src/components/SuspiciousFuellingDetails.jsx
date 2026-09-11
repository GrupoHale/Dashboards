const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" });

function formatValue(value, unit) {
  if (unit === "BRL") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${unit}`;
}

export default function SuspiciousFuellingDetails({ item, onClose }) {
  const { comparison } = item;
  return (
    <div className="details-backdrop" onMouseDown={onClose}>
      <section className="details-dialog" role="dialog" aria-modal="true" aria-labelledby="details-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div><h2 id="details-title">Detalhes do alerta</h2><p>{item.reason}</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <dl className="details-summary">
          <div><dt>Veículo</dt><dd>{item.vehicleCode}</dd></div>
          <div><dt>Data</dt><dd>{dateFormatter.format(new Date(item.date))}</dd></div>
          <div><dt>Posto</dt><dd>{item.station}</dd></div>
          <div><dt>Combustível</dt><dd>{item.fuelType}</dd></div>
        </dl>
        <div className="comparison-card">
          <div><span>{comparison.actualLabel}</span><strong>{formatValue(comparison.actual, comparison.unit)}</strong></div>
          <div><span>{comparison.referenceLabel}</span><strong>{formatValue(comparison.reference, comparison.unit)}</strong></div>
          <div><span>{comparison.limitLabel}</span><strong>{formatValue(comparison.limit, comparison.unit)}</strong></div>
        </div>
      </section>
    </div>
  );
}
