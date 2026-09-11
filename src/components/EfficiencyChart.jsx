import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function EfficiencyChart({ data }) {
  const chartData = data
    .filter((v) => v.eficienciaMedia !== null)
    .map((v) => ({ veiculo: v.vehicleCode, eficiencia: v.eficienciaMedia }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="veiculo" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(v) => [`${v} km/L`, "Eficiência"]} />
        <Bar dataKey="eficiencia" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
