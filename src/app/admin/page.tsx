'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  Users, 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  CheckCircle, 
  XCircle,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Edit2,
  RotateCcw,
  Play,
  Monitor,
  Eye,
  EyeOff,
  Car,
  Phone,
  User,
  CalendarPlus,
  AlertCircle
} from 'lucide-react'
import Modal from '@/components/Modal'

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bookings' | 'slots' | 'atc'>('bookings')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [verifying, setVerifying] = useState(false)
  
  // New Slot Form
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    capacity: 5
  })

  const [editingSlot, setEditingSlot] = useState<any>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [atcForm, setAtcForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleMakeModel: '',
    vehicleColor: '',
    selectedSlot: ''
  })
  const [atcSubmitting, setAtcSubmitting] = useState(false)
  const [atcSuccess, setAtcSuccess] = useState(false)
  
  // Mass Creation State
  const [showMassCreate, setShowMassCreate] = useState(false)
  const [massSlotConfig, setMassSlotConfig] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    interval: 30,
    capacity: 5
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      // First check localStorage for a saved password
      const savedPassword = localStorage.getItem('ykb_admin_password')
      
      if (savedPassword) {
        setPassword(savedPassword)
        // Attempt login with saved password
        const success = await attemptLogin(savedPassword)
        if (success) {
          setLoading(false)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAuthenticated(true)
        fetchData()
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    // Subscribe to bookings and slots changes
    const bookingsChannel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', table: 'bookings' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', table: 'slots' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(bookingsChannel)
    }
  }, [isAuthenticated])

  async function attemptLogin(pass: string) {
    setVerifying(true)
    setAuthError('')

    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-admin', {
        body: { password: pass }
      })

      if (verifyError || !verifyData.success) {
        throw new Error(verifyData?.message || 'Authentication failed')
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: verifyData.email,
        password: pass
      })

      if (signInError) throw signInError

      setIsAuthenticated(true)
      localStorage.setItem('ykb_admin_password', pass)
      fetchData()
      return true
    } catch (err: any) {
      setAuthError(err.message)
      localStorage.removeItem('ykb_admin_password')
      return false
    } finally {
      setVerifying(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    await attemptLogin(password)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    localStorage.removeItem('ykb_admin_password')
    setIsAuthenticated(false)
  }

  async function fetchData() {
    setLoading(true)
    try {
      const { data: bData } = await supabase
        .from('bookings')
        .select('*, slots(*)')
        .order('created_at', { ascending: true })
      
      const { data: sData } = await supabase
        .from('slots')
        .select('*')
        .order('start_time', { ascending: true })

      setBookings(bData || [])
      setSlots(sData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A'
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 10)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`
  }

  const getBookingsBySlot = () => {
    const grouped: Record<string, any[]> = {}
    bookings.filter((b: any) => b.status !== 'cancelled').forEach((b: any) => {
      const slotId = b.slot_id
      if (!grouped[slotId]) grouped[slotId] = []
      grouped[slotId].push(b)
    })
    return grouped
  }

  const completedBookings = bookings.filter((b: any) => b.status === 'completed')
  const waitingBookings = bookings.filter((b: any) => b.status === 'pending' || b.status === 'waiting')
  
  const getWaitingBookingsBySlot = () => {
    const grouped: Record<string, any[]> = {}
    waitingBookings.forEach((b: any) => {
      const slotId = b.slot_id
      if (!grouped[slotId]) grouped[slotId] = []
      grouped[slotId].push(b)
    })
    return grouped
  }

  const bookingsBySlot = getWaitingBookingsBySlot()

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-500">Enter your password to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <input 
                required 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
              />
            </div>
            {authError && <div className="text-red-600 text-sm">{authError}</div>}
            <button 
              disabled={verifying}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-opacity-90 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
            >
              {verifying ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  async function addSlot(e: React.FormEvent) {
    e.preventDefault()
    const start = new Date(`${newSlot.date}T${newSlot.startTime}`)
    const end = new Date(`${newSlot.date}T${newSlot.endTime}`)

    try {
      const { error } = await supabase
        .from('slots')
        .insert([{
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          max_capacity: newSlot.capacity,
          is_active: true
        }])
      
      if (error) throw error
      fetchData()
      setNewSlot({ date: '', startTime: '', endTime: '', capacity: 1 })
    } catch (err) {
      alert('Error adding slot')
    }
  }

  async function massCreateSlots(e: React.FormEvent) {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      const slotsToInsert = []
      const baseDate = massSlotConfig.date
      let current = new Date(`${baseDate}T${massSlotConfig.startTime}`)
      const end = new Date(`${baseDate}T${massSlotConfig.endTime}`)
      
      if (current >= end) {
        alert('Start time must be before end time')
        setIsGenerating(false)
        return
      }

      while (current < end) {
        const slotStart = new Date(current)
        const slotEnd = new Date(current.getTime() + massSlotConfig.interval * 60000)
        
        // Don't create a slot that goes beyond the end time
        if (slotEnd > end) break

        slotsToInsert.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          max_capacity: massSlotConfig.capacity,
          is_active: true
        })

        current = new Date(slotEnd)
      }

      if (slotsToInsert.length === 0) {
        alert('No slots could be generated with the given parameters.')
        setIsGenerating(false)
        return
      }

      if (!confirm(`This will create ${slotsToInsert.length} time slots on ${massSlotConfig.date}. Proceed?`)) {
        setIsGenerating(false)
        return
      }

      const { error } = await supabase
        .from('slots')
        .insert(slotsToInsert)
      
      if (error) throw error
      
      fetchData()
      setShowMassCreate(false)
      alert(`Successfully created ${slotsToInsert.length} slots!`)
    } catch (err: any) {
      alert('Error mass creating slots: ' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  async function deleteSlot(id: string) {
    if (!confirm('Are you sure you want to delete this slot? All associated bookings will be deleted.')) return
    try {
      await supabase.from('slots').delete().eq('id', id)
      fetchData()
    } catch (err) {
      alert('Error deleting slot')
    }
  }

  async function updateSlot(e: React.FormEvent) {
    e.preventDefault()
    const start = new Date(`${editingSlot.date}T${editingSlot.startTime}`)
    const end = new Date(`${editingSlot.date}T${editingSlot.endTime}`)

    try {
      const { error } = await supabase
        .from('slots')
        .update({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          max_capacity: editingSlot.capacity,
        })
        .eq('id', editingSlot.id)
      
      if (error) throw error
      fetchData()
      setEditingSlot(null)
    } catch (err) {
      alert('Error updating slot')
    }
  }

  async function toggleSlotActive(id: string, currentStatus: boolean) {
    const action = currentStatus ? 'Make this a FLEX slot? (It will be hidden from public signup)' : 'Make this slot public?';
    if (!confirm(action)) return;

    try {
      const { error } = await supabase
        .from('slots')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      fetchData()
    } catch (err) {
      alert('Error toggling slot status')
    }
  }

  async function handleAtcSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!atcForm.selectedSlot) {
      alert('Please select a slot')
      return
    }

    if (atcForm.name.trim().length < 2) {
      alert('Please enter a full name (minimum 2 characters).')
      return
    }

    if (atcForm.phone.replace(/\D/g, '').length !== 10) {
      alert('Please enter a valid 10-digit phone number.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(atcForm.email)) {
      alert('Please enter a valid email address.')
      return
    }

    if (!atcForm.vehicleMakeModel || !atcForm.vehicleColor) {
      alert('Please fill out all vehicle details.')
      return
    }

    setAtcSubmitting(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([{
          slot_id: atcForm.selectedSlot,
          name: atcForm.name,
          phone: atcForm.phone.replace(/\D/g, ''),
          email: atcForm.email,
          vehicle_make_model: atcForm.vehicleMakeModel,
          vehicle_color: atcForm.vehicleColor,
          status: 'waiting'
        }])

      if (error) throw error
      
      setAtcSuccess(true)
      setAtcForm({
        name: '',
        phone: '',
        email: '',
        vehicleMakeModel: '',
        vehicleColor: '',
        selectedSlot: ''
      })
      fetchData()
      setTimeout(() => setAtcSuccess(false), 3000)
    } catch (err: any) {
      alert('Error creating ATC booking: ' + err.message)
    } finally {
      setAtcSubmitting(false)
    }
  }

  async function updateBookingStatus(id: string, status: string) {
    const confirmMsg = status === 'completed' 
      ? 'Mark this booking as completed?' 
      : status === 'cancelled'
          ? 'Are you sure you want to unbook this customer? This will remove them from the slot.'
          : status === 'waiting'
            ? 'Move this booking back to the active queue?'
            : `Change status to ${status}?`
    
    if (!confirm(confirmMsg)) return

    try {
      await supabase.from('bookings').update({ status }).eq('id', id)
      fetchData()
    } catch (err) {
      alert('Error updating status')
    }
  }

  async function toggleDonated(id: string, currentStatus: boolean) {
    const action = currentStatus ? 'Mark as unpaid?' : 'Mark as donated?';
    if (!confirm(action)) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ donated: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      fetchData()
    } catch (err) {
      alert('Error updating donation status')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-primary text-white flex flex-col">
        <div className="p-6 flex flex-col items-center border-b border-white/10">
          <img src="/logo.png" alt="YKB Logo" className="h-24 mb-2 bg-white rounded-lg p-1" />
          <h1 className="text-xl font-bold">
            Admin Panel
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'bookings' ? 'bg-white/10 text-accent font-semibold' : 'hover:bg-white/5'}`}
          >
            <Users className="w-5 h-5" />
            Bookings
          </button>
          <button 
            onClick={() => setActiveTab('slots')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'slots' ? 'bg-white/10 text-accent font-semibold' : 'hover:bg-white/5'}`}
          >
            <Calendar className="w-5 h-5" />
            Manage Slots
          </button>
          <button 
            onClick={() => setActiveTab('atc')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'atc' ? 'bg-white/10 text-accent font-semibold' : 'hover:bg-white/5'}`}
          >
            <Monitor className="w-5 h-5" />
            ATC Registration
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab === 'atc' ? 'ATC Registration' : activeTab}</h2>
          <div className="text-sm text-gray-500">
            Welcome back, Admin
          </div>
        </header>

        <main className="p-8">
          {activeTab === 'bookings' ? (
            <div className="space-y-8">
              {/* Waiting Bookings Grouped by Slot */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Active Queue (Waiting)
                </h3>
                
                {slots.filter((s: any) => bookingsBySlot[s.id]?.length > 0).map((slot: any) => {
                  const totalRegCount = bookings.filter((b: any) => b.slot_id === slot.id && b.status !== 'cancelled').length
                  return (
                    <div key={slot.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">
                            {format(new Date(slot.start_time), 'EEEE, MMM d')}
                          </span>
                          <span className="text-gray-500">
                            {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                          </span>
                        </div>
                        <span className="text-sm font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
                          {totalRegCount} / {slot.max_capacity} Occupied
                        </span>
                      </div>
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Vehicle Info</th>
                            <th className="px-6 py-3">Sign Up Time</th>
                            <th className="px-6 py-3">Donated</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {bookingsBySlot[slot.id].map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">{booking.name}</div>
                                <div className="text-sm text-gray-500">{formatPhone(booking.phone)}</div>
                                <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{booking.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <div className="text-sm font-medium text-gray-800">{booking.vehicle_color} {booking.vehicle_make_model}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs text-gray-400">{format(new Date(booking.created_at), 'h:mm a')}</span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => toggleDonated(booking.id, !!booking.donated)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all border ${
                                    booking.donated 
                                      ? 'bg-green-100 text-green-700 border-green-200' 
                                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {booking.donated ? (
                                    <>
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                      Donated
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                      Not Paid
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Complete Wash
                                </button>
                                <button 
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Unbook / Cancel"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}

                {Object.keys(bookingsBySlot).length === 0 && (
                  <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300 text-gray-500">
                    No waiting bookings at the moment.
                  </div>
                )}
              </div>

              {/* Completed Bookings Collapsible */}
              <div className="mt-12">
                <button 
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-semibold transition-colors"
                >
                  {showCompleted ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  Completed Bookings ({completedBookings.length})
                </button>
                
                {showCompleted && (
                  <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-80">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3">Customer</th>
                          <th className="px-6 py-3">Vehicle</th>
                          <th className="px-6 py-3">Slot</th>
                          <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {completedBookings.map((booking: any) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-3 text-sm">
                              <div className="font-medium text-gray-900">{booking.name}</div>
                              <div className="text-[10px] text-gray-400">{formatPhone(booking.phone)}</div>
                              <div className="text-[10px] text-gray-400">{booking.email}</div>
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <div className="text-gray-600">{booking.vehicle_color} {booking.vehicle_make_model}</div>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {booking.slots ? format(new Date(booking.slots.start_time), 'MMM d, h:mm a') : 'N/A'}
                            </td>
                            <td className="px-6 py-3 text-right flex items-center justify-end gap-3">
                              <span className="text-green-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Completed
                              </span>
                              <button 
                                onClick={() => updateBookingStatus(booking.id, 'waiting')}
                                className="p-1 text-gray-400 hover:text-primary transition-colors"
                                title="Undo / Re-queue"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'atc' ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-primary/5 px-8 py-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Monitor className="w-6 h-6 text-primary" />
                    New At-The-Counter Registration
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">Directly register a customer into the queue. Waiver and donation steps are skipped.</p>
                </div>
                
                <form onSubmit={handleAtcSubmit} className="p-8 space-y-8">
                  {atcSuccess && (
                    <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Registration successful! Customer added to queue.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Customer Info
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-gray-700">Full Name</label>
                          <input 
                            required
                            type="text" 
                            placeholder="John Doe"
                            value={atcForm.name}
                            onChange={(e) => setAtcForm({...atcForm, name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                          <input 
                            required
                            type="tel" 
                            placeholder="(555) 000-0000"
                            value={atcForm.phone}
                            onChange={(e) => setAtcForm({...atcForm, phone: formatPhoneInput(e.target.value)})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-gray-700">Email Address</label>
                          <input 
                            required
                            type="email" 
                            placeholder="john@example.com"
                            value={atcForm.email}
                            onChange={(e) => setAtcForm({...atcForm, email: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Vehicle Details
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Make/Model</label>
                            <input 
                              required
                              type="text" 
                              placeholder="Toyota Camry"
                              value={atcForm.vehicleMakeModel}
                              onChange={(e) => setAtcForm({...atcForm, vehicleMakeModel: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Color</label>
                            <input 
                              required
                              type="text" 
                              placeholder="Silver"
                              value={atcForm.vehicleColor}
                              onChange={(e) => setAtcForm({...atcForm, vehicleColor: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Select Assignment Slot
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slots.map((slot: any) => {
                        const regCount = bookings.filter((b: any) => b.slot_id === slot.id && b.status !== 'cancelled').length
                        const isFull = regCount >= slot.max_capacity
                        const isFlex = !slot.is_active
                        const isSelected = atcForm.selectedSlot === slot.id

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setAtcForm({...atcForm, selectedSlot: slot.id})}
                            className={`p-4 text-left border rounded-xl transition-all relative ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary ring-inset'
                                : isFlex
                                  ? 'border-amber-400 bg-amber-50/50 hover:bg-amber-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {isFlex && (
                              <div className="absolute -top-2 left-3 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded border border-amber-200 uppercase tracking-tighter">
                                Flex
                              </div>
                            )}
                            <div className="font-bold text-gray-900 text-sm">
                              {format(new Date(slot.start_time), 'MMM d, h:mm a')}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                {regCount} / {slot.max_capacity}
                              </span>
                              {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      disabled={atcSubmitting}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 disabled:bg-gray-300 transition-all flex items-center justify-center gap-3 shadow-lg"
                    >
                      {atcSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Registering...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Complete Registration
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
            <div className="space-y-6">
              {/* Slot Management Actions */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Single Slot Add */}
                <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Add Single Slot
                  </h3>
                  <form onSubmit={addSlot} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
                      <input 
                        required 
                        type="date" 
                        value={newSlot.date}
                        onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start</label>
                      <input 
                        required 
                        type="time" 
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End</label>
                      <input 
                        required 
                        type="time" 
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cars</label>
                      <input 
                        required 
                        type="number" 
                        min="1"
                        value={newSlot.capacity}
                        onChange={(e) => setNewSlot({...newSlot, capacity: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" 
                      />
                    </div>
                    <button className="lg:col-span-4 bg-primary text-white py-2.5 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-sm flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Time Slot
                    </button>
                  </form>
                </div>

                {/* Mass Create Toggle */}
                <div className="md:w-72 bg-gradient-to-br from-primary to-primary/80 p-6 rounded-xl shadow-lg border border-primary/20 text-white flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      <CalendarPlus className="w-5 h-5 text-accent" />
                      Bulk Generator
                    </h3>
                    <p className="text-white/70 text-xs leading-relaxed">
                      Quickly generate multiple slots for an entire day with custom intervals.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowMassCreate(true)}
                    className="mt-6 w-full bg-accent text-white py-2.5 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Open Bulk Creator
                  </button>
                </div>
              </div>

              {/* Edit Modal */}
              <Modal 
                isOpen={!!editingSlot} 
                onClose={() => setEditingSlot(null)} 
                title="Edit Time Slot"
              >
                {editingSlot && (
                  <form onSubmit={updateSlot} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
                        <input 
                          required 
                          type="date" 
                          value={editingSlot.date}
                          onChange={(e) => setEditingSlot({...editingSlot, date: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Start Time</label>
                        <input 
                          required 
                          type="time" 
                          value={editingSlot.startTime}
                          onChange={(e) => setEditingSlot({...editingSlot, startTime: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">End Time</label>
                        <input 
                          required 
                          type="time" 
                          value={editingSlot.endTime}
                          onChange={(e) => setEditingSlot({...editingSlot, endTime: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Max Capacity (Cars)</label>
                        <input 
                          required 
                          type="number" 
                          min="1"
                          value={editingSlot.capacity}
                          onChange={(e) => setEditingSlot({...editingSlot, capacity: parseInt(e.target.value)})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setEditingSlot(null)}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg">
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </Modal>

              {/* Mass Create Modal */}
              <Modal 
                isOpen={showMassCreate} 
                onClose={() => setShowMassCreate(false)} 
                title="Bulk Slot Generator"
              >
                <form onSubmit={massCreateSlots} className="space-y-5">
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs leading-relaxed">
                      This tool will automatically divide the time range into slots based on the interval. 
                      Example: 9:00 - 10:00 with a 30m interval creates two slots (9:00 and 9:30).
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Target Date</label>
                      <input 
                        required 
                        type="date" 
                        value={massSlotConfig.date}
                        onChange={(e) => setMassSlotConfig({...massSlotConfig, date: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Start Day At</label>
                        <input 
                          required 
                          type="time" 
                          value={massSlotConfig.startTime}
                          onChange={(e) => setMassSlotConfig({...massSlotConfig, startTime: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">End Day At</label>
                        <input 
                          required 
                          type="time" 
                          value={massSlotConfig.endTime}
                          onChange={(e) => setMassSlotConfig({...massSlotConfig, endTime: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Slot Interval</label>
                        <select 
                          value={massSlotConfig.interval}
                          onChange={(e) => setMassSlotConfig({...massSlotConfig, interval: parseInt(e.target.value)})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-white"
                        >
                          <option value="15">Every 15 mins</option>
                          <option value="20">Every 20 mins</option>
                          <option value="30">Every 30 mins</option>
                          <option value="45">Every 45 mins</option>
                          <option value="60">Every 1 hour</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Cars per Slot</label>
                        <input 
                          required 
                          type="number" 
                          min="1"
                          value={massSlotConfig.capacity}
                          onChange={(e) => setMassSlotConfig({...massSlotConfig, capacity: parseInt(e.target.value)})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setShowMassCreate(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={isGenerating}
                      className="flex-[2] bg-accent text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-300"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="w-4 h-4" />
                          Generate Slots
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Modal>

              {/* Slots List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slots.map((slot: any) => {
                  const regCount = bookings.filter((b: any) => b.slot_id === slot.id && b.status !== 'cancelled').length
                  return (
                    <div key={slot.id} className={`bg-white p-6 rounded-xl shadow-sm border group hover:border-primary/50 transition-all relative ${!slot.is_active ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
                      {!slot.is_active && (
                        <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded border border-amber-200 uppercase tracking-wider">
                          Flex Slot
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-bold text-xl text-gray-900">{format(new Date(slot.start_time), 'EEEE')}</div>
                          <div className="text-gray-500 font-medium">{format(new Date(slot.start_time), 'MMM d, yyyy')}</div>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => toggleSlotActive(slot.id, !!slot.is_active)}
                            className={`p-2 rounded-lg transition-colors ${slot.is_active ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-amber-600 hover:text-primary hover:bg-primary/5'}`}
                            title={slot.is_active ? "Make Flex Slot" : "Make Public"}
                          >
                            {slot.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </button>
                          <button 
                            onClick={() => {
                              const startDate = new Date(slot.start_time)
                              const endDate = new Date(slot.end_time)
                              setEditingSlot({
                                id: slot.id,
                                date: format(startDate, 'yyyy-MM-dd'),
                                startTime: format(startDate, 'HH:mm'),
                                endTime: format(endDate, 'HH:mm'),
                                capacity: slot.max_capacity
                              })
                            }}
                            className="text-gray-400 hover:text-primary p-2 rounded-lg hover:bg-primary/5 transition-colors"
                            title="Edit Slot"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteSlot(slot.id)}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-accent" />
                          <span className="font-semibold">{format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-accent" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${regCount >= slot.max_capacity ? 'bg-red-500' : 'bg-primary'}`}
                              style={{ width: `${Math.min(100, (regCount / slot.max_capacity) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-600">{regCount}/{slot.max_capacity}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
