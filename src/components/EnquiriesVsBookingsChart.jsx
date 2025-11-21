import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const EnquiryVsBookingChart = ({ data }) => {
  const formatted = Object.keys(data).map(key => ({
    month: key,
    enquiries: data[key].enquiries,
    bookings: data[key].bookings
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

export default EnquiryVsBookingChart;