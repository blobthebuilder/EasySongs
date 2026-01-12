"use client";

export default function LoginPage() {
  const loginWithSpotify = () => {
    // Redirect browser to Go backend
    window.location.href = "http://127.0.0.1:8080/auth/login";
  };

  return <button onClick={loginWithSpotify}>Login with Spotify</button>;
}
