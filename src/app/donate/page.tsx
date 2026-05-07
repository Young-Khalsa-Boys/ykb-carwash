'use client'

import { Car, ChevronLeft, Heart, Info, Star } from 'lucide-react'
import Link from 'next/link'

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-3xl w-full">
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Booking
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Support Our Fundraiser</h1>
          <p className="text-gray-600 max-w-lg mx-auto text-lg leading-relaxed">
            All proceeds go directly to supporting Young Khalsa Boys programs and community initiatives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Recommended Amounts */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              Recommended Amounts
            </h2>
            
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Sedan / Small Car</h3>
                      <p className="text-gray-500 text-sm">Compact or standard sedan</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-primary">$25</div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-primary/20 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden ring-1 ring-primary/10">
                <div className="absolute top-0 left-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-wider">
                  Popular Choice
                </div>
                <div className="flex justify-between items-center relative z-10 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                      <Car className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">SUV / Large Vehicle</h3>
                      <p className="text-gray-500 text-sm">Van, Truck, or Large SUV</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-primary">$35</div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-amber-800 text-sm leading-snug">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Donating now skips the payment line at the event. Simply show your confirmation text to our volunteers!</p>
            </div>
          </div>

          {/* GiveButter Widget */}
          <div className="bg-white p-1 rounded-3xl border border-gray-100 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Donation Form</h2>
              <p className="text-sm text-gray-500">Securely processed by Givebutter</p>
            </div>
            <div className="flex-1 p-2 flex items-center justify-center bg-gray-50/50">
              {/* @ts-ignore */}
              <givebutter-widget id="LZokK5"></givebutter-widget>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Young Khalsa Boys. All donations are tax-deductible.</p>
        </div>
      </div>
    </div>
  )
}
