import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function ConsumptionChart({ data }) {
  const chartData = data.map((v) => ({
    veiculo: v.vehicleCode,
    litros: v.totalLitros,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="veiculo" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(v) => [`${v} L`, "Litros"]} />
        <Bar dataKey="litros" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
