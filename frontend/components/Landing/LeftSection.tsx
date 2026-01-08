import Link from "next/link";

export default function LeftSection() {
  return (
    <div className="flex flex-col justify-center px-16">
      <h1 className="text-4xl font-bold mb-4">EasySongs</h1>
      <p className="text-zinc-400 mb-6">
        The Spotify tool for everything you need
      </p>
      <Link href="/dashboard">
        <button className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-md font-semibold">
          Get Started
        </button>
      </Link>
    </div>
  );
}
