import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

export default function AboutPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-20 text-white md:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              <Image
                src="/images/chad/chad-headshot.jpg"
                alt="Sergeant Major Chad Miller"
                width={900}
                height={1100}
                priority
                className="h-auto w-full"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Remembering Sergeant Major Chad Miller
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
                A Life of Leadership, Service, and Family
              </h1>

              <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-300">
                The Sergeant Major Chad Miller Memorial Golf Tournament honors
                a remarkable leader, devoted family man, mentor, and friend
                whose influence continues to inspire the people who knew and
                served beside him.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <Image
              src="/images/chad/chad-family.jpg"
              alt="Chad Miller with his family"
              width={900}
              height={700}
              className="h-auto w-full rounded-3xl shadow-xl"
            />

            <SectionHeading
              eyebrow="More Than a Soldier"
              title="A husband, father, mentor, and friend."
            >
              <p>
                Chad’s military career reflected exceptional leadership, but
                those closest to him remember something even greater: his
                commitment to his family, his teammates, and the people around
                him. His legacy lives on through the countless lives he
                influenced both in and out of uniform.
              </p>
            </SectionHeading>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-24">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Military Service"
                title="Leading from the front."
              >
                <p>
                  Chad dedicated his career to serving the Nation and leading
                  Soldiers with humility, professionalism, and unwavering
                  integrity. Those who served with him remember not only his
                  accomplishments, but the way he made the people around him
                  better.
                </p>
              </SectionHeading>
            </div>

            <Image
              src="/images/chad/chad-team.jpg"
              alt="Chad Miller with his military team"
              width={900}
              height={650}
              className="h-auto w-full rounded-3xl shadow-xl"
            />
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <Image
              src="/images/chad/chad-motorcycle-group.jpg"
              alt="Chad Miller with friends on a motorcycle trip"
              width={900}
              height={650}
              className="h-auto w-full rounded-3xl shadow-xl"
            />

            <SectionHeading
              eyebrow="Beyond the Uniform"
              title="Friendship, adventure, and a full life."
            >
              <p>
                Chad’s life was defined by more than his military service. He
                valued friendship, family, adventure, and the shared experiences
                that bring people together. The tournament reflects that same
                spirit through fellowship, remembrance, and community.
              </p>
            </SectionHeading>
          </div>
        </Container>
      </section>
    </>
  );
}