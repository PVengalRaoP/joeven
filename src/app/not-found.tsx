import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="text-sm font-medium text-jv-dark">404</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Lost the thread</h1>
      <p className="mt-3 text-muted">That URL is not in the Joeven academy.</p>
      <Link href="/" className="btn mt-8">
        Go home
      </Link>
    </main>
  );
}
