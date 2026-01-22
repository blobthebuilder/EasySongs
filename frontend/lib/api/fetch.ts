export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
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
