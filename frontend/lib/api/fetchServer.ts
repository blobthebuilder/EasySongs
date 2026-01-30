import { cookies, headers } from "next/headers";

export async function apiFetchServer(url: string, options: RequestInit = {}) {
  const BASE_URL = "http://127.0.0.1:8080";
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  const reqHeaders = await headers();
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session");

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Forward the original Host and Cookies
      Cookie: sessionCookie
        ? `${sessionCookie.name}=${sessionCookie.value}`
        : "",
      ...options.headers,
      Referer: reqHeaders.get("referer") || "",
      "User-Agent": reqHeaders.get("user-agent") || "",
      ...options.headers,
    },
    cache: "no-store",
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
