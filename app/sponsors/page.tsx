export default function SponsorsPage() {
  return (
    <main className="bg-white px-6 py-24">
      <section className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-teal-600">
          Sponsorship
        </p>

        <h1 className="text-5xl font-bold text-gray-900">
          Become a Sponsor
        </h1>

        <p className="mt-8 text-lg leading-8 text-gray-600">
          Help us honor Sergeant Major Chad Miller while supporting The Honor
          Foundation Fort Bragg Chapter and the Joint Special Operations
          community.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">

          <div className="rounded-lg border p-8">
            <h2 className="text-2xl font-bold">Title Sponsor</h2>
            <p className="mt-4 text-gray-600">
              Premier recognition throughout the tournament.
            </p>
          </div>

          <div className="rounded-lg border p-8">
            <h2 className="text-2xl font-bold">Gold Sponsor</h2>
            <p className="mt-4 text-gray-600">
              Prominent branding and event recognition.
            </p>
          </div>

          <div className="rounded-lg border p-8">
            <h2 className="text-2xl font-bold">Hole Sponsor</h2>
            <p className="mt-4 text-gray-600">
              Showcase your organization on the course.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}