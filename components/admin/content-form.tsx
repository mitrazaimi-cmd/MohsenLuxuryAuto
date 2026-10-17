"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveContentAction, type AdminState } from "@/actions/admin";
import type { ContentKind } from "@/lib/db/types";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "image" | "select";
  required?: boolean;
  options?: readonly string[];
  hint?: string;
}

// Add / edit form for one portfolio item, testimonial or client story.
export function ContentForm({
  kind,
  fields,
  item,
  submitLabel,
}: {
  kind: ContentKind;
  fields: FieldDef[];
  item?: Record<string, unknown>;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveContentAction, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && !item) form.current?.reset();
  }, [state, item]);
  const uid = String(item?.id ?? "new");

  return (
    <form ref={form} action={action} className="form" encType="multipart/form-data">
      <input type="hidden" name="kind" value={kind} />
      {item ? <input type="hidden" name="id" value={String(item.id)} /> : null}
      {fields.map((f) => {
        const id = `${uid}-${f.name}`;
        const val = item?.[f.name];
        return (
          <div className="field" key={f.name}>
            <label htmlFor={id}>
              {f.label}
              {f.required ? <span className="req" aria-hidden="true">*</span> : null}
            </label>
            {f.type === "textarea" ? (
              <textarea id={id} name={f.name} className="textarea" required={f.required} defaultValue={String(val ?? "")} />
            ) : f.type === "select" ? (
              <select id={id} name={f.name} className="select" defaultValue={String(val ?? "")}>
                <option value="">None</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : f.type === "image" ? (
              <>
                {val ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={String(val)} alt="" className="thumb" />
                ) : null}
                <input type="hidden" name="imageUrl" value={String(val ?? "")} />
                <input id={id} name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="input" required={f.required && !val} />
              </>
            ) : (
              <input id={id} name={f.name} className="input" required={f.required} defaultValue={String(val ?? "")} />
            )}
            {f.hint ? <span className="hint">{f.hint}</span> : null}
          </div>
        );
      })}
      <div className="form-row">
        <div className="field">
          <label htmlFor={`${uid}-sortOrder`}>Order</label>
          <input id={`${uid}-sortOrder`} name="sortOrder" type="number" className="input" defaultValue={Number(item?.sortOrder ?? 0)} />
        </div>
        <label className="checkbox" style={{ alignSelf: "end", paddingBottom: 12 }}>
          <input type="checkbox" name="published" defaultChecked={item ? Boolean(item.published) : true} />
          <span>Published on the website</span>
        </label>
      </div>
      {state.message ? (
        <div className={`notice ${state.ok ? "ok-notice" : "error-notice"}`} role={state.ok ? "status" : "alert"}>
          {state.message}
        </div>
      ) : null}
      <div>
        <button type="submit" className="btn btn-gold btn-sm" disabled={pending} aria-disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
