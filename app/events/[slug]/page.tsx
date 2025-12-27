import EventDetails from "@/components/EventDetails";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ slug: string }>;
};
const EventDetailPage = async ({ params, }: PageProps) => {
  const slug = params.then(p => p.slug);

  return (
    <main>
      <Suspense fallback={<div>Loading event details...</div>}>
        <EventDetails params={slug} />
      </Suspense>
    </main>
  )
};

export default EventDetailPage;
