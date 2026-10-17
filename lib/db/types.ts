import type { Weekday } from "@/lib/time";

export type BookingStatus = "upcoming" | "completed" | "cancelled" | "no_show";
export type ContentKind = "portfolio_items" | "testimonials" | "client_stories";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  consentAt: string | null;
  unsubscribed: boolean;
  unsubscribeToken: string;
  source: "booking" | "contact_form";
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  contactId: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  modelInterest: string;
  condition: "new" | "cpo" | "not_sure";
  purchaseType: "purchase" | "lease" | "finance" | "not_sure";
  tradeIn: boolean;
  meetingType: "in_person" | "phone" | "video";
  contactMethod: "phone" | "email" | "text";
  notes: string;
  adminNote: string;
  googleEventId: string | null;
  manageToken: string;
  reminderSentAt: string | null;
  followupSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithContact extends Booking {
  contact: Contact;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  clientFirstName: string;
  model: string;
  caption: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  clientName: string;
  model: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ClientStory {
  id: string;
  title: string;
  clientFirstName: string;
  model: string;
  need: string;
  recommendation: string;
  result: string;
  imageUrl: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ContentMap {
  portfolio_items: PortfolioItem;
  testimonials: Testimonial;
  client_stories: ClientStory;
}

export interface EmailLog {
  id: string;
  contactId: string | null;
  bookingId: string | null;
  type: EmailType;
  to: string;
  subject: string;
  status: "sent" | "preview" | "failed";
  providerId: string | null;
  error: string | null;
  createdAt: string;
}

export type EmailType =
  | "booking_confirmation"
  | "booking_notification"
  | "reminder"
  | "followup"
  | "cancellation"
  | "reschedule"
  | "contact_notification";

export interface WorkingHours {
  start: string; // "09:00"
  end: string; // "18:00"
}

export interface Settings {
  slotMinutes: number;
  bufferMinutes: number;
  windowDays: number;
  minNoticeHours: number;
  workingHours: Record<Weekday, WorkingHours | null>;
  blockedDates: string[]; // "YYYY-MM-DD"
  notificationEmail: string;
}

export const defaultSettings: Settings = {
  slotMinutes: 45,
  bufferMinutes: 15,
  windowDays: 30,
  minNoticeHours: 12,
  workingHours: {
    mon: { start: "09:00", end: "18:00" },
    tue: { start: "09:00", end: "18:00" },
    wed: { start: "09:00", end: "18:00" },
    thu: { start: "09:00", end: "18:00" },
    fri: { start: "09:00", end: "18:00" },
    sat: { start: "10:00", end: "16:00" },
    sun: null,
  },
  blockedDates: [],
  notificationEmail: "",
};

export class SlotTakenError extends Error {
  constructor() {
    super("That time was just booked by someone else.");
  }
}

export interface NewBooking {
  contactId: string;
  startAt: string;
  endAt: string;
  modelInterest: string;
  condition: Booking["condition"];
  purchaseType: Booking["purchaseType"];
  tradeIn: boolean;
  meetingType: Booking["meetingType"];
  contactMethod: Booking["contactMethod"];
  notes: string;
}

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  source: Contact["source"];
}

/** The storage contract. Both the local file store and Supabase implement it. */
export interface Store {
  upsertContact(input: ContactInput): Promise<Contact>;
  getContact(id: string): Promise<Contact | null>;
  listContacts(q?: string): Promise<Contact[]>;
  unsubscribe(token: string): Promise<Contact | null>;

  createBooking(input: NewBooking): Promise<Booking>; // throws SlotTakenError on overlap
  getBooking(id: string): Promise<BookingWithContact | null>;
  getBookingByToken(token: string): Promise<BookingWithContact | null>;
  listBookings(filter: { from?: string; to?: string; status?: BookingStatus }): Promise<BookingWithContact[]>;
  listActiveBookingsBetween(from: string, to: string): Promise<Booking[]>;
  updateBooking(id: string, patch: Partial<Booking>): Promise<Booking>; // throws SlotTakenError on overlap

  createMessage(input: Omit<ContactMessage, "id" | "read" | "createdAt">): Promise<ContactMessage>;
  listMessages(): Promise<ContactMessage[]>;
  setMessageRead(id: string, read: boolean): Promise<void>;

  listContent<K extends ContentKind>(kind: K, opts?: { publishedOnly?: boolean }): Promise<ContentMap[K][]>;
  saveContent<K extends ContentKind>(kind: K, item: Partial<ContentMap[K]> & { id?: string }): Promise<ContentMap[K]>;
  deleteContent(kind: ContentKind, id: string): Promise<void>;

  logEmail(entry: Omit<EmailLog, "id" | "createdAt">): Promise<void>;
  listEmailLog(bookingId?: string): Promise<EmailLog[]>;

  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;

  saveMedia(file: File): Promise<string>; // returns a public URL
}
