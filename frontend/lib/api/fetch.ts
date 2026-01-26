export async function apiFetch(url: string, options: RequestInit = {}) {
  const BASE_URL = "http://127.0.0.1:8080";
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || json.message || text);
    } catch {
      throw new Error(text || "Fetch failed");
    }
  }

  if (res.status === 204) return null;
  return res.json();
}
