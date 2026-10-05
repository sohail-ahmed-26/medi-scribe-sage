import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Materia Clinic — Doctor's Desk" },
      { name: "description", content: "Private medicine and symptom lookup for the clinic doctor." },
      { property: "og:title", content: "Materia Clinic — Doctor's Desk" },
      { property: "og:description", content: "Private medicine and symptom lookup for the clinic doctor." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/search" });
  },
});
