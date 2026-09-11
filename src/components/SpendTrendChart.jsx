import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export default function SpendTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="data" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="gasto" name="Gasto (R$)" stroke="#dc2626" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="litros" name="Litros" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
