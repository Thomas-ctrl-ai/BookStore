"use client";

import { useState, type FormEvent } from "react";

export default function AdminSetupPage() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setMessage("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupToken: form.get("setupToken"),
          email: form.get("email"),
          password,
        }),
      });
      const result = await response.json();
      setSuccess(response.ok);
      setMessage(result.ok ?? result.error ?? "Setup could not be completed.");
    } catch {
      setMessage("Connection problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell page">
      <div className="form-wrap">
        <p className="kicker">P&amp;K BOOK STORE · OWNER SETUP</p>
        <h1 className="page-title">Create your admin account</h1>
        <p className="lede">This one-time setup closes as soon as the first owner account is created.</p>
        {success ? (
          <div className="success-box" role="status">
            {message} <a className="text-link" href="/admin">Go to admin sign in →</a>
          </div>
        ) : (
          <form className="form-card" onSubmit={submit}>
            <div className="field">
              <label htmlFor="setupToken">One-time setup code</label>
              <input id="setupToken" name="setupToken" type="password" autoComplete="off" required minLength={32} maxLength={128} />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="email">Admin email</label>
              <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="password">Password (at least 20 characters)</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={20} maxLength={256} />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={20} maxLength={256} />
            </div>
            {message && <p className="error-text" role="alert">{message}</p>}
            <button className="button" style={{ marginTop: 18 }} disabled={busy} type="submit">
              {busy ? "Creating account…" : "Create admin account"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
