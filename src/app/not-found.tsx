import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <p className="text-sm font-bold text-jv-darker">404</p>
      <h1 className="mt-2 text-4xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-muted">
        That URL is not in the Joeven curriculum.
      </p>
      <Link href="/" className="green-btn mt-6">
        Go home
      </Link>
    </main>
  );
}
