'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-10 group text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Booking
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <img src="/logo.png" alt="YKB Logo" className="h-32 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-black text-primary mb-8">Support Our Fundraiser</h1>
          
          <div className="space-y-3 text-xl text-gray-600 font-medium">
            <p>Suggested donation for Sedans: <span className="text-primary font-bold">$25</span></p>
            <p>Suggested donation for SUVs and Large Vehicles: <span className="text-primary font-bold">$35</span></p>
          </div>
        </div>

        {/* GiveButter Widget */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          <div className="p-1 min-h-[800px] flex items-center justify-center bg-white">
            {/* @ts-ignore */}
            <givebutter-widget id="LZokK5" width="100%" height="800"></givebutter-widget>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Young Khalsa Boys. Thank you for your support!
          </p>
        </div>
      </div>
    </div>
  )
}
