import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { parseKv } from "@rackrunner/utils/qr";
import type { RackOpenResponse, RackScanResponse, RackCloseResponse, ErrorResponse } from "@rackrunner/types";

const Html5QrcodeScanner = dynamic(() => import("../components/Scanner"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7071";

// TODO: Replace with actual user authentication
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

export default function ScanPage() {
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const rackIdRef = useRef<string | null>(null);

  const appendLog = (entry: string) => setLog((prev) => [entry, ...prev].slice(0, 10));

  const handleScan = async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const kv = parseKv(text);
      if (kv.T === "RR" && kv.ID) {
        // Rack QR code
        rackIdRef.current = kv.ID;
        const res = await fetch(`${API_BASE}/racks/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rackId: kv.ID, userId: TEMP_USER_ID }),
        });

        if (!res.ok) {
          const errorData: ErrorResponse = await res.json();
          throw new Error(errorData.error || "Failed to open rack");
        }

        const data: RackOpenResponse = await res.json();
        appendLog(`Rack ${kv.ID} opened → ${data.status}`);
      } else if ((kv.T === "MI" || kv.T === "MB") && rackIdRef.current) {
        // Meal item QR code
        const qty = kv.Q ? Number(kv.Q) : 1;
        const payload = {
          rackId: rackIdRef.current,
          userId: TEMP_USER_ID,
          mealCode: kv.MEAL,
          batchDate: kv.BD,
          serial: kv.SER,
          quantity: qty,
        };
        const res = await fetch(`${API_BASE}/racks/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData: ErrorResponse = await res.json();
          throw new Error(errorData.error || "Failed to scan item");
        }

        const data: RackScanResponse = await res.json();
        appendLog(`Scanned ${kv.MEAL} x${qty} → Success`);
      } else if (!rackIdRef.current) {
        throw new Error("Please scan a rack QR code first");
      } else {
        throw new Error("Invalid QR code format");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Scan error occurred";
      setError(errorMsg);
      appendLog(`Error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = async () => {
    if (!rackIdRef.current) {
      setError("No active rack to close");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/racks/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rackId: rackIdRef.current, userId: TEMP_USER_ID }),
      });

      if (!res.ok) {
        const errorData: ErrorResponse = await res.json();
        throw new Error(errorData.error || "Failed to close rack");
      }

      const data: RackCloseResponse = await res.json();
      appendLog(`Rack closed → ${data.batches.length} batches created`);
      rackIdRef.current = null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Close error occurred";
      setError(errorMsg);
      appendLog(`Error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card">
      <h1>Rack Scanner</h1>
      <p>
        Scan rack and meal QR codes. Active rack:{" "}
        <strong>{rackIdRef.current ?? "None"}</strong>
      </p>
      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee", color: "#c00", marginBottom: "1rem", borderRadius: "4px" }}>
          {error}
        </div>
      )}
      <div style={{ maxWidth: 400 }}>
        <Html5QrcodeScanner onScan={handleScan} />
      </div>
      <button
        onClick={handleClose}
        style={{ marginTop: "1rem" }}
        disabled={!rackIdRef.current || isProcessing}
      >
        {isProcessing ? "Processing..." : "Close Rack"}
      </button>
      <h2>Recent activity</h2>
      <ul>
        {log.length > 0 ? (
          log.map((entry, idx) => <li key={idx}>{entry}</li>)
        ) : (
          <li>No activity yet</li>
        )}
      </ul>
    </div>
  );
}