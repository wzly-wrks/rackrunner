import useSWR from "swr";
import type { AuditResponse } from "@rackrunner/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7071";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AuditPage() {
  const { data, error, isLoading } = useSWR<AuditResponse>(`${API_BASE}/audit`, fetcher);

  if (error) {
    return (
      <div className="card">
        <h1>Audit Trail</h1>
        <p style={{ color: "red" }}>Error loading audit data. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h1>Audit Trail</h1>
        <p>Loading audit data...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Audit Trail</h1>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Action</th>
            <th>Actor</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data?.items && data.items.length > 0 ? (
            data.items.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.action}</td>
                <td>{row.actor || "N/A"}</td>
                <td>{new Date(row.ts).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>No audit events</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}