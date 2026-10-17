"use client";

import { useState, type ReactNode } from "react";

// Labeled field with the error shown directly under it. Validates on blur
// (native constraints) so problems surface before submit.
export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="req" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <span className="hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Tracks blur-time validation messages for native inputs. */
export function useBlurErrors(serverErrors: Record<string, string | undefined> = {}) {
  const [local, setLocal] = useState<Record<string, string>>({});
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const el = e.currentTarget;
    const msg = el.value === "" && !el.required ? "" : el.validity.valid ? "" : friendly(el);
    setLocal((prev) => ({ ...prev, [el.name]: msg }));
  };
  const errorFor = (name: string) => local[name] || serverErrors[name];
  const describedBy = (name: string, hasHint = false) =>
    errorFor(name) ? `${name}-error` : hasHint ? `${name}-hint` : undefined;
  return { onBlur, errorFor, describedBy };
}

function friendly(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  if (el.validity.valueMissing) return "This field is required.";
  if (el.validity.typeMismatch && el.getAttribute("type") === "email") return "Please enter a valid email address.";
  if (el.validity.tooShort) return `Please enter at least ${el.getAttribute("minlength")} characters.`;
  if (el.validity.patternMismatch) return el.getAttribute("title") || "Please check this field.";
  return el.validationMessage;
}
