import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

// GET all bookings
export async function GET() {
  try {
    const { rows } = await sql`
      SELECT email, date
      FROM bookings
      ORDER BY date, email
    `

    // Transform to the format expected by frontend: { date: [email1, email2] }
    const bookings = {}
    rows.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0]
      if (!bookings[dateStr]) {
        bookings[dateStr] = []
      }
      bookings[dateStr].push(row.email)
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

// POST create or delete booking
export async function POST(request) {
  try {
    const { email, date, action } = await request.json()

    if (!email || !date || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'book') {
      // Check if already booked
      const { rows } = await sql`
        SELECT * FROM bookings WHERE email = ${email} AND date = ${date}
      `

      if (rows.length > 0) {
        return NextResponse.json({ error: 'Already booked' }, { status: 400 })
      }

      // Create booking
      await sql`
        INSERT INTO bookings (email, date)
        VALUES (${email}, ${date})
      `

      return NextResponse.json({ success: true, action: 'booked' })
    } else if (action === 'unbook') {
      // Delete booking
      await sql`
        DELETE FROM bookings WHERE email = ${email} AND date = ${date}
      `

      return NextResponse.json({ success: true, action: 'unbooked' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 })
  }
}
