import Container from "@/components/ui/Container";
import NextTournament from "@/components/NextTournament";
import { tournament } from "@/lib/tournament";
export default function TournamentPreview() {
 return <section className="bg-slate-50 py-20"><Container>
  <p className="mb-8 text-center text-slate-600">Building on our inaugural outing · {tournament.date}</p><NextTournament />
 </Container></section>;
}
