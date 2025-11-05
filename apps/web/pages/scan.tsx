import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { parseKv } from "@rackrunner/utils/qr";

const Html5QrcodeScanner = dynamic(() => import("../components/Scanner"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7071";

export default function ScanPage() {
  const [log, setLog] = useState<string[]>([]);
  const rackIdRef = useRef<string | null>(null);

  const appendLog = (entry: string) => setLog((prev) => [entry, ...prev].slice(0, 10));

  const handleScan = async (text: string) => {
    try {
      const kv = parseKv(text);
      if (kv.T === "RR" && kv.ID) {
        rackIdRef.current = kv.ID;
        const res = await fetch(`${API_BASE}/racks/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rackId: kv.ID, userId: "00000000-0000-0000-0000-000000000001" })
        });
        appendLog(`Rack ${kv.ID} open → ${res.status}`);
      } else if ((kv.T === "MI" || kv.T === "MB") && rackIdRef.current) {
        const qty = kv.Q ? Number(kv.Q) : 1;
        const payload = {
          rackId: rackIdRef.current,
          userId: "00000000-0000-0000-0000-000000000001",
          mealCode: kv.MEAL,
          batchDate: kv.BD,
          serial: kv.SER,
          quantity: qty
        };
        const res = await fetch(`${API_BASE}/racks/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        appendLog(`Scan ${kv.MEAL} x${qty} → ${res.status}`);
      }
    } catch (err) {
      appendLog(`Scan error: ${(err as Error).message}`);
    }
  };

  const handleClose = async () => {
    if (!rackIdRef.current) return;
    const res = await fetch(`${API_BASE}/racks/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rackId: rackIdRef.current, userId: "00000000-0000-0000-0000-000000000001" })
    });
    appendLog(`Close rack → ${res.status}`);
  };

  return (
    <div className="card">
      <h1>Rack Scanner</h1>
      <p>Scan rack and meal QR codes. Active rack: {rackIdRef.current ?? "None"}</p>
      <div style={{ maxWidth: 400 }}>
        <Html5QrcodeScanner onScan={handleScan} />
      </div>
      <button onClick={handleClose} style={{ marginTop: "1rem" }}>Close Rack</button>
      <h2>Recent activity</h2>
      <ul>
        {log.map((entry, idx) => (
          <li key={idx}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
