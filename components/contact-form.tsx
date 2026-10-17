"use client";

import { useActionState } from "react";
import { sendContactAction, type FormState } from "@/actions/public";
import { Field, useBlurErrors } from "./field";
import { ArrowRight } from "./icons";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactAction, {});
  const { onBlur, errorFor, describedBy } = useBlurErrors(state.errors);
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="notice ok-notice" role="status">
        {state.message}
      </div>
    );
  }

  return (
    <form action={action} className="form" noValidate={false}>
      {state.message && !state.ok ? (
        <div className="notice error-notice" role="alert">
          {state.message}
        </div>
      ) : null}
      <div className="hp" aria-hidden="true">
        <label htmlFor="c-company">Company</label>
        <input id="c-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-row">
        <Field id="name" label="Full name" required error={errorFor("name")}>
          <input id="name" name="name" className="input" required minLength={2} autoComplete="name" defaultValue={v.name} onBlur={onBlur} aria-invalid={!!errorFor("name")} aria-describedby={describedBy("name")} />
        </Field>
        <Field id="email" label="Email" required error={errorFor("email")}>
          <input id="email" name="email" type="email" className="input" required autoComplete="email" defaultValue={v.email} onBlur={onBlur} aria-invalid={!!errorFor("email")} aria-describedby={describedBy("email")} />
        </Field>
      </div>
      <Field id="phone" label="Phone" hint="Optional" error={errorFor("phone")}>
        <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" inputMode="tel" defaultValue={v.phone} onBlur={onBlur} aria-invalid={!!errorFor("phone")} aria-describedby={describedBy("phone", true)} />
      </Field>
      <Field id="message" label="Message" required error={errorFor("message")}>
        <textarea id="message" name="message" className="textarea" required minLength={10} defaultValue={v.message} onBlur={onBlur} aria-invalid={!!errorFor("message")} aria-describedby={describedBy("message")} />
      </Field>
      <div>
        <button type="submit" className="btn btn-gold" disabled={pending} aria-disabled={pending}>
          {pending ? (
            <>
              <span className="spinner" aria-hidden="true" /> Sending
            </>
          ) : (
            <>
              Send message <ArrowRight />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
