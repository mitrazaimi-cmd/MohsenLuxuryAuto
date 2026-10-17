"use client";

import { useActionState } from "react";
import { loginAction, type AdminState } from "@/actions/admin";

export function LoginForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(loginAction, {});
  return (
    <form action={action} className="form">
      {state.message ? (
        <div className="notice error-notice" role="alert">
          {state.message}
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="username" defaultValue={state.email} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
      </div>
      <button type="submit" className="btn btn-gold btn-block" disabled={pending} aria-disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
