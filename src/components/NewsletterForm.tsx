"use client";

import { useState } from "react";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setMsg("You're on the list.");
      setEmail("");
    } else {
      setMsg("Use a valid email.");
    }
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={`min-w-0 flex-1 rounded-full border px-4 py-2 text-sm text-ink ${
            dark ? "border-white/20 bg-white" : "border-line bg-panel"
          }`}
        />
        <button className="btn shrink-0 text-sm" type="submit">
          Join
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
    </form>
  );
}
