import { z } from "zod";

const name = z.string().trim().min(2, "Please enter your full name.").max(120);
const email = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200);
const phone = z
  .string()
  .trim()
  .min(7, "Please enter a phone number we can reach you on.")
  .max(40)
  .regex(/^[0-9+().\-\s]+$/, "Please use digits, spaces and + ( ) - only.");

export const bookingSchema = z.object({
  startAt: z.string().datetime({ message: "Please choose a date and time." }),
  name,
  email,
  phone,
  modelInterest: z.string().trim().max(60).default(""),
  condition: z.enum(["new", "cpo", "not_sure"]).default("not_sure"),
  purchaseType: z.enum(["purchase", "lease", "finance", "not_sure"]).default("not_sure"),
  tradeIn: z.enum(["yes", "no"]).default("no"),
  meetingType: z.enum(["in_person", "phone", "video"]).default("in_person"),
  contactMethod: z.enum(["phone", "email", "text"]).default("phone"),
  notes: z.string().trim().max(1500).default(""),
  marketingOptIn: z.literal("on").optional(),
});

export const contactSchema = z.object({
  name,
  email,
  phone: z.union([phone, z.literal("")]).default(""),
  message: z.string().trim().min(10, "Please write a short message (at least 10 characters).").max(3000),
});

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export function formObject(fd: FormData) {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") obj[k] = v;
  return obj;
}
