"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        style={{ cursor: "pointer" }}>
        Logout
      </button>
    </form>
  );
}
