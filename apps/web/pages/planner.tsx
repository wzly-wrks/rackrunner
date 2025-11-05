import { useState } from "react";
import type { AllocationResponse, ErrorResponse } from "@rackrunner/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7071";

// TODO: Replace with actual user authentication
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

export default function PlannerPage() {
  const [day, setDay] = useState("");
  const [meal, setMeal] = useState("HH");
  const [qty, setQty] = useState(12);
  const [requirementId, setRequirementId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const append = (msg: string) => setLog((prev) => [msg, ...prev]);

  const importReq = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const body = {
        day,
        userId: TEMP_USER_ID,
        items: [{ mealCode: meal, qtyNeeded: qty }],
      };
      const res = await fetch(`${API_BASE}/packing/requirements/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData: ErrorResponse = await res.json();
        throw new Error(errorData.error || "Failed to import requirement");
      }

      const json = await res.json();
      if (json.requirementIds?.length) {
        setRequirementId(json.requirementIds[0]);
        append(`Requirement created ${json.requirementIds[0]}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      append(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const allocate = async () => {
    if (!requirementId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/packing/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId, userId: TEMP_USER_ID }),
      });

      if (!res.ok) {
        const errorData: ErrorResponse = await res.json();
        throw new Error(errorData.error || "Failed to allocate");
      }

      const json: AllocationResponse = await res.json();
      append(
        `Allocated ${json.allocations.length} batches, ${json.remaining} remaining`
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      append(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h1>Packing Planner</h1>
      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee", color: "#c00", marginBottom: "1rem", borderRadius: "4px" }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label>
          Day
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            disabled={isLoading}
          />
        </label>
        <label>
          Meal
          <select value={meal} onChange={(e) => setMeal(e.target.value)} disabled={isLoading}>
            <option value="HH">Heart Healthy</option>
            <option value="DIAL">Dialysis</option>
            <option value="LP">Low-Protein</option>
            <option value="GI">GI</option>
            <option value="VEG">Veggie</option>
            <option value="CHOP">Chopped</option>
            <option value="NP">No Pork</option>
            <option value="NB">No Beef</option>
          </select>
        </label>
        <label>
          Quantity
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            min="1"
            disabled={isLoading}
          />
        </label>
      </div>
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={importReq} disabled={isLoading || !day}>
          {isLoading ? "Processing..." : "Import"}
        </button>
        <button onClick={allocate} disabled={!requirementId || isLoading}>
          {isLoading ? "Processing..." : "Allocate FIFO"}
        </button>
      </div>
      <h2>Log</h2>
      <ul>
        {log.length > 0 ? (
          log.map((item, idx) => <li key={idx}>{item}</li>)
        ) : (
          <li>No activity yet</li>
        )}
      </ul>
    </div>
  );
}