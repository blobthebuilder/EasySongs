"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/fetch";

type Playlist = {
  id: string;
  name: string;
};

export default function DashboardPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const logout = () => {
    window.location.href = "http://127.0.0.1:8080/auth/logout";
  };

  const fetchPlaylists = async () => {
    try {
      const data = await apiFetch("http://127.0.0.1:8080/api/playlists");
      setPlaylists(data);
    } catch (err) {
      console.error("Failed to load playlists", err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <button onClick={logout}>Logout</button>

      <button onClick={fetchPlaylists}>Reload Playlists</button>

      <h2 className="mt-6 text-xl font-semibold">Playlists</h2>
      <ul>
        {playlists.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
