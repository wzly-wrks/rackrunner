import useSWR from "swr";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7071";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AuditPage() {
  const { data } = useSWR(`${API_BASE}/audit`, fetcher);
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
          {data?.items?.map((row: any) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.action}</td>
              <td>{row.actor}</td>
              <td>{row.ts}</td>
            </tr>
          )) || <tr><td colSpan={4}>No events</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
