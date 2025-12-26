'use client'
import { createBooking } from "@/lib/actions/booking.actions"
import posthog from "posthog-js";
import { useState } from "react"

const BookEvent = ({ eventId, slug }: { eventId: string; slug: string }) => {
    const [email, setEmail] = useState('')
    const [sumitted, setSubmitted] = useState(false)

    const handleSumit = async (e: React.FormEvent) => {
        e.preventDefault()
        const { success, message } = await createBooking({ eventId, slug, email })
        if (success) {
            setSubmitted(true)
            posthog.capture('event_booked', { eventId, slug, email })
        } else {
            console.error("ERROR", message)
            posthog.captureException(message)
        }
    }

    return (
        <div id="book-event">
            {!sumitted ? (
                <form onSubmit={handleSumit}>
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                        />
                        <button type="submit" className="button-submit">Book Now</button>
                    </div>
                </form>
            ) : (
                <p>Thank you for booking!</p>
            )}
        </div>
    )
}

export default BookEvent