import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all bookings with their slot start times
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        name,
        email,
        slots (
          start_time
        )
      `)
      .eq('status', 'pending') // You might want to adjust this filter

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw bookingsError
    }

    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ message: 'No bookings found to notify.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Preparing to send ${bookings.length} reminder emails...`)

    const emails = bookings.map((booking: any) => {
      const slot = Array.isArray(booking.slots) ? booking.slots[0] : booking.slots
      const startTime = new Date(slot.start_time)
      const formattedTime = startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York',
        timeZoneName: 'short'
      })

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Car Wash Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #171717; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb; }
    .wrapper { padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { height: 80px; }
    .content { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .accent-bar { height: 4px; background-color: #FF9933; width: 100%; }
    .inner-content { padding: 40px; }
    .greeting { color: #003366; font-size: 24px; font-weight: bold; margin-bottom: 16px; }
    .highlight { color: #003366; font-weight: 700; }
    .info-box { background: #f0f7ff; border: 1px solid #c3dafe; padding: 20px; margin: 24px 0; border-radius: 12px; }
    .footer { text-align: center; margin-top: 32px; font-size: 14px; color: #6b7280; }
    .btn { display: inline-block; background: #003366; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin-top: 8px; text-align: center; }
    .contact-info { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #4b5563; }
    .badge { display: inline-block; background: #fff7ed; color: #ea580c; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://carwash.youngkhalsaboys.com/logo.png" alt="YKB Logo" class="logo">
    </div>

    <div class="content">
      <div class="accent-bar"></div>

      <div class="inner-content">
        <div class="badge">Reminder</div>

        <div class="greeting">
          See you tomorrow, ${booking.name}!
        </div>

        <p>
          This is a friendly reminder that your Young Khalsa Boys car wash appointment is scheduled for:
        </p>

        <p style="font-size: 18px; margin: 8px 0;">
          <span class="highlight">Sunday, May 17</span><br>
          <span class="highlight">${formattedTime}</span>
        </p>

        <div class="info-box">
          <p style="margin: 0; color: #1e40af; font-weight: 600;">
            📱 We’ll text you when it’s your turn!
          </p>

          <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;">
            Please stay near your phone and plan to check in at the YKB table in the Gurdwara lobby 10 minutes prior to your reservation time.
          </p>
        </div>

        <p style="margin-bottom: 24px;">
          Want to save time at check-in? You can donate online ahead of time:
        </p>

        <a href="https://carwash.youngkhalsaboys.com/donate" class="btn">
          Donate Now & Save Time
        </a>

        <div class="contact-info">
          <p style="margin-bottom: 8px; font-weight: bold; color: #003366;">
            Need to reschedule or cancel?
          </p>

          <p style="margin: 0;">
            Please let us know as soon as possible so we can offer the slot to someone else:
          </p>

          <p style="margin: 8px 0;">
            <strong>Phone:</strong> 914-589-4890<br>
            <strong>Email:</strong> carwash@youngkhalsaboys.com
          </p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Young Khalsa Boys. All rights reserved.</p>

      <p>
        <a href="https://youngkhalsaboys.com" style="color: #FF9933; text-decoration: none; font-weight: 500;">
          Understand our mission
        </a>
      </p>
    </div>
  </div>
</body>
</html>
      `

      return {
        from: 'YKB Car Wash <carwash@youngkhalsaboys.com>',
        to: [booking.email],
        subject: 'Reminder: Your Car Wash Appointment is Tomorrow!',
        html: emailHtml,
      }
    })

    // Resend Batch API allows up to 100 emails per request
    const batchSize = 100
    const results = []

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(batch),
      })

      const result = await res.json()
      results.push(result)
      
      if (!res.ok) {
        console.error(`Error sending batch ${i / batchSize + 1}:`, result)
      }
    }

    return new Response(JSON.stringify({ message: `Successfully processed ${emails.length} emails.`, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
