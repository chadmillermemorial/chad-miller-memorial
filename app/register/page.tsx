export default function RegisterPage() {
  return (
    <main className="bg-white px-6 py-24">
      <section className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-teal-600">
          Registration
        </p>

        <h1 className="text-5xl font-bold text-gray-900">
          Register to Play
        </h1>

        <p className="mt-8 text-lg leading-8 text-gray-600">
          Registration for the Sergeant Major Chad Miller Memorial Golf
          Tournament will open soon.
        </p>

        <div className="mt-10 rounded-lg border p-8">
          <h2 className="text-2xl font-bold">
            Registration Includes
          </h2>

          <ul className="mt-4 space-y-2 text-gray-600">
            <li>✓ 18 Holes of Golf</li>
            <li>✓ Cart</li>
            <li>✓ Lunch</li>
            <li>✓ Player Gift</li>
            <li>✓ Awards Reception</li>
          </ul>
        </div>
      </section>
    </main>
  );
}