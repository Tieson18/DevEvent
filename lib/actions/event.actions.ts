"use server";

import { Event } from "@/database";
import connectToDatabase from "../mongodb";

export const getSimilarEvents = async (slug: string) => {
    try {
        await connectToDatabase();
        const event = await Event.findOne({ slug }).lean();

        if (!event) {
            throw new Error("Event not found");
        }
        return await Event.find({ _id: { $ne: event._id }, tags: { $in: event.tags } })
            .limit(3).lean();
    } catch (error) {
        console.error("Error fetching similar events:", error);
        return [];
    }
};
