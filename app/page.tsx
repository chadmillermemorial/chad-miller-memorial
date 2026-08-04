import Hero from "@/components/home/Hero";
import AboutPreview from "@/components/home/AboutPreview";
import TournamentPreview from "@/components/home/TournamentPreview";

export default function Home() {
  return (
    <main>
      <Hero />
      <AboutPreview />
      <TournamentPreview />
    </main>
  );
}