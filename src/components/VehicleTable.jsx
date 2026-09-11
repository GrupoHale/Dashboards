import { useState, useMemo } from "react";

const COLUMNS = [
  { key: "vehicleCode", label: "Veículo" },
  { key: "motorista", label: "Motorista" },
  { key: "totalLitros", label: "Litros" },
  { key: "totalGasto", label: "Gasto (R$)" },
  { key: "eficienciaMedia", label: "Eficiência (km/L)" },
  { key: "numAbastecimentos", label: "Abastecimentos" },
  { key: "custoPorKm", label: "Custo/km" },
];

export default function VehicleTable({ data }) {
  const [sortKey, setSortKey] = useState("totalLitros");
  const [sortDir, setSortDir] = useState("desc");

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const va = a[sortKey] ?? -Infinity;
      const vb = b[sortKey] ?? -Infinity;
      if (typeof va === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <table>
      <thead>
        <tr>
          {COLUMNS.map((col) => (
            <th key={col.key} onClick={() => toggleSort(col.key)}>
              {col.label} {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((v) => (
          <tr key={v.vehicleCode}>
            <td><span className="badge">{v.vehicleCode}</span></td>
            <td>{v.motorista || "-"}</td>
            <td>{v.totalLitros?.toLocaleString("pt-BR")} L</td>
            <td>{v.totalGasto?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
            <td>{v.eficienciaMedia !== null ? `${v.eficienciaMedia.toFixed(2)} km/L` : "-"}</td>
            <td>{v.numAbastecimentos}</td>
            <td>{v.custoPorKm !== null ? v.custoPorKm.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
