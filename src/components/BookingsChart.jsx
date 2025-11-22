import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const BookingsChart = ({ data }) => {
  if (!data || typeof data !== "object") {
    return <div className="text-gray-500 text-sm">No booking data available</div>;
  }
  const cleaned = stats?.bookings || {};

  const formatted = Object.keys(cleaned).map(month => ({
    month,
    bookings: data[month] || 0,
  }));


  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="bookings" fill="#ff6667" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BookingsChart;