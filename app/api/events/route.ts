import { Event } from "@/database";
import connectToDatabase from "@/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Configure Cloudinary using environment variables. Require either
// CLOUDINARY_URL or the triple CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.
const {
  CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (CLOUDINARY_URL) {
  cloudinary.config({ secure: true, url: CLOUDINARY_URL });
} else if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  throw new Error(
    "Missing Cloudinary configuration. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "Image is required" },
        { status: 400 }
      );
    }

    // Validate file type and size before any heavy processing
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Only image uploads are allowed" },
        { status: 400 }
      );
    }

    if (typeof file.size !== "number" || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Image file is too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Convert FormData to object
    const event = Object.fromEntries(formData.entries());
    delete event.image; // prevent raw file from being saved
    const tags = JSON.parse(event.tags as string);
    const agenda = JSON.parse(event.agenda as string);

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise<{
      secure_url: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "DevEvent" },
          (error, results) => {
            if (error) return reject(error);
            if (!results) return reject(new Error("No upload result"));
            resolve(results as { secure_url: string });
          }
        )
        .end(buffer);
    });

    event.image = uploadResult.secure_url;
    event.tags = tags;
    event.agenda = agenda;
    const createdEvent = await Event.create(event);

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (e) {
    console.error("Error in POST /events route:", e);

    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const events = await Event.find().sort({ createdAt: -1 }).exec();

    return NextResponse.json(
      { message: "Events retrieved successfully", events },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error in GET /events route:", e);
    return NextResponse.json(
      {
        message: "Events retrieval failed",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
