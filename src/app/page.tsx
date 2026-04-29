'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { Calendar, Car, Phone, User, CheckCircle2, Loader2 } from 'lucide-react'

export default function BookingPage() {
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licensePlate: ''
  })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchSlots()
  }, [])

  async function fetchSlots() {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('is_active', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error
      setSlots(data || [])
    } catch (err: any) {
      console.error('Error fetching slots:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return

    setSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            slot_id: selectedSlot,
            name: formData.name,
            phone: formData.phone,
            license_plate: formData.licensePlate
          }
        ])

      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            We've received your booking. We'll see you at your selected time!
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white py-3 rounded-md font-semibold hover:bg-opacity-90 transition-all"
          >
            Make Another Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-primary mb-2">YKB Car Wash Booking</h1>
          <p className="text-gray-600 italic">Fast, Reliable, and Community-Driven</p>
          <div className="h-1 w-20 bg-accent mx-auto mt-4 rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-accent" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Car className="w-5 h-5 text-accent" />
                Vehicle Details
              </h2>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">License Plate</label>
                <input
                  required
                  type="text"
                  placeholder="ABC-1234"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Slot Selection */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Select a Time Slot
              </h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No available slots found. Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`p-4 text-left border rounded-lg transition-all ${
                        selectedSlot === slot.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-gray-200 hover:border-accent hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
                        {format(new Date(slot.start_time), 'EEEE, MMM d')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer/Submit */}
          <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100">
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
            <button
              disabled={!selectedSlot || submitting || loading}
              className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Young Khalsa Boys. All rights reserved.
        </p>
      </div>
    </div>
  )
}
