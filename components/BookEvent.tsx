'use client'
import { useState } from "react"
const BookEvent = () => {
    const [email, setEmail] = useState('')
    const [sumitted, setSubmitted] = useState(false)

    return (
        <div id="book-event">
            {!sumitted ? (
                <form onSubmit={(e) => {
                    e.preventDefault()
                    setSubmitted(true)
                }}>
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