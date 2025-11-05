import Link from "next/link";

export default function Home() {
  return (
    <div className="card">
      <h1>RackRunner</h1>
      <p>Production-shaped POC for freezer rack tracking and FIFO planning.</p>
      <ul>
        <li><Link href="/scan">Rack Scanner</Link></li>
        <li><Link href="/freezer">Freezer Inventory</Link></li>
        <li><Link href="/planner">Packing Planner</Link></li>
        <li><Link href="/audit">Audit Trail</Link></li>
      </ul>
    </div>
  );
}
