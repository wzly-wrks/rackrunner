import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7071";

export default function PlannerPage() {
  const [day, setDay] = useState("");
  const [meal, setMeal] = useState("HH");
  const [qty, setQty] = useState(12);
  const [requirementId, setRequirementId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const append = (msg: string) => setLog((prev) => [msg, ...prev]);

  const importReq = async () => {
    const body = {
      day,
      userId: "00000000-0000-0000-0000-000000000001",
      items: [{ mealCode: meal, qtyNeeded: qty }]
    };
    const res = await fetch(`${API_BASE}/packing/requirements/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (json.requirementIds?.length) {
      setRequirementId(json.requirementIds[0]);
      append(`Requirement created ${json.requirementIds[0]}`);
    }
  };

  const allocate = async () => {
    if (!requirementId) return;
    const res = await fetch(`${API_BASE}/packing/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementId, userId: "00000000-0000-0000-0000-000000000001" })
    });
    const json = await res.json();
    append(`Allocated ${JSON.stringify(json)}`);
  };

  return (
    <div className="card">
      <h1>Packing Planner</h1>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label>
          Day
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </label>
        <label>
          Meal
          <select value={meal} onChange={(e) => setMeal(e.target.value)}>
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
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </label>
      </div>
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={importReq}>Import</button>
        <button onClick={allocate} disabled={!requirementId}>Allocate FIFO</button>
      </div>
      <h2>Log</h2>
      <ul>
        {log.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
