import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const EnquiriesVsBookingsChart = ({ data }) => {
  if (!data || typeof data !== "object") {
    return <div className="text-gray-500 text-sm">No enquiry data available</div>;
  }

  const formatted = Object.keys(data).map(month => ({
    month,
    enquiries: data[month]?.enquiries || 0,
    bookings:   data[month]?.bookings  || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="enquiries" fill="#8884d8" />
        <Bar dataKey="bookings" fill="#ff6667" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EnquiriesVsBookingsChart;