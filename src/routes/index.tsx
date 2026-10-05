import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "City Homeopathic Clinic — Doctor's Desk" },
      { name: "description", content: "Private medicine and symptom lookup for the clinic doctor." },
      { property: "og:title", content: "City Homeopathic Clinic — Doctor's Desk" },
      { property: "og:description", content: "Private medicine and symptom lookup for the clinic doctor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/search" });
  },
});
