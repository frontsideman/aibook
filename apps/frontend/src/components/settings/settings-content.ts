export const subscriptionContent = {
  label: "Current plan",
  planName: "Family Keepsake",
  detail:
    "40 generated books per month • final PDF downloads included • renews July 1, 2026",
} as const;

export const billingContent = {
  title: "Billing",
  body: "Visa ending 4242 • next invoice $19.00 on July 1.",
} as const;

export const accountFields = [
  {
    label: "Parent name",
    value: "Alicia Hall",
  },
  {
    label: "Email",
    value: "alicia.hall@example.com",
  },
  {
    label: "Default language",
    value: "English",
  },
] as const;

export const notificationRows = [
  {
    title: "Generation complete",
    body: "Email me when a book is ready to review.",
    enabled: true,
  },
  {
    title: "Review reminders",
    body: "Send follow-ups when a draft waits too long for approval.",
    enabled: true,
  },
  {
    title: "Billing notices",
    body: "Warn me about renewals, receipts, and payment issues.",
    enabled: false,
  },
] as const;

export const dangerZoneContent = {
  title: "Danger zone",
  body:
    "Account deletion removes profiles, generated drafts, review history, and billing access. Final downloaded PDFs remain on your device only.",
  confirmationTitle: "Confirm account deletion",
  confirmationBody: "Type DELETE to confirm. This cannot be undone.",
  confirmationValue: "DELETE",
} as const;
