'use client'
import { useState, useEffect } from 'react'

// MANDATORY CONSTANTS
const CHALET_DATES = [
  '2025-12-19', '2025-12-20', '2025-12-21', '2025-12-22', '2025-12-23',
  '2025-12-24', '2025-12-25', '2025-12-26', '2025-12-27', '2025-12-28',
  '2025-12-29', '2025-12-30', '2025-12-31',
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08',
  '2026-01-09', '2026-01-10',
  '2026-01-11', '2026-01-12', '2026-01-13', '2026-01-14', '2026-01-15',
  '2026-01-16', '2026-01-17',
]

// Admin-only dates - booking details hidden from regular users
const ADMIN_ONLY_DATES = [
  '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08',
  '2026-01-11', '2026-01-12', '2026-01-13', '2026-01-14', '2026-01-15',
]

const PRICING_TABLE = {
  1: 45, 2: 90, 3: 130, 4: 170, 5: 205, 6: 240, 7: 270, 8: 300, 9: 325, 10: 355,
  11: 375, 12: 395, 13: 415, 14: 430, 15: 445, 16: 455, 17: 465, 18: 475, 19: 480, 20: 485
}

const MAX_SEATS = 11
const ADMIN_PASSWORD = 'admin123'

export default function ChaletBooking() {
  const [email, setEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [bookings, setBookings] = useState({})
  const [payments, setPayments] = useState({})
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load data from API and localStorage (for email only)
  useEffect(() => {
    const loadData = async () => {
      // Load email from localStorage
      const savedEmail = localStorage.getItem('userEmail')
      if (savedEmail) {
        setEmail(savedEmail)
        setIsLoggedIn(true)
      }

      // Load bookings and payments from API
      try {
        const [bookingsRes, paymentsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/payments')
        ])

        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings(data.bookings || {})
        }

        if (paymentsRes.ok) {
          const data = await paymentsRes.json()
          setPayments(data.payments || {})
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (email.trim()) {
      localStorage.setItem('userEmail', email)
      setIsLoggedIn(true)
    }
  }

  const handleAdminLogin = (e) => {
    e.preventDefault()
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true)
    } else {
      alert('Incorrect password')
    }
  }

  const toggleBooking = async (date) => {
    const dateBookings = bookings[date] || []
    const userIndex = dateBookings.indexOf(email)

    if (userIndex > -1) {
      // User is unbooking - check if they've already paid
      if (payments[email]) {
        alert('Cannot remove booking after payment has been marked as paid. Please contact admin.')
        return
      }

      // Call API to unbook
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, date, action: 'unbook' })
        })

        if (res.ok) {
          // Update local state
          const newBookings = { ...bookings }
          newBookings[date] = dateBookings.filter(e => e !== email)
          if (newBookings[date].length === 0) delete newBookings[date]
          setBookings(newBookings)
        } else {
          alert('Failed to remove booking. Please try again.')
        }
      } catch (error) {
        console.error('Error unbooking:', error)
        alert('Failed to remove booking. Please try again.')
      }
    } else {
      // User is booking - only check if there are MAX_SEATS paid bookings
      const paidBookings = dateBookings.filter(userEmail => payments[userEmail])
      if (paidBookings.length >= MAX_SEATS) {
        alert('This night is fully booked with paid reservations!')
        return
      }

      // Call API to book
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, date, action: 'book' })
        })

        if (res.ok) {
          // Update local state
          setBookings({
            ...bookings,
            [date]: [...dateBookings, email]
          })
        } else {
          alert('Failed to create booking. Please try again.')
        }
      } catch (error) {
        console.error('Error booking:', error)
        alert('Failed to create booking. Please try again.')
      }
    }
  }

  const togglePayment = async () => {
    const newPaidStatus = !payments[email]

    // If marking as paid, show confirmation warning
    if (newPaidStatus) {
      const confirmed = window.confirm(
        '⚠️ WARNING: Once you mark your booking as PAID, you will NOT be able to modify or cancel your reservations.\n\n' +
        'Please confirm that you have:\n' +
        '1. Sent the Interac payment to 438 528 7271\n' +
        '2. Verified all your booked nights are correct\n\n' +
        'Do you want to continue?'
      )

      if (!confirmed) {
        return // User cancelled
      }
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isPaid: newPaidStatus })
      })

      if (res.ok) {
        // Update local state
        setPayments({
          ...payments,
          [email]: newPaidStatus
        })
      } else {
        alert('Failed to update payment status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Failed to update payment status. Please try again.')
    }
  }

  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText('438 528 7271')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      alert('Failed to copy. Please copy manually: 438 528 7271')
    }
  }

  const getUserBookedDates = () => {
    return CHALET_DATES.filter(date => {
      const dateBookings = bookings[date] || []
      return dateBookings.includes(email)
    })
  }

  const calculateTotalCost = (nights) => {
    if (nights > 20) return PRICING_TABLE[20]
    return PRICING_TABLE[nights] || 0
  }

  const getAvailability = (date) => {
    const dateBookings = bookings[date] || []
    // Only count paid bookings towards the seat limit
    const paidBookings = dateBookings.filter(userEmail => payments[userEmail])
    return MAX_SEATS - paidBookings.length
  }

  const getPaidBookingsForDate = (date) => {
    const dateBookings = bookings[date] || []
    return dateBookings.filter(userEmail => payments[userEmail])
  }

  const getUnpaidBookingsForDate = (date) => {
    const dateBookings = bookings[date] || []
    return dateBookings.filter(userEmail => !payments[userEmail])
  }

  const isUserBooked = (date) => {
    const dateBookings = bookings[date] || []
    return dateBookings.includes(email)
  }

  const isDateFull = (date) => {
    const paidBookings = getPaidBookingsForDate(date)
    return paidBookings.length >= MAX_SEATS
  }

  const getAllUsers = () => {
    const users = {}
    Object.entries(bookings).forEach(([date, emails]) => {
      emails.forEach(email => {
        if (!users[email]) {
          users[email] = { nights: 0 }
        }
        users[email].nights++
      })
    })
    return users
  }

  const getTotalRevenue = () => {
    const users = getAllUsers()
    return Object.values(users).reduce((sum, user) => {
      const totalCost = calculateTotalCost(user.nights)
      return sum + totalCost
    }, 0)
  }

  const getTotalCollected = () => {
    let total = 0
    const users = getAllUsers()
    Object.entries(users).forEach(([userEmail, data]) => {
      if (payments[userEmail]) {
        total += calculateTotalCost(data.nights)
      }
    })
    return total
  }

  const adminDeleteBooking = async (userEmail, date) => {
    if (!window.confirm(`Delete booking for ${userEmail} on ${date}?`)) {
      return
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, date, action: 'unbook' })
      })

      if (res.ok) {
        // Update local state
        const newBookings = { ...bookings }
        const dateBookings = newBookings[date] || []
        newBookings[date] = dateBookings.filter(e => e !== userEmail)
        if (newBookings[date].length === 0) delete newBookings[date]
        setBookings(newBookings)
        alert('Booking deleted successfully')
      } else {
        alert('Failed to delete booking')
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
      alert('Failed to delete booking')
    }
  }

  const adminDeleteAllUserBookings = async (userEmail) => {
    if (!window.confirm(`Delete ALL bookings for ${userEmail}? This cannot be undone!`)) {
      return
    }

    try {
      // Find all dates this user has booked
      const userDates = Object.entries(bookings)
        .filter(([date, emails]) => emails.includes(userEmail))
        .map(([date]) => date)

      // Delete each booking
      for (const date of userDates) {
        await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, date, action: 'unbook' })
        })
      }

      // Update local state
      const newBookings = { ...bookings }
      userDates.forEach(date => {
        const dateBookings = newBookings[date] || []
        newBookings[date] = dateBookings.filter(e => e !== userEmail)
        if (newBookings[date].length === 0) delete newBookings[date]
      })
      setBookings(newBookings)

      alert(`Deleted all bookings for ${userEmail}`)
    } catch (error) {
      console.error('Error deleting bookings:', error)
      alert('Failed to delete all bookings')
    }
  }

  // ADMIN DASHBOARD - Check this BEFORE login screen
  if (isAdmin) {
    const users = getAllUsers()
    const totalRevenue = getTotalRevenue()
    const totalCollected = getTotalCollected()
    const totalPending = totalRevenue - totalCollected

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <button
                onClick={() => setIsAdmin(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Logout
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue Due</p>
                <p className="text-2xl font-bold text-blue-600">${totalRevenue}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">${totalCollected}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-orange-600">${totalPending}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">User Management</h2>
            <div className="overflow-x-auto mb-8">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Nights</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total Cost</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(users).map(([userEmail, data]) => {
                    const totalCost = calculateTotalCost(data.nights)
                    const isPaid = payments[userEmail]
                    return (
                      <tr key={userEmail} className="border-b">
                        <td className="px-4 py-3 text-sm">{userEmail}</td>
                        <td className="px-4 py-3 text-sm">{data.nights}</td>
                        <td className="px-4 py-3 text-sm font-semibold">${totalCost}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            isPaid
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => adminDeleteAllUserBookings(userEmail)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                          >
                            Delete All
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">All Bookings by Date - Calendar View</h2>

            {/* December 2025 Admin Calendar */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-700 mb-3">December 2025</h3>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                    {day}
                  </div>
                ))}
                {(() => {
                  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
                  const generateCalendarDays = (year, month, startDay = 1) => {
                    const firstDayOfWeek = new Date(year, month, startDay).getDay()
                    const days = []
                    for (let i = 0; i < firstDayOfWeek; i++) {
                      days.push(null)
                    }
                    for (let day = startDay; day <= getDaysInMonth(year, month); day++) {
                      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      days.push(date)
                    }
                    return days
                  }

                  return generateCalendarDays(2025, 11, 15).map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="min-h-[140px]" />
                    }

                    const dateBookings = bookings[date] || []
                    const bookingCount = dateBookings.length
                    const paidBookings = dateBookings.filter(userEmail => payments[userEmail])
                    const unpaidBookings = dateBookings.filter(userEmail => !payments[userEmail])
                    const day = parseInt(date.split('-')[2])
                    const isBookable = CHALET_DATES.includes(date)

                    // Color grading based on booking count
                    let bgColor = 'bg-gray-50 border-gray-200'
                    if (isBookable && bookingCount > 0) {
                      if (bookingCount >= 10) {
                        bgColor = 'bg-red-100 border-red-400'
                      } else if (bookingCount >= 7) {
                        bgColor = 'bg-orange-200 border-orange-400'
                      } else if (bookingCount >= 4) {
                        bgColor = 'bg-yellow-100 border-yellow-400'
                      } else {
                        bgColor = 'bg-blue-50 border-blue-300'
                      }
                    }

                    return (
                      <div
                        key={date}
                        className={`group relative min-h-[140px] p-2 rounded-lg border-2 transition ${bgColor} ${
                          !isBookable ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="text-sm font-bold mb-1 text-gray-800">{day}</div>
                        {isBookable && bookingCount > 0 && (
                          <>
                            <div className="text-xs font-semibold mb-2 text-gray-700">
                              {bookingCount} {bookingCount === 1 ? 'booking' : 'bookings'}
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="text-green-700 font-medium">
                                ✓ {paidBookings.length} paid
                              </div>
                              {unpaidBookings.length > 0 && (
                                <div className="text-orange-600">
                                  ⏳ {unpaidBookings.length} unpaid
                                </div>
                              )}
                            </div>
                            {/* Hover tooltip with full details */}
                            <div className="hidden group-hover:block absolute z-20 bg-white border-2 border-gray-400 rounded-lg p-3 shadow-xl mt-2 min-w-[250px] left-0 top-full">
                              <div className="text-sm font-bold mb-2 text-gray-800">
                                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="space-y-1 max-h-60 overflow-y-auto">
                                {paidBookings.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs font-semibold text-green-700 mb-1">Paid:</div>
                                    {paidBookings.map(userEmail => (
                                      <div key={userEmail} className="flex items-center justify-between bg-green-50 p-1.5 rounded mb-1">
                                        <span className="text-xs text-green-800 truncate flex-1" title={userEmail}>
                                          ✓ {userEmail}
                                        </span>
                                        <button
                                          onClick={() => adminDeleteBooking(userEmail, date)}
                                          className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition flex-shrink-0"
                                        >
                                          Del
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {unpaidBookings.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-orange-600 mb-1">Unpaid:</div>
                                    {unpaidBookings.map(userEmail => (
                                      <div key={userEmail} className="flex items-center justify-between bg-orange-50 p-1.5 rounded mb-1">
                                        <span className="text-xs text-orange-800 truncate flex-1" title={userEmail}>
                                          ⏳ {userEmail}
                                        </span>
                                        <button
                                          onClick={() => adminDeleteBooking(userEmail, date)}
                                          className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition flex-shrink-0"
                                        >
                                          Del
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* January 2026 Admin Calendar */}
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-3">January 2026</h3>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                    {day}
                  </div>
                ))}
                {(() => {
                  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
                  const generateCalendarDays = (year, month, endDay = null) => {
                    const actualEndDay = endDay || getDaysInMonth(year, month)
                    const firstDayOfWeek = new Date(year, month, 1).getDay()
                    const days = []
                    for (let i = 0; i < firstDayOfWeek; i++) {
                      days.push(null)
                    }
                    for (let day = 1; day <= actualEndDay; day++) {
                      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      days.push(date)
                    }
                    return days
                  }

                  return generateCalendarDays(2026, 0, 17).map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="min-h-[140px]" />
                    }

                    const dateBookings = bookings[date] || []
                    const bookingCount = dateBookings.length
                    const paidBookings = dateBookings.filter(userEmail => payments[userEmail])
                    const unpaidBookings = dateBookings.filter(userEmail => !payments[userEmail])
                    const day = parseInt(date.split('-')[2])
                    const isBookable = CHALET_DATES.includes(date)

                    // Color grading based on booking count
                    let bgColor = 'bg-gray-50 border-gray-200'
                    if (isBookable && bookingCount > 0) {
                      if (bookingCount >= 10) {
                        bgColor = 'bg-red-100 border-red-400'
                      } else if (bookingCount >= 7) {
                        bgColor = 'bg-orange-200 border-orange-400'
                      } else if (bookingCount >= 4) {
                        bgColor = 'bg-yellow-100 border-yellow-400'
                      } else {
                        bgColor = 'bg-blue-50 border-blue-300'
                      }
                    }

                    return (
                      <div
                        key={date}
                        className={`group relative min-h-[140px] p-2 rounded-lg border-2 transition ${bgColor} ${
                          !isBookable ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="text-sm font-bold mb-1 text-gray-800">{day}</div>
                        {isBookable && bookingCount > 0 && (
                          <>
                            <div className="text-xs font-semibold mb-2 text-gray-700">
                              {bookingCount} {bookingCount === 1 ? 'booking' : 'bookings'}
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="text-green-700 font-medium">
                                ✓ {paidBookings.length} paid
                              </div>
                              {unpaidBookings.length > 0 && (
                                <div className="text-orange-600">
                                  ⏳ {unpaidBookings.length} unpaid
                                </div>
                              )}
                            </div>
                            {/* Hover tooltip with full details */}
                            <div className="hidden group-hover:block absolute z-20 bg-white border-2 border-gray-400 rounded-lg p-3 shadow-xl mt-2 min-w-[250px] left-0 top-full">
                              <div className="text-sm font-bold mb-2 text-gray-800">
                                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="space-y-1 max-h-60 overflow-y-auto">
                                {paidBookings.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs font-semibold text-green-700 mb-1">Paid:</div>
                                    {paidBookings.map(userEmail => (
                                      <div key={userEmail} className="flex items-center justify-between bg-green-50 p-1.5 rounded mb-1">
                                        <span className="text-xs text-green-800 truncate flex-1" title={userEmail}>
                                          ✓ {userEmail}
                                        </span>
                                        <button
                                          onClick={() => adminDeleteBooking(userEmail, date)}
                                          className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition flex-shrink-0"
                                        >
                                          Del
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {unpaidBookings.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-orange-600 mb-1">Unpaid:</div>
                                    {unpaidBookings.map(userEmail => (
                                      <div key={userEmail} className="flex items-center justify-between bg-orange-50 p-1.5 rounded mb-1">
                                        <span className="text-xs text-orange-800 truncate flex-1" title={userEmail}>
                                          ⏳ {userEmail}
                                        </span>
                                        <button
                                          onClick={() => adminDeleteBooking(userEmail, date)}
                                          className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition flex-shrink-0"
                                        >
                                          Del
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left side - Image */}
            <div className="relative h-64 md:h-auto">
              <img
                src="/chalet.jpg"
                alt="Chalet Noel"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                <p className="text-sm font-medium">480 route 329</p>
                <p className="text-xs">Saint-Donat-de-Montcalm</p>
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Chalet Booking</h1>

              {/* Chalet Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-sm">
                <h3 className="font-bold text-gray-800 mb-2">Accommodation</h3>
                <p className="font-semibold text-blue-700 mb-2">11 beds</p>
                <ul className="space-y-1 text-gray-700 mb-3">
                  <li>• 2 rooms with double beds</li>
                  <li>• 1 room with 2 double beds</li>
                  <li>• Mezzanine with single bed + convertible couch</li>
                </ul>
                <p className="font-semibold text-gray-800 mb-1">Bathrooms</p>
                <ul className="space-y-1 text-gray-700 mb-3">
                  <li>• 1 full bathroom (bath, sink, wc)</li>
                  <li>• 1 half bath (sink, wc, washer/dryer)</li>
                </ul>
                <a
                  href="https://clubpleinairsaint-donat.org/wp-content/uploads/2025/05/clubpleinairsaint-donat-carte_verso_2024_v3.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  📍 View Trail Map
                </a>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
          <button
            onClick={() => setIsAdmin(null)}
            className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Admin Access
          </button>
          {isAdmin === null && (
            <form onSubmit={handleAdminLogin} className="mt-4 space-y-4">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Admin password"
              />
              <button
                type="submit"
                className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition"
              >
                Admin Login
              </button>
            </form>
          )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MAIN DASHBOARD
  const userBookedDates = getUserBookedDates()
  const totalNights = userBookedDates.length
  const totalCost = calculateTotalCost(totalNights)

  // Calendar helper functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  const generateCalendarDays = (year, month, startDay = 1, endDay = null) => {
    const daysInMonth = getDaysInMonth(year, month)
    const actualEndDay = endDay || daysInMonth
    const firstDayOfWeek = new Date(year, month, startDay).getDay()
    const days = []

    // Add empty cells for days before the first day we're showing
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    // Add days from startDay to endDay
    for (let day = startDay; day <= actualEndDay; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push(date)
    }

    return days
  }

  const isBookableDate = (date) => {
    return date && CHALET_DATES.includes(date)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Chalet Booking</h1>
            <div className="flex gap-2 sm:gap-4 items-center">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Logged in as: <strong>{email}</strong></span>
              <button
                onClick={() => {
                  localStorage.removeItem('userEmail')
                  setIsLoggedIn(false)
                  setEmail('')
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">Pricing Table</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 text-xs sm:text-sm">
              {Object.entries(PRICING_TABLE).map(([nights, cost]) => (
                <div key={nights} className="flex justify-between bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded">
                  <span className="font-medium">{nights}N:</span>
                  <span className="text-blue-600 font-bold">${cost}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">Your Booking Summary</h2>
            <div className="flex gap-3 sm:gap-6 mb-3 sm:mb-4">
              <div>
                <span className="text-xs sm:text-sm text-gray-600">Total Nights: </span>
                <span className="font-bold text-base sm:text-lg">{totalNights}</span>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-600">Total Cost Due: </span>
                <span className="font-bold text-base sm:text-lg text-green-600">${totalCost}</span>
              </div>
            </div>
            {totalNights > 0 && (
              <div className="border-t border-green-200 pt-2 sm:pt-3">
                <div className="mb-2 sm:mb-3">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Payment via Interac</p>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <p className="text-base sm:text-lg font-bold text-gray-900">438 528 7271</p>
                    <button
                      onClick={copyPhoneNumber}
                      className={`px-3 sm:px-4 py-1 rounded-lg text-xs sm:text-sm font-semibold transition ${
                        copied
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {copied ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={togglePayment}
                  className={`w-full px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition ${
                    payments[email]
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {payments[email] ? 'Paid ✓' : 'Mark as Paid'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Calendar</h2>

          {/* December 2025 */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">December 2025</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 text-xs sm:text-sm py-1 sm:py-2">
                  {day}
                </div>
              ))}
              {generateCalendarDays(2025, 11, 15).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="min-h-[90px] sm:min-h-[110px] md:min-h-[120px]" />
                }

                const bookable = isBookableDate(date)
                const available = getAvailability(date)
                const userBooked = isUserBooked(date)
                const isFull = isDateFull(date)
                const isPaid = payments[email]
                const paidBookings = getPaidBookingsForDate(date)
                const unpaidBookings = getUnpaidBookingsForDate(date)
                const day = parseInt(date.split('-')[2])

                // Admin-only dates: hide booking details from regular users
                const isAdminOnly = ADMIN_ONLY_DATES.includes(date)

                return (
                  <div
                    key={date}
                    className={`group relative min-h-[90px] sm:min-h-[110px] md:min-h-[120px] p-1.5 sm:p-2 rounded-lg border-2 transition ${
                      !bookable
                        ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        : userBooked && isPaid
                        ? 'border-green-600 bg-green-100'
                        : userBooked
                        ? 'border-green-500 bg-green-50'
                        : isFull
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className={`text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 ${!bookable ? 'text-gray-300' : 'text-gray-800'}`}>
                      {day}
                    </div>
                    {bookable && (
                      <>
                        {/* Hide seat availability on admin-only dates */}
                        {!isAdminOnly && (
                          <div className={`text-xs mb-0.5 sm:mb-1 ${isFull ? 'text-red-600' : 'text-gray-600'} cursor-help`}>
                            {available} {available === 1 ? 'seat' : 'seats'}
                          </div>
                        )}
                        <button
                          onClick={() => toggleBooking(date)}
                          disabled={(isFull && !userBooked) || (userBooked && isPaid)}
                          className={`w-full py-0.5 sm:py-1 px-1 rounded text-xs font-medium transition mb-1 sm:mb-2 ${
                            userBooked && isPaid
                              ? 'bg-green-600 text-white cursor-not-allowed'
                              : userBooked
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : isFull
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : isAdminOnly
                              ? 'bg-gray-400 text-white hover:bg-gray-500'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {userBooked && isPaid ? 'Paid' : userBooked ? 'Unbook' : isFull ? 'Full' : 'Book'}
                        </button>
                        {/* Hide booking tooltips on admin-only dates */}
                        {!isAdminOnly && (paidBookings.length > 0 || unpaidBookings.length > 0) && (
                          <div className="hidden group-hover:block text-xs space-y-1 absolute z-10 bg-white border border-gray-300 rounded-lg p-2 shadow-lg mt-1 min-w-[100px] sm:min-w-[120px]">
                            {paidBookings.map(userEmail => (
                              <div key={userEmail} className="text-green-700 font-medium truncate" title={userEmail}>
                                ✓ {userEmail.split('@')[0]}
                              </div>
                            ))}
                            {unpaidBookings.map(userEmail => (
                              <div key={userEmail} className="text-orange-600 truncate" title={userEmail}>
                                ⏳ {userEmail.split('@')[0]}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* January 2026 */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">January 2026</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 text-xs sm:text-sm py-1 sm:py-2">
                  {day}
                </div>
              ))}
              {generateCalendarDays(2026, 0, 1, 17).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="min-h-[90px] sm:min-h-[110px] md:min-h-[120px]" />
                }

                const bookable = isBookableDate(date)
                const available = getAvailability(date)
                const userBooked = isUserBooked(date)
                const isFull = isDateFull(date)
                const isPaid = payments[email]
                const paidBookings = getPaidBookingsForDate(date)
                const unpaidBookings = getUnpaidBookingsForDate(date)
                const day = parseInt(date.split('-')[2])

                // Admin-only dates: hide booking details from regular users
                const isAdminOnly = ADMIN_ONLY_DATES.includes(date)

                return (
                  <div
                    key={date}
                    className={`group relative min-h-[90px] sm:min-h-[110px] md:min-h-[120px] p-1.5 sm:p-2 rounded-lg border-2 transition ${
                      !bookable
                        ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        : userBooked && isPaid
                        ? 'border-green-600 bg-green-100'
                        : userBooked
                        ? 'border-green-500 bg-green-50'
                        : isFull
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className={`text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 ${!bookable ? 'text-gray-300' : 'text-gray-800'}`}>
                      {day}
                    </div>
                    {bookable && (
                      <>
                        {/* Hide seat availability on admin-only dates */}
                        {!isAdminOnly && (
                          <div className={`text-xs mb-0.5 sm:mb-1 ${isFull ? 'text-red-600' : 'text-gray-600'} cursor-help`}>
                            {available} {available === 1 ? 'seat' : 'seats'}
                          </div>
                        )}
                        <button
                          onClick={() => toggleBooking(date)}
                          disabled={(isFull && !userBooked) || (userBooked && isPaid)}
                          className={`w-full py-0.5 sm:py-1 px-1 rounded text-xs font-medium transition mb-1 sm:mb-2 ${
                            userBooked && isPaid
                              ? 'bg-green-600 text-white cursor-not-allowed'
                              : userBooked
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : isFull
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : isAdminOnly
                              ? 'bg-gray-400 text-white hover:bg-gray-500'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {userBooked && isPaid ? 'Paid' : userBooked ? 'Unbook' : isFull ? 'Full' : 'Book'}
                        </button>
                        {/* Hide booking tooltips on admin-only dates */}
                        {!isAdminOnly && (paidBookings.length > 0 || unpaidBookings.length > 0) && (
                          <div className="hidden group-hover:block text-xs space-y-1 absolute z-10 bg-white border border-gray-300 rounded-lg p-2 shadow-lg mt-1 min-w-[100px] sm:min-w-[120px]">
                            {paidBookings.map(userEmail => (
                              <div key={userEmail} className="text-green-700 font-medium truncate" title={userEmail}>
                                ✓ {userEmail.split('@')[0]}
                              </div>
                            ))}
                            {unpaidBookings.map(userEmail => (
                              <div key={userEmail} className="text-orange-600 truncate" title={userEmail}>
                                ⏳ {userEmail.split('@')[0]}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
