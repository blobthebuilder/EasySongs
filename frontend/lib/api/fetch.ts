export async function apiFetch(url: string) {
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json(); // IMPORTANT: parse JSON
}
