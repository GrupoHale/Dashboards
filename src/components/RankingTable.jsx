const formatters = {
  liters: (value) => `${value.toLocaleString("pt-BR")} L`,
  money: (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  efficiency: (value) => value === null ? "-" : `${value.toFixed(2)} km/L`,
  number: (value) => value.toLocaleString("pt-BR"),
};

export default function RankingTable({ data, columns, limit = 10 }) {
  if (!data.length) return <p className="empty-state">Sem dados para o período selecionado.</p>;
  const rankedData = data.slice(0, limit);
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>#</th>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>{rankedData.map((row, index) => (
          <tr key={row.vehicleCode || row.combustivel || row.posto || index}>
            <td>{index + 1}</td>
            {columns.map((column) => <td key={column.key}>{row[column.key] === null || row[column.key] === undefined ? "-" : formatters[column.format]?.(row[column.key]) ?? row[column.key]}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
