export default function TournamentPage() {
  return (
    <main className="bg-white px-6 py-24">
      <section className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-teal-600">
          Tournament Information
        </p>

        <h1 className="text-5xl font-bold text-gray-900">
          Sergeant Major Chad Miller Memorial Golf Tournament
        </h1>

        <p className="mt-8 text-lg leading-8 text-gray-600">
          Join us for a day of golf, fellowship, and remembrance at Hyland Golf
          Club in Southern Pines, North Carolina.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">

          <div className="rounded-lg border p-8">
            <h2 className="text-2xl font-bold">Location</h2>

            <p className="mt-4 text-gray-600">
              Hyland Golf Club
              <br />
              Southern Pines, North Carolina
            </p>
          </div>

          <div className="rounded-lg border p-8">
            <h2 className="text-2xl font-bold">Tournament Format</h2>

            <p className="mt-4 text-gray-600">
              Four-person scramble
              <br />
              (Subject to change)
            </p>
          </div>

          <div className="rounded-lg border p-8">
            <h2 className="text-2xl font-bold">Schedule</h2>

            <ul className="mt-4 space-y-2 text-gray-600">
              <li>Player Check-In</li>
              <li>Range Opens</li>
              <li>Opening Ceremony</li>
              <li>Shotgun Start</li>
              <li>Awards Reception</li>
            </ul>
          </div>

          <div className="rounded-lg border p-8">
            <h2 className="text-2xl font-bold">Included</h2>

            <ul className="mt-4 space-y-2 text-gray-600">
              <li>18 Holes of Golf</li>
              <li>Golf Cart</li>
              <li>Player Gift</li>
              <li>Lunch</li>
              <li>Awards Reception</li>
            </ul>
          </div>

        </div>
      </section>
    </main>
  );
}