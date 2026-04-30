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
    const { password } = await req.json()
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@ykb-carwash.com'

    if (!adminPassword) {
      return new Response(
        JSON.stringify({ error: 'ADMIN_PASSWORD environment variable not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If password is correct, ensure admin user exists and has this password
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Check if user exists
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const adminUser = users.users.find(u => u.email === adminEmail)

    if (!adminUser) {
      // Create admin user
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      })
      if (createError) throw createError
    } else {
      // Update password just in case it changed in env
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        { password: adminPassword }
      )
      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, email: adminEmail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
