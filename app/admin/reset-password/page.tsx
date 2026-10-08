"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ResetPasswordPage() {
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveryCode: form.get("recoveryCode"),
          email: form.get("email"),
          password,
        }),
      });
      const result = await response.json();
      setSuccess(response.ok);
      setMessage(result.ok ?? result.error ?? "Password recovery could not be completed.");
    } catch {
      setMessage("Connection problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell page" style={{ maxWidth: 520, paddingTop: 68 }}>
      <div className="form-wrap">
        <p className="kicker">P&amp;K BOOK STORE · ACCOUNT RECOVERY</p>
        <h1 className="page-title">Reset your password</h1>
        <p className="lede">Use the private recovery code from your original store setup. Your active admin sessions will be signed out.</p>
        {success ? (
          <div className="success-box" role="status">
            {message} <Link className="text-link" href="/admin">Go to sign in →</Link>
          </div>
        ) : (
          <form className="form-card" onSubmit={submit}>
            <div className="field">
              <label htmlFor="email">Admin email</label>
              <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="recoveryCode">Private recovery code</label>
              <input id="recoveryCode" name="recoveryCode" type="password" autoComplete="off" required minLength={32} maxLength={128} />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="password">New password (at least 20 characters)</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={20} maxLength={256} />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={20} maxLength={256} />
            </div>
            {message && <p className="error-text" role="alert">{message}</p>}
            <button className="button" style={{ marginTop: 18 }} disabled={busy} type="submit">
              {busy ? "Updating password…" : "Reset password"}
            </button>
            <p className="tiny" style={{ marginTop: 12 }}><Link className="text-link" href="/admin">Back to sign in</Link></p>
          </form>
        )}
      </div>
    </main>
  );
}
