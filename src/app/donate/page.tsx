'use client'

import { Car, ChevronLeft, Heart } from 'lucide-react'
import Link from 'next/link'

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-10 group text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Booking
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <img src="/logo.png" alt="YKB Logo" className="h-24 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-primary mb-3">Support Our Fundraiser</h1>
          <p className="text-gray-600 italic">Fast, Reliable, and Community-Driven</p>
          <div className="h-1 w-20 bg-accent mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="space-y-8">
          {/* Recommended Amounts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Recommended Donations
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-primary" />
                  <span className="font-medium text-gray-700">Sedan</span>
                </div>
                <span className="text-xl font-bold text-primary">$25</span>
              </div>

              <div className="p-4 border border-gray-100 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Car className="w-6 h-6 text-primary" />
                  <span className="font-medium text-gray-700">SUV / Large</span>
                </div>
                <span className="text-xl font-bold text-primary">$35</span>
              </div>
            </div>
            
            <p className="mt-6 text-sm text-gray-500 text-center leading-relaxed">
              Donating now saves time at the event. Simply show your confirmation text to our volunteers when you arrive!
            </p>
          </div>

          {/* GiveButter Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Secure Donation</h2>
              <p className="text-sm text-gray-500 mt-1">Processed securely by Givebutter</p>
            </div>
            <div className="p-4 min-h-[400px] flex items-center justify-center">
              {/* @ts-ignore */}
              <givebutter-widget id="LZokK5"></givebutter-widget>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-400 text-xs">
          <p>&copy; {new Date().getFullYear()} Young Khalsa Boys. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
