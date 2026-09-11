import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function FuelTypePie({ data }) {
  if (!data.length) return <p className="empty-state">Sem dados para o período selecionado.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="totalLitros" nameKey="combustivel" innerRadius={64} outerRadius={96} paddingAngle={3}>
          {data.map((item, index) => <Cell key={item.combustivel} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(value) => [`${value.toLocaleString("pt-BR")} L`, "Volume"]} />
        <Legend verticalAlign="bottom" height={32} />
      </PieChart>
    </ResponsiveContainer>
  );
}
