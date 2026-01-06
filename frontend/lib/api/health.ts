import { HealthResponse } from "../../types/api/health";

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch("http://localhost:8080/health");
    if (!res.ok) {
      throw new Error("Failed to fetch health");
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return { status: "Error connecting to API" };
  }
}