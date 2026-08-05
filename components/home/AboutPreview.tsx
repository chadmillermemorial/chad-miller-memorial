import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";

export default function AboutPreview() {
  return (
    <section className="py-20">
      <Container>
        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <SectionHeading
              eyebrow="Honoring Chad’s Legacy"
              title="Leadership, service, and a lasting commitment to others."
            >
              <p>
                The tournament brings together friends, teammates, sponsors,
                and supporters to celebrate Chad’s life and continue the impact
                he made throughout the Special Operations community.
              </p>
            </SectionHeading>

            <Link
              href="/about"
              className="mt-8 inline-flex font-semibold text-[var(--brand-blue)] hover:underline"
            >
              Read Chad’s story →
            </Link>
          </div>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--golf-green)]">
              Memorial Tournament
            </p>

            <h3 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
              Built around service, fellowship, and community.
            </h3>

            <p className="mt-6 leading-7 text-slate-600">
              This annual event honors Chad’s legacy while supporting The Honor
              Foundation Fort Bragg Chapters and those connected to the Joint
              Special Operations community.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}