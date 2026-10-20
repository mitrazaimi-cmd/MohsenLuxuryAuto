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
    lastName: "Mohimani",
    title: "Premium Mercedes-Benz Sales Specialist, Master Certified",
    languages: ["English", "Farsi", "Some Spanish"],
  },

  contact: {
    phone: "717-917-1938",
    email: "MohsenLuxuryAuto@gmail.com",
    dealershipName: "Mercedes-Benz of West Chester",
    address: "1260 Wilmington Pike, West Chester, PA 19382",
    addressParts: { street: "1260 Wilmington Pike", city: "West Chester", region: "PA", postalCode: "19382" },
  },

  social: {
    instagram: "https://www.instagram.com/mohsenluxuryauto/",
    linkedin: "https://www.linkedin.com/in/mohsen-mohimani-4a962636/",
    facebook: "", // TODO: page URL for "Mohsen Luxury Auto"
  },

  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  stats: [
    { value: "20", unit: "yrs", label: "In luxury automotive sales" },
    { value: "~20", unit: "", label: "Cars delivered every month" },
    { value: "80–85", unit: "%", label: "Of clients come back to buy again" },
    { value: "Master", unit: "", label: "Certified sales specialist" },
  ],

  models: ["GLC", "GLE", "AMG", "EQ electric", "Maybach", "Other / not sure"],
} as const;

export function fullName() {
  return [site.person.firstName, site.person.lastName].filter(Boolean).join(" ");
}

/** "@handle" from a profile URL such as https://www.instagram.com/handle/ */
export function socialHandle(url: string) {
  const handle = url.split("/").filter(Boolean).pop();
  return handle ? `@${handle}` : "";
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
