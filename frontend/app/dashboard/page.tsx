"use client";

export default function DashboardPage() {
  const logout = () => {
    window.location.href = "http://127.0.0.1:8080/auth/logout";
  };
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
