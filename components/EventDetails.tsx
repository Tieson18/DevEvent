import React from 'react'
import BookEvent from './BookEvent';
import EventCard from './EventCard';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { IEvent } from '@/database';
import { getSimilarEvents } from '@/lib/actions/event.actions';
import { cacheLife } from 'next/cache';

const EventDetailItem = ({ icon, alt, label, }: { icon: string; alt: string; label: string; }) => (
    <div className="flex items-center gap-2">
        <Image src={icon} alt={alt} width={17} height={17} />
        <span>{label}</span>
    </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
    <div className="agenda">
        <h2>Agenda</h2>
        <ul>
            {agendaItems.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    </div>
);

const EventTag = ({ tags }: { tags: string[] }) => (
    <div className="flex flex-row gap-1.5 flex-wrap">
        {tags.map((tag) => (
            <span key={tag} className="pill">#{tag}</span>
        ))}
    </div>
);

const EventDetails = async ({ params }: { params: Promise<string> }) => {
    "use cache";
    cacheLife("hours")
    const slug = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events/${slug}`, {
        next: { revalidate: 60 },
    });

    if (res.status === 404) {
        return notFound();
    }

    const data = await res.json();


    if (!res.ok) {
        console.error("Failed to fetch event", { status: res.status, body: data });
        throw new Error("Failed to load event");
    }

    const eventItems = [
        { icon: "/icons/calendar.svg", alt: "calendar", label: data.date },
        { icon: "/icons/clock.svg", alt: "clock", label: data.time },
        { icon: "/icons/pin.svg", alt: "location", label: data.location },
        { icon: "/icons/mode.svg", alt: "mode", label: data.mode },
        { icon: "/icons/audience.svg", alt: "audience", label: data.audience },
    ];

    const bookings = 10

    const similarEvents: IEvent[] = await getSimilarEvents(slug);


    return (
        <section id="event">
            <div className="header">
                <h1>Event Description</h1>
                <p>{data.description}</p>
            </div>
            <div className="details">
                {/* Left Side - Event Content */}
                <div className="content">
                    <Image src={data.image} alt={data.title} width={800} height={800} className="banner" />
                    <section className="flex-col-gap-2">
                        <h2>Overview</h2>
                        <p>{data.overview}</p>
                    </section>
                    <section className="flex-col-gap-2">
                        <h2>Event Details</h2>
                        {eventItems.map((item) => (
                            <EventDetailItem
                                key={item.label}
                                icon={item.icon}
                                alt={item.alt}
                                label={item.label}
                            />
                        ))}
                    </section>
                    <EventAgenda agendaItems={data.agenda} />
                    <section className="flex-col-gap-2">
                        <h2>About Organizer</h2>
                        <p>{data.organizer}</p>
                    </section>
                    <EventTag tags={data.tags} />
                </div>
                {/* Right Side - Booking Form */}
                <aside className="booking">
                    <div className="signup-card">
                        <h2>Book Your Spot</h2>
                        {bookings > 0 ? (
                            <p className="text-sm">join {bookings} people who have booked this event</p>
                        ) : (
                            <p className="text-sm">Be the first to book this event</p>
                        )}
                        {/* Booking form component can be placed here */}
                        <BookEvent eventId={data._id} slug={data.slug} />
                    </div>
                </aside>
            </div>
            <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="flex flex-wrap gap-4">
                    <div className="event">
                        {similarEvents.length > 0 && similarEvents.map((similarEvent, i) => (
                            <EventCard key={i} {...similarEvent} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default EventDetails