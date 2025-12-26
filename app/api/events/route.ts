import { Event } from "@/database";
import connectToDatabase from "@/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

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
