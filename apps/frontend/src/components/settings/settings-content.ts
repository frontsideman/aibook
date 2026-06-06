export const subscriptionContent = {
  label: "Subscription",
  planName: "Story Starter",
  detail: "Billed monthly and ready for small teams.",
} as const;

export const billingContent = {
  title: "Billing",
  body: "Billing details are shown here as read-only static copy.",
} as const;

export const accountFields = [
  {
    label: "Parent name",
    value: "Avery Reader",
    detail: "Shown on invoices and account communication.",
  },
  {
    label: "Email",
    value: "avery@example.com",
    detail: "Used for login and billing notices.",
  },
  {
    label: "Default language",
    value: "English",
    detail: "Applies to new books and alerts.",
  },
] as const;

export const notificationRows = [
  {
    title: "Generation complete",
    description: "Notify me when a book is ready to review.",
    enabled: true,
  },
  {
    title: "Review reminders",
    description: "Send reminders when a draft is waiting on feedback.",
    enabled: true,
  },
  {
    title: "Billing notices",
    description: "Alert me when payment receipts or invoice updates are available.",
    enabled: false,
  },
] as const;

export const dangerZoneContent = {
  title: "Danger zone",
  body: "Account deletion is presented as disabled static UI in this prototype.",
  confirmationTitle: "Confirm account deletion",
  confirmationBody: "Type the confirmation value below before continuing.",
  confirmationValue: "DELETE",
} as const;
