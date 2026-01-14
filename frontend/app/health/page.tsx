import { fetchHealth } from "../../lib/api/health";
import { HealthResponse } from "../../types/api/health";

export default async function HealthPage() {
  const data: HealthResponse = await fetchHealth();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>API Health Check</h1>
      <p>
        Status: <strong>{data.status}</strong>
      </p>
    </div>
  );
}
