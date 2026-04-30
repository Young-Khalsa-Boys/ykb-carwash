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
  Edit2
} from 'lucide-react'

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bookings' | 'slots'>('bookings')
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

  const getBookingsBySlot = () => {
    const grouped: Record<string, any[]> = {}
    bookings.filter(b => b.status === 'pending' || b.status === 'waiting').forEach(b => {
      const slotId = b.slot_id
      if (!grouped[slotId]) grouped[slotId] = []
      grouped[slotId].push(b)
    })
    return grouped
  }

  const completedBookings = bookings.filter(b => b.status === 'completed')
  const bookingsBySlot = getBookingsBySlot()

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

  async function updateBookingStatus(id: string, status: string) {
    const confirmMsg = status === 'completed' 
      ? 'Mark this booking as completed?' 
      : `Change status to ${status}?`
    
    if (!confirm(confirmMsg)) return

    try {
      await supabase.from('bookings').update({ status }).eq('id', id)
      fetchData()
    } catch (err) {
      alert('Error updating status')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-primary text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-accent" />
            YKB Admin
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
          <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h2>
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
                
                {slots.filter(s => bookingsBySlot[s.id]?.length > 0).map(slot => (
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
                        {bookingsBySlot[slot.id].length} / {slot.max_capacity} Registered
                      </span>
                    </div>
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-gray-200">
                        {bookingsBySlot[slot.id].map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{booking.name}</div>
                              <div className="text-sm text-gray-500">{booking.phone}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{booking.license_plate}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-gray-400">Signed up: {format(new Date(booking.created_at), 'h:mm a')}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-100 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

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
                        {completedBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-3 text-sm">
                              <div className="font-medium text-gray-900">{booking.name}</div>
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <span className="font-mono text-gray-500">{booking.license_plate}</span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {booking.slots ? format(new Date(booking.slots.start_time), 'MMM d, h:mm a') : 'N/A'}
                            </td>
                            <td className="px-6 py-3 text-right">
                              <span className="text-green-600 text-xs font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Add/Edit Slot Form */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  {editingSlot ? <Edit2 className="w-5 h-5 text-accent" /> : <Plus className="w-5 h-5 text-accent" />}
                  {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
                </h3>
                <form onSubmit={editingSlot ? updateSlot : addSlot} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Date</label>
                    <input 
                      required 
                      type="date" 
                      value={editingSlot ? editingSlot.date : newSlot.date}
                      onChange={(e) => editingSlot 
                        ? setEditingSlot({...editingSlot, date: e.target.value})
                        : setNewSlot({...newSlot, date: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Start Time</label>
                    <input 
                      required 
                      type="time" 
                      value={editingSlot ? editingSlot.startTime : newSlot.startTime}
                      onChange={(e) => editingSlot
                        ? setEditingSlot({...editingSlot, startTime: e.target.value})
                        : setNewSlot({...newSlot, startTime: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">End Time</label>
                    <input 
                      required 
                      type="time" 
                      value={editingSlot ? editingSlot.endTime : newSlot.endTime}
                      onChange={(e) => editingSlot
                        ? setEditingSlot({...editingSlot, endTime: e.target.value})
                        : setNewSlot({...newSlot, endTime: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Max Capacity</label>
                    <input 
                      required 
                      type="number" 
                      min="1"
                      value={editingSlot ? editingSlot.capacity : newSlot.capacity}
                      onChange={(e) => editingSlot
                        ? setEditingSlot({...editingSlot, capacity: parseInt(e.target.value)})
                        : setNewSlot({...newSlot, capacity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-primary text-white py-2 rounded-md font-bold hover:bg-opacity-90 transition-all shadow-sm">
                      {editingSlot ? 'Update Slot' : 'Create Slot'}
                    </button>
                    {editingSlot && (
                      <button 
                        type="button"
                        onClick={() => setEditingSlot(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Slots List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slots.map((slot) => {
                  const regCount = bookings.filter(b => b.slot_id === slot.id && (b.status === 'pending' || b.status === 'waiting')).length
                  return (
                    <div key={slot.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 group hover:border-primary/50 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-bold text-xl text-gray-900">{format(new Date(slot.start_time), 'EEEE')}</div>
                          <div className="text-gray-500 font-medium">{format(new Date(slot.start_time), 'MMM d, yyyy')}</div>
                        </div>
                        <div className="flex gap-1">
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
                              setActiveTab('slots') // Just in case
                              window.scrollTo({ top: 0, behavior: 'smooth' })
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
