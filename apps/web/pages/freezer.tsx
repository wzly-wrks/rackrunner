import useSWR from "swr";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7071";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FreezerPage() {
  const { data } = useSWR(`${API_BASE}/inventory/summary`, fetcher, { refreshInterval: 5000 });
  return (
    <div className="card">
      <h1>Freezer Inventory</h1>
      <h2>By Meal Code</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Meal</th>
            <th>Available</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data?.byMeal?.map((row: any) => (
            <tr key={row.meal_code}>
              <td>{row.meal_code}</td>
              <td>{row.qty_available}</td>
              <td>{row.qty_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>FIFO Batches</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Meal</th>
            <th>Batch Date</th>
            <th>Available</th>
            <th>Rack</th>
          </tr>
        </thead>
        <tbody>
          {data?.byBatch?.map((row: any) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.meal_code}</td>
              <td>{row.batch_date}</td>
              <td>{row.qty_available}</td>
              <td>{row.from_rack_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
