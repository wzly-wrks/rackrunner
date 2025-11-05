import { useState } from "react";

export default function UnlockPage() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const enroll = async () => {
    setStatus("Enrolling…");
    setTimeout(() => setStatus("Device enrolled (mock)"), 500);
  };

  const login = async () => {
    setStatus("Unlocking…");
    setTimeout(() => setStatus(`Unlocked with PIN ${pin}`), 500);
  };

  return (
    <div className="card">
      <h1>Quick Unlock</h1>
      <p>Enroll a device PIN for faster sign-in.</p>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" />
        <button onClick={enroll}>Enroll</button>
        <button onClick={login}>Unlock</button>
      </div>
      {status && <p>{status}</p>}
    </div>
  );
}
