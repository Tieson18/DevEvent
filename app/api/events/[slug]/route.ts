import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import connectToDatabase from "../../../../lib/mongodb";
import { Event } from "../../../../database";

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * GET /api/events/[slug]
 *
 * Returns a single event by its slug.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  // Basic validation for slug parameter.
  if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
    return NextResponse.json(
      { message: 'Invalid or missing "slug" parameter.' },
      { status: 400 }
    );
  }

  try {
    // Ensure database connection is established before querying.
    await connectToDatabase();

    const normalizedSlug = slug.trim().toLowerCase();

    const event = await Event.findOne({ slug: normalizedSlug }).lean().exec();

    if (!event) {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 }
      );
    }

    // Successful response with event payload.
    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    // Log and return a generic error response without leaking internals.
    console.error("Error fetching event by slug:", error);

    return NextResponse.json(
      { message: "An unexpected error occurred while fetching the event." },
      { status: 500 }
    );
  }
}
