import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const RevenueChart = ({ data }) => {
  if (!data || typeof data !== "object") {
    return <div className="text-gray-500 text-sm">No revenue data available</div>;
  }

  const formatted = Object.keys(data).map(month => ({
    month,
    revenue: data[month] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="revenue" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;