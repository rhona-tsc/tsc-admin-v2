import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const BookingsChart = ({ data }) => {
  const formatted = Object.keys(data).map(key => ({
    month: key,
    bookings: data[key].bookings
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="bookings" fill="#ff6667" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BookingsChart;