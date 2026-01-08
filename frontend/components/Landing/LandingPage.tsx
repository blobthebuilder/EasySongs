import LeftSection from "./LeftSection";
import RightSection from "./RightSection";

export default function LandingPage() {
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-[60%_40%]">
      <LeftSection />
      <RightSection />
    </main>
  );
}
