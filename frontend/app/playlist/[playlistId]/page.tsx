"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ApiTrack } from "@/types/api/tracks";
import { fetchPlaylistTracks } from "@/lib/api/tracks";
import { addPlaylistToLiked } from "@/lib/api/liked";
import { removeDuplicatesPlaylists } from "@/lib/api/playlists";

export default function PlaylistPage() {
  const params = useParams();

  // ensure that params exist, and only take the first params if multiple
  if (!params?.playlistId) {
    return <div>No playlist ID</div>;
  }
  const playlistId = Array.isArray(params.playlistId)
    ? params.playlistId[0]
    : params.playlistId;

  const router = useRouter();

  const [tracks, setTracks] = useState<ApiTrack[]>([]);

  // need the ui to use this later
  const [albumTypePriority, setAlbumTypePriority] = useState([
    "album",
    "single",
    "compilation",
  ]);
  const [prioExplicit, setPrioExplicit] = useState(null);

  useEffect(() => {
    if (!playlistId) return;
    fetchPlaylistTracks(playlistId).then(setTracks);
  }, [playlistId]);

  if (!playlistId) return <div>Missing playlist ID</div>;

  const searchParams = useSearchParams();
  const snapshotId = searchParams.get("snapshotId");
  if (!snapshotId) {
    return <div>Missing snapshotId</div>;
  }

  const handleRemoveDuplicates = async () => {
    try {
      const res = await removeDuplicatesPlaylists(playlistId, {
        snapshotId,
        albumTypePriority, // state variable from your UI
        prioExplicit, // state variable from your UI
      });

      if (res.duplicates) {
        alert("Duplicates removed!");
        console.log("New snapshotId:", res.snapshotId);
      } else {
        alert("No duplicates found.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove duplicates");
    }
  };

  return (
    <div>
      <h1>Playlist</h1>
      <button onClick={() => router.back()}>Back</button>
      <button onClick={() => addPlaylistToLiked(playlistId)}>
        Add to Liked Songs
      </button>
      <button onClick={handleRemoveDuplicates}>Remove duplicates</button>

      {tracks.length === 0 ? (
        <p>This playlist is empty.</p>
      ) : (
        <ul>
          {tracks.map((t, i) => (
            <li key={`${t.id}-${i}`}>
              {t.name} — {t.artists.map((a) => a.name).join(", ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
