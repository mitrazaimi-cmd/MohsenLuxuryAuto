"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createBookingAction, type FormState } from "@/actions/public";
import { Field, useBlurErrors } from "./field";
import { ArrowLeft, ArrowRight, Check } from "./icons";
import { formatSlot, SlotPicker } from "./slot-picker";

const MODELS = ["GLC", "GLE", "AMG", "EQ electric", "Maybach", "Other / not sure"];

function Options({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: [string, string][];
  defaultValue: string;
}) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="options">
        {options.map(([value, label]) => (
          <label key={value} className="option">
            <input type="radio" name={name} value={value} defaultChecked={defaultValue === value} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function BookingFlow({ slotMinutes }: { slotMinutes: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createBookingAction, {});
  const [startAt, setStartAt] = useState(state.values?.startAt ?? "");
  const [step, setStep] = useState<1 | 2>(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const { onBlur, errorFor, describedBy } = useBlurErrors(state.errors);
  const top = useRef<HTMLDivElement>(null);
  const v = state.values ?? {};

  // If the chosen time was taken meanwhile, go back to the calendar with fresh times.
  useEffect(() => {
    if (state.errors?.startAt) {
      setStartAt("");
      setStep(1);
      setRefreshKey((k) => k + 1);
    }
  }, [state]);

  const goto = (s: 1 | 2) => {
    setStep(s);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => top.current?.querySelector<HTMLElement>("h2")?.focus(), 50);
  };

  return (
    <div className="booking-layout" ref={top} style={{ scrollMarginTop: 120 }}>
      <div>
        <ol className="stepper" aria-label="Booking progress">
          <li aria-current={step === 1 ? "step" : undefined} className={step > 1 ? "done" : undefined}>
            <span className="dot">{step > 1 ? <Check width={14} height={14} /> : "1"}</span> Date &amp; time
          </li>
          <li aria-current={step === 2 ? "step" : undefined}>
            <span className="dot">2</span> Your details
          </li>
        </ol>

        {state.message && !state.ok ? (
          <div className="notice error-notice" role="alert" style={{ marginBottom: 28 }}>
            {state.message}
          </div>
        ) : null}

        <div hidden={step !== 1}>
          <h2 className="h3" tabIndex={-1} style={{ fontSize: "1.3rem", marginBottom: 28, outline: "none" }}>
            When suits you?
          </h2>
          <SlotPicker value={startAt} onChange={setStartAt} refreshKey={refreshKey} />
          <div className="actions" style={{ marginTop: 36 }}>
            <button type="button" className="btn btn-gold" disabled={!startAt} aria-disabled={!startAt} onClick={() => goto(2)}>
              Continue <ArrowRight />
            </button>
            {!startAt ? <span className="muted" style={{ fontSize: "0.88rem" }}>Choose a time to continue</span> : null}
          </div>
        </div>

        <form action={action} className="form" hidden={step !== 2}>
          <h2 className="h3" tabIndex={-1} style={{ fontSize: "1.3rem", outline: "none" }}>
            A few details
          </h2>
          <input type="hidden" name="startAt" value={startAt} />
          <div className="hp" aria-hidden="true">
            <label htmlFor="b-company">Company</label>
            <input id="b-company" name="company" tabIndex={-1} autoComplete="off" />
          </div>

          <Field id="name" label="Full name" required error={errorFor("name")}>
            <input id="name" name="name" className="input" required minLength={2} autoComplete="name" defaultValue={v.name} onBlur={onBlur} aria-invalid={!!errorFor("name")} aria-describedby={describedBy("name")} />
          </Field>
          <div className="form-row">
            <Field id="email" label="Email" required error={errorFor("email")}>
              <input id="email" name="email" type="email" className="input" required autoComplete="email" defaultValue={v.email} onBlur={onBlur} aria-invalid={!!errorFor("email")} aria-describedby={describedBy("email")} />
            </Field>
            <Field id="phone" label="Phone" required error={errorFor("phone")}>
              <input id="phone" name="phone" type="tel" className="input" required minLength={7} inputMode="tel" autoComplete="tel" pattern="[0-9+().\-\s]+" title="Please use digits, spaces and + ( ) - only." defaultValue={v.phone} onBlur={onBlur} aria-invalid={!!errorFor("phone")} aria-describedby={describedBy("phone")} />
            </Field>
          </div>

          <Options
            name="meetingType"
            legend="How would you like to meet?"
            defaultValue={v.meetingType ?? "in_person"}
            options={[["in_person", "At the dealership"], ["phone", "Phone call"], ["video", "Video call"]]}
          />

          <div className="form-row">
            <Field id="modelInterest" label="Model of interest">
              <select id="modelInterest" name="modelInterest" className="select" defaultValue={v.modelInterest ?? ""}>
                <option value="">Select a model</option>
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="contactMethod" label="Best way to reach you">
              <select id="contactMethod" name="contactMethod" className="select" defaultValue={v.contactMethod ?? "phone"}>
                <option value="phone">Phone call</option>
                <option value="text">Text message</option>
                <option value="email">Email</option>
              </select>
            </Field>
          </div>

          <Options
            name="condition"
            legend="New or Certified Pre-Owned?"
            defaultValue={v.condition ?? "not_sure"}
            options={[["new", "New"], ["cpo", "Certified Pre-Owned"], ["not_sure", "Not sure yet"]]}
          />
          <Options
            name="purchaseType"
            legend="Are you thinking of"
            defaultValue={v.purchaseType ?? "not_sure"}
            options={[["purchase", "Buying"], ["lease", "Leasing"], ["finance", "Financing"], ["not_sure", "Not sure yet"]]}
          />
          <Options
            name="tradeIn"
            legend="Do you have a trade-in?"
            defaultValue={v.tradeIn ?? "no"}
            options={[["yes", "Yes"], ["no", "No"]]}
          />

          <Field id="notes" label="Anything Mohsen should know?" hint="Optional: timing, budget, features you care about." error={errorFor("notes")}>
            <textarea id="notes" name="notes" className="textarea" maxLength={1500} defaultValue={v.notes} aria-describedby={describedBy("notes", true)} />
          </Field>

          <label className="checkbox">
            <input type="checkbox" name="marketingOptIn" defaultChecked={v.marketingOptIn === "on"} />
            <span>
              Keep me informed about new models and offers. <span className="muted">Optional. Unsubscribe anytime.</span>
            </span>
          </label>
          <p className="muted" style={{ fontSize: "0.84rem" }}>
            You will receive a confirmation, a reminder the day before, and a short follow-up after your consultation.
            See our <a href="/privacy" className="gold">privacy policy</a>.
          </p>

          <div className="actions">
            <button type="button" className="btn btn-outline" onClick={() => goto(1)}>
              <ArrowLeft /> Back
            </button>
            <button type="submit" className="btn btn-gold" disabled={pending || !startAt} aria-disabled={pending || !startAt}>
              {pending ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Confirming
                </>
              ) : (
                <>
                  Confirm booking <ArrowRight />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <aside className="booking-aside" aria-label="Your booking">
        <div className="summary card gold-top">
          <span className="eyebrow">Your consultation</span>
          <dl>
            <div>
              <dt>With</dt>
              <dd>Mohsen, Master Certified Mercedes-Benz specialist</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd aria-live="polite">{startAt ? formatSlot(startAt) : <span className="muted">Choose a time</span>}</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>About {slotMinutes} minutes</dd>
            </div>
          </dl>
          <ul className="check-list" style={{ marginTop: 24, fontSize: "0.9rem" }}>
            {["Every cost disclosed up front", "Purchase, lease and finance compared", "No obligation, no pressure"].map((t) => (
              <li key={t}>
                <Check />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
