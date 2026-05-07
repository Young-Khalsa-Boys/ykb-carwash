'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { Calendar, Car, Phone, User, CheckCircle2, Loader2, ScrollText, AlertTriangle } from 'lucide-react'

export default function BookingPage() {
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'waiver'>('form')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licensePlate: '',
    vehicleMakeModel: '',
    vehicleColor: ''
  })
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [acceptedWaiver, setAcceptedWaiver] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const waiverRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchSlots()

    // Real-time updates for slot availability
    const channel = supabase
      .channel('public_slots')
      .on('postgres_changes', { event: '*', table: 'bookings' }, () => {
        fetchSlots()
      })
      .on('postgres_changes', { event: '*', table: 'slots' }, () => {
        fetchSlots()
      })
      .subscribe()

    // Refresh slots periodically to handle time passing
    const interval = setInterval(fetchSlots, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 10)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`
  }

  const validateLicensePlate = (value: string) => {
    if (!value) return true // Optional
    return /^[a-zA-Z0-9]{2,8}$/.test(value)
  }

  const handleWaiverScroll = () => {
    if (waiverRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = waiverRef.current
      // Use a small buffer (5px) to handle rounding issues
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setHasScrolledToBottom(true)
      }
    }
  }

  async function fetchSlots() {
    try {
      const now = new Date().toISOString()
      const { data: slotsData, error: slotsError } = await supabase
        .from('slots')
        .select('*')
        .eq('is_active', true)
        .gte('start_time', now)
        .order('start_time', { ascending: true })

      if (slotsError || !slotsData) throw slotsError || new Error('No slots found')

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('slot_id, status')
        .in('slot_id', (slotsData as any[]).map((s: any) => s.id))
        .neq('status', 'cancelled')

      if (bookingsError) throw bookingsError

      const counts: Record<string, number> = {};
      (bookingsData as any[])?.forEach((b: any) => {
        counts[b.slot_id] = (counts[b.slot_id] || 0) + 1
      })

      const availableSlots = (slotsData as any[])
        .filter((slot: any) => new Date(slot.start_time) > new Date())
        .map((slot: any) => ({
          ...slot,
          current_bookings: counts[slot.id] || 0,
          is_full: (counts[slot.id] || 0) >= slot.max_capacity
        }))

      setSlots(availableSlots)
    } catch (err: any) {
      console.error('Error fetching slots:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    if (formData.phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }

    if (!validateLicensePlate(formData.licensePlate)) {
      setError('License plate must be 2-8 alphanumeric characters.')
      return
    }

    if (!formData.name || !formData.vehicleMakeModel || !formData.vehicleColor) {
      setError('Please fill out all required fields.')
      return
    }

    setError(null)
    setStep('waiver')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!selectedSlot || !acceptedWaiver) return

    setSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            slot_id: selectedSlot,
            name: formData.name,
            phone: formData.phone.replace(/\D/g, ''),
            license_plate: formData.licensePlate ? formData.licensePlate.toUpperCase() : null,
            vehicle_make_model: formData.vehicleMakeModel,
            vehicle_color: formData.vehicleColor,
            status: 'waiting'
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
          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              We'll text you when your car is ready to be washed!
            </p>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <p className="text-sm text-primary font-medium">Your parking spot will be reserved</p>
            </div>
          </div>

          <div className="mb-8 p-6 bg-gradient-to-br from-primary to-blue-700 rounded-xl text-white shadow-md relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Skip the line? ⚡️</h3>
              <p className="text-blue-100 text-sm mb-4">
                Save time at the counter by donating now. Most people donate in advance!
              </p>
              <a 
                href="/donate" 
                className="inline-flex items-center gap-2 bg-white text-primary px-6 py-2.5 rounded-full font-bold hover:bg-blue-50 transition-all shadow-sm"
              >
                Donate Now
                <Play className="w-3 h-3 fill-current" />
              </a>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Car className="w-24 h-24 rotate-12" />
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full text-gray-500 py-3 rounded-md font-semibold hover:bg-gray-100 transition-all text-sm"
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
          <img src="/logo.png" alt="YKB Logo" className="h-32 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-2">Car Wash Booking</h1>
          <p className="text-gray-600 italic">Fast, Reliable, and Community-Driven</p>
          <div className="h-1 w-20 bg-accent mx-auto mt-4 rounded-full"></div>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleNextStep} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
              {/* Contact Info */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-accent" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Vehicle Make/Model <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="Toyota Camry"
                      value={formData.vehicleMakeModel}
                      onChange={(e) => setFormData({ ...formData, vehicleMakeModel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Vehicle Color <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="Silver"
                      value={formData.vehicleColor}
                      onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">License Plate</label>
                  <input
                    type="text"
                    placeholder="ABC1234 (Optional)"
                    maxLength={8}
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Parking spot will be reserved during wash
                  </p>
                </div>
              </div>

              {/* Slot Selection */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Select a Time Slot <span className="text-red-500">*</span>
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
                        disabled={slot.is_full}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`p-4 text-left border rounded-lg transition-all relative ${
                          slot.is_full
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                            : selectedSlot === slot.id
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
                        {slot.is_full && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">
                            Full
                          </div>
                        )}
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
                disabled={!selectedSlot || loading}
                className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
              >
                Continue to Waiver
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ScrollText className="w-6 h-6 text-accent" />
                Assumption of Risk & Waiver
              </h2>
              <p className="text-gray-500 mt-1">Please read and scroll to the bottom to accept</p>
            </div>
            
            <div 
              ref={waiverRef}
              onScroll={handleWaiverScroll}
              className="p-6 md:p-8 max-h-[400px] overflow-y-auto bg-gray-50 text-gray-700 leading-relaxed space-y-4"
            >
              <p className="font-bold">Assumption of Risk and Release and Waiver of Liability</p>
              
              <p>
                I understand and acknowledge that participation in a car wash event involves inherent risks, including but not limited to: scratches, dents, paint or finish damage, mirror or antenna damage, water intrusion, personal injury, or other unforeseen harm. I voluntarily assume all such risks related to my participation and vehicle.
              </p>

              <p>
                In consideration of being permitted to participate in the fundraiser car wash, I hereby release, waive, and discharge Young Khalsa Boys Incorporated, its officers, directors, employees, volunteers, agents, and representatives from any and all claims, demands, causes of action, damages, losses, costs, or expenses (including attorney’s fees) arising out of or related to:
              </p>

              <ul className="list-disc pl-5 space-y-2">
                <li>Washing, handling, moving, or parking of my vehicle</li>
                <li>Any damage to my vehicle or personal property</li>
                <li>Any personal injury to myself or others</li>
                <li>Any acts or omissions by volunteers or participants</li>
              </ul>

              <p>
                This release applies to the fullest extent permitted by law, including claims arising from ordinary negligence, but does not apply to gross negligence or willful misconduct where prohibited by law.
              </p>

              <p>
                I agree that Young Khalsa Boys Incorporated has no responsibility to inspect or safeguard against preexisting damage.
              </p>

              <p>
                I understand this is a fundraiser service performed by youth volunteers, and no warranties or guarantees are made regarding the quality or outcome of the car wash.
              </p>

              <p>
                I agree to defend, indemnify, and hold harmless Young Khalsa Boys Incorporated from any claims or liabilities brought by me or any third party arising from my participation in this event.
              </p>
            </div>

            <div className="p-6 md:p-8 bg-white space-y-6">
              {!hasScrolledToBottom && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3 text-amber-800 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>You must scroll to the bottom of the waiver to enable the acceptance checkbox.</p>
                </div>
              )}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept-waiver"
                  disabled={!hasScrolledToBottom}
                  checked={acceptedWaiver}
                  onChange={(e) => setAcceptedWaiver(e.target.checked)}
                  className="mt-1.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                />
                <label 
                  htmlFor="accept-waiver" 
                  className={`text-sm md:text-base font-medium ${!hasScrolledToBottom ? 'text-gray-400' : 'text-gray-700 cursor-pointer'}`}
                >
                  I have read and agree to the Assumption of Risk and Release and Waiver of Liability.
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-6 py-4 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-all border border-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!acceptedWaiver || submitting}
                  className="flex-1 bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8 space-y-2">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Young Khalsa Boys. All rights reserved.
          </p>
          <a 
            href="https://youngkhalsaboys.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-accent hover:underline text-xs font-medium"
          >
            Understand our mission
          </a>
        </div>
      </div>
    </div>
  )
}
