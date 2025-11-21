import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const RevenueChart = ({ data }) => {
  const formatted = Object.keys(data).map(key => ({
    month: key,
    revenue: data[key].revenue
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="revenue" stroke="#000" fill="#ff6667" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;