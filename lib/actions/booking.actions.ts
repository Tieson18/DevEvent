"use server";

import { Booking } from "@/database";
import connectToDatabase from "@/lib/mongodb";

type CreateBookingArgs = {
    eventId: string;
    slug: string;
    email: string;
};

export const createBooking = async ({
    eventId,
    slug,
    email,
}: CreateBookingArgs) => {
    try {
        await connectToDatabase();

        const booking = await Booking.create({ eventId, slug, email });

        if (!booking) {
            throw new Error("Booking creation failed");
        }

        console.log(`Booking created for event ${eventId} by ${email}`);

        return {
            success: true,
            message: "Booking created successfully",
        };
    } catch (error) {
        console.error("Error creating booking:", error);

        return {
            success: false,
            message: "Failed to create booking",
        };
    }
};
