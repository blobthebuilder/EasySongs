"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center justify-center w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all group active:scale-95"
      aria-label="Go back">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 pr-0.5 transition-transform group-hover:-translate-x-0.5">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  );
}
