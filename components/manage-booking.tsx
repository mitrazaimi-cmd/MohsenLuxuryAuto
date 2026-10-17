"use client";

import { useActionState, useState } from "react";
import { cancelByTokenAction, rescheduleByTokenAction, type FormState } from "@/actions/public";
import { ArrowRight } from "./icons";
import { formatSlot, SlotPicker } from "./slot-picker";

export function ManageBooking({ token, current }: { token: string; current: string }) {
  const [mode, setMode] = useState<"idle" | "reschedule" | "cancel">("idle");
  const [startAt, setStartAt] = useState("");
  const [cancelState, cancelAction, cancelling] = useActionState<FormState, FormData>(cancelByTokenAction, {});
  const [moveState, moveAction, moving] = useActionState<FormState, FormData>(rescheduleByTokenAction, {});

  const done = cancelState.ok ? cancelState : moveState.ok ? moveState : null;
  if (done) {
    return (
      <div className="notice ok-notice" role="status">
        {done.message}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 32 }}>
      {[cancelState, moveState].map((s, i) =>
        s.message && !s.ok ? (
          <div key={i} className="notice error-notice" role="alert">
            {s.message}
          </div>
        ) : null,
      )}

      {mode === "idle" ? (
        <div className="actions">
          <button type="button" className="btn btn-gold" onClick={() => setMode("reschedule")}>
            Choose a new time <ArrowRight />
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setMode("cancel")}>
            Cancel consultation
          </button>
        </div>
      ) : null}

      {mode === "reschedule" ? (
        <form action={moveAction} style={{ display: "grid", gap: 28 }}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="startAt" value={startAt} />
          <SlotPicker value={startAt} onChange={setStartAt} token={token} refreshKey={moveState.errors ? 1 : 0} />
          <p aria-live="polite" className="muted">
            {startAt ? <>New time: <strong>{formatSlot(startAt)}</strong> (currently {formatSlot(current)})</> : "Choose a new day and time."}
          </p>
          <div className="actions">
            <button type="button" className="btn btn-outline" onClick={() => setMode("idle")}>
              Back
            </button>
            <button type="submit" className="btn btn-gold" disabled={!startAt || moving} aria-disabled={!startAt || moving}>
              {moving ? <><span className="spinner" aria-hidden="true" /> Saving</> : <>Confirm new time <ArrowRight /></>}
            </button>
          </div>
        </form>
      ) : null}

      {mode === "cancel" ? (
        <form action={cancelAction} className="card" style={{ display: "grid", gap: 20 }}>
          <input type="hidden" name="token" value={token} />
          <p className="lede" style={{ fontSize: "1.05rem" }}>Cancel your consultation on {formatSlot(current)}?</p>
          <div className="actions">
            <button type="button" className="btn btn-outline" onClick={() => setMode("idle")}>
              Keep my booking
            </button>
            <button type="submit" className="btn btn-danger" disabled={cancelling} aria-disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Yes, cancel it"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
