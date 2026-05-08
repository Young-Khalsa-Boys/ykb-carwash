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
        <div className="text-center mb-10">
          <img src="/logo.png" alt="YKB Logo" className="h-32 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-2">Support Our Fundraiser</h1>
          <p className="text-gray-600 italic">Fast, Reliable, and Community-Driven</p>
          <div className="h-1 w-20 bg-accent mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="space-y-8">
          {/* Recommended Amounts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 rounded-lg">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Suggested Donations</h2>
                <p className="text-sm text-gray-500">Your contribution helps us grow</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 border border-gray-100 bg-gray-50 rounded-xl flex items-center justify-between group hover:border-accent hover:bg-white transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-accent/20 transition-colors">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="block font-bold text-gray-900">Sedan</span>
                    <span className="text-xs text-gray-500">Standard Wash</span>
                  </div>
                </div>
                <span className="text-2xl font-black text-primary">$25</span>
              </div>

              <div className="p-5 border border-gray-100 bg-gray-50 rounded-xl flex items-center justify-between group hover:border-accent hover:bg-white transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:border-accent/20 transition-colors">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="block font-bold text-gray-900">SUV / Large</span>
                    <span className="text-xs text-gray-500">Detailed Wash</span>
                  </div>
                </div>
                <span className="text-2xl font-black text-primary">$35</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-primary font-medium text-center leading-relaxed">
                ✨ Donating now saves time at the event. Simply show your confirmation text to our volunteers when you arrive!
              </p>
            </div>
          </div>

          {/* GiveButter Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Secure Checkout</h2>
              <p className="text-sm text-gray-500 mt-1">Processed securely by Givebutter</p>
            </div>
            <div className="p-6 min-h-[450px] flex items-center justify-center bg-white">
              {/* @ts-ignore */}
              <givebutter-widget id="LZokK5"></givebutter-widget>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Young Khalsa Boys. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
