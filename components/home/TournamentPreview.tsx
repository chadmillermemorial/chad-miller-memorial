import Link from "next/link";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { siteConfig } from "@/lib/site";

export default function TournamentPreview() {
  return (
    <section className="bg-slate-50 py-20">
      <Container>
        <SectionHeading
          eyebrow="Tournament"
          title={siteConfig.location.course}
        >
          <p>
            Join us in {siteConfig.location.city},{" "}
            {siteConfig.location.state} for a day of golf, fellowship,
            remembrance, and support of a meaningful mission.
          </p>
        </SectionHeading>

        <div className="mt-10">
          <Card>
            <h3 className="text-2xl font-bold text-[var(--brand-navy)]">
              Tournament Information
            </h3>

            <p className="mt-4 text-slate-600">
              Registration, schedule, sponsorship opportunities, and event
              details will be announced soon.
            </p>

            <Link
              href="/tournament"
              className="mt-8 inline-flex rounded-full bg-[var(--golf-green)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              View Tournament Details
            </Link>
          </Card>
        </div>
      </Container>
    </section>
  );
}