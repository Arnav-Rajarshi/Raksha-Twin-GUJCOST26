import { createFileRoute } from "@tanstack/react-router";
import { getDashboardSnapshot } from "@/services/Dashboard_Service";
import { Dashboard } from "@/pages/Dashboard";

export const Route = createFileRoute("/")({
  loader: () => getDashboardSnapshot(),
  head: () => ({
    meta: [
      { title: "RAKSHA-TWIN | Mission Control" },
      { name: "description", content: "Live aerial-ground disaster response mission monitoring console." },
      { property: "og:title", content: "RAKSHA-TWIN Mission Control" },
      { property: "og:description", content: "Operational dashboard for hybrid aerial-ground disaster response." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const data = Route.useLoaderData();
  return <Dashboard data={data} />;
}
