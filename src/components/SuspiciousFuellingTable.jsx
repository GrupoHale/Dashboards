const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function SuspiciousFuellingTable({ data, onDetails }) {
  if (!data.length) return <p className="empty-state">Nenhum abastecimento fora do padrão foi identificado no período.</p>;
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>Data</th><th>Veículo</th><th>Posto</th><th>Litros</th><th>Preço/L</th><th>Motivo</th><th>Ação</th></tr></thead>
        <tbody>{data.map((item) => (
          <tr key={item.id}>
            <td>{dateFormatter.format(new Date(item.date))}</td>
            <td><span className="badge">{item.vehicleCode}</span></td>
            <td>{item.station}</td>
            <td>{item.liters.toLocaleString("pt-BR")} L</td>
            <td>{item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td><span className="alert-badge">{item.reason}</span></td>
            <td><button className="details-button" type="button" onClick={() => onDetails(item)}>Ver detalhes</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
