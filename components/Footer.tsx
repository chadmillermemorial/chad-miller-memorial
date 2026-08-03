export default function Footer() {
  return (
    <footer className="bg-gray-900 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-xl font-semibold">
          Sergeant Major Chad Miller Memorial Golf Tournament
        </h2>

        <p className="mt-3 text-sm text-gray-400">
          Honoring a legacy of service, leadership, and commitment.
        </p>

        <p className="mt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} Chad Miller Memorial Golf Tournament.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}