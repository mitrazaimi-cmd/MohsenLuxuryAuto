// Every public detail about Mohsen lives here. Fields marked TODO are still missing
// (see "Open Items" in Mohsen_Luxury_Auto_Brand_Guide.md). Leave them empty until
// the real value is known; the site hides or softly marks anything that is empty.

export const site = {
  name: "Mohsen Luxury Auto",
  slogan: "Expect the Best",
  descriptor: "Premium Mercedes-Benz Sales Specialist",
  location: "Philadelphia, PA",
  timezone: "America/New_York",

  person: {
    firstName: "Mohsen",
    lastName: "", // TODO: Mohsen's last name
    title: "Premium Mercedes-Benz Sales Specialist, Master Certified",
    languages: ["English", "Farsi", "Some Spanish"],
  },

  contact: {
    phone: "", // TODO: e.g. "(610) 555-0123"
    email: "", // TODO: e.g. "mohsen@mohsenluxuryauto.com"
    dealershipName: "", // TODO: optional, per the brand guide
    address: "", // TODO: full dealership street address
  },

  social: {
    instagram: "", // TODO: full profile URL
    linkedin: "", // TODO
    facebook: "", // TODO
  },

  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  stats: [
    { value: "20", unit: "yrs", label: "With Mercedes-Benz" },
    { value: "~20", unit: "", label: "Cars delivered every month" },
    { value: "80–85", unit: "%", label: "Of clients come back to buy again" },
    { value: "Master", unit: "", label: "Certified sales specialist" },
  ],

  models: ["GLC", "GLE", "AMG", "EQ electric", "Maybach", "Other / not sure"],
} as const;

export function fullName() {
  return [site.person.firstName, site.person.lastName].filter(Boolean).join(" ");
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
