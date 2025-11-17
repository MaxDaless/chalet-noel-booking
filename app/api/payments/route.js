import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

// GET all payments
export async function GET() {
  try {
    const { rows } = await sql`
      SELECT email, is_paid
      FROM payments
    `

    // Transform to the format expected by frontend: { email: true/false }
    const payments = {}
    rows.forEach(row => {
      payments[row.email] = row.is_paid
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST update payment status
export async function POST(request) {
  try {
    const { email, isPaid } = await request.json()

    if (!email || isPaid === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert payment status
    await sql`
      INSERT INTO payments (email, is_paid, updated_at)
      VALUES (${email}, ${isPaid}, CURRENT_TIMESTAMP)
      ON CONFLICT (email)
      DO UPDATE SET is_paid = ${isPaid}, updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
