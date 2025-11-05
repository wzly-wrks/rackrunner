import useSWR from "swr";
import type { InventorySummaryResponse } from "@rackrunner/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7071";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FreezerPage() {
  const { data, error, isLoading } = useSWR<InventorySummaryResponse>(
    `${API_BASE}/inventory/summary`,
    fetcher,
    { refreshInterval: 5000 }
  );

  if (error) {
    return (
      <div className="card">
        <h1>Freezer Inventory</h1>
        <p style={{ color: "red" }}>Error loading inventory data. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h1>Freezer Inventory</h1>
        <p>Loading inventory data...</p>
      </div>
    );
  }

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
          {data?.byMeal && data.byMeal.length > 0 ? (
            data.byMeal.map((row) => (
              <tr key={row.meal_code}>
                <td>{row.meal_code}</td>
                <td>{row.qty_available}</td>
                <td>{row.qty_total}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>No inventory data available</td>
            </tr>
          )}
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
          {data?.byBatch && data.byBatch.length > 0 ? (
            data.byBatch.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.meal_code}</td>
                <td>{row.batch_date}</td>
                <td>{row.qty_available}</td>
                <td>{row.from_rack_id}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No batches available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}