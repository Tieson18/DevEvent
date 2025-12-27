import EventDetails from "@/components/EventDetails";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ slug: string }>;
};
const EventDetailPage = async ({ params, }: PageProps) => {
  const slug = params.then(p => p.slug);
  console.log("SLUG", slug);

  return (
    <main>
      <Suspense fallback={<div>Loading event details...</div>}>
        <EventDetails params={slug} />
      </Suspense>
    </main>
  )
};

export default EventDetailPage;
