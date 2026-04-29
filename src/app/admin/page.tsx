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
  LogOut
} from 'lucide-react'

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bookings' | 'slots'>('bookings')
  
  // New Slot Form
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    capacity: 1
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: bData } = await supabase
        .from('bookings')
        .select('*, slots(*)')
        .order('created_at', { ascending: false })
      
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

  async function updateBookingStatus(id: string, status: string) {
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
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h2>
          <div className="text-sm text-gray-500">
            Welcome back, Admin
          </div>
        </header>

        <main className="p-8">
          {activeTab === 'bookings' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Time Slot</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{booking.name}</div>
                        <div className="text-sm text-gray-500">{booking.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{booking.license_plate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.slots ? format(new Date(booking.slots.start_time), 'MMM d, h:mm a') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button 
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          className="text-green-600 hover:text-green-800 p-1" title="Complete"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800 p-1" title="Cancel"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No bookings found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Add Slot Form */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-accent" />
                  Add New Time Slot
                </h3>
                <form onSubmit={addSlot} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Date</label>
                    <input 
                      required 
                      type="date" 
                      value={newSlot.date}
                      onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Start Time</label>
                    <input 
                      required 
                      type="time" 
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">End Time</label>
                    <input 
                      required 
                      type="time" 
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md" 
                    />
                  </div>
                  <button className="bg-primary text-white py-2 rounded-md font-bold hover:bg-opacity-90">
                    Create Slot
                  </button>
                </form>
              </div>

              {/* Slots List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {slots.map((slot) => (
                  <div key={slot.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">{format(new Date(slot.start_time), 'EEEE, MMM d')}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteSlot(slot.id)}
                      className="text-gray-400 hover:text-red-600 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
