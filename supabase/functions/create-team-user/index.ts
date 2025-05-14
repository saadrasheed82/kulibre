// supabase/functions/create-team-user/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface CreateUserRequest {
  email: string;
  password?: string;
  full_name: string;
  role: 'admin' | 'team_member' | 'client';
  team_id?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the user making the request is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the caller has admin privileges
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching caller profile', details: profileError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only allow admins to create users
    if (callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can create new users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request body
    const requestData: CreateUserRequest = await req.json()
    const { email, password, full_name, role, team_id } = requestData

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a random password if none is provided
    const userPassword = password || Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + '!1'

    // Create the user in Supabase Auth
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true, // Auto-confirm the email
    })

    if (createUserError) {
      return new Response(
        JSON.stringify({ error: 'Error creating user', details: createUserError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the user's profile
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        role,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.user.id)

    if (updateProfileError) {
      // If profile update fails, try to delete the created user to avoid orphaned auth users
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ error: 'Error updating user profile', details: updateProfileError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If a team_id is provided, add the user to the team
    if (team_id) {
      const { error: teamMemberError } = await supabaseAdmin
        .from('team_members')
        .insert({
          team_id,
          user_id: authUser.user.id,
          role: role === 'admin' ? 'admin' : 'member',
        })

      if (teamMemberError) {
        console.error('Error adding user to team:', teamMemberError)
        // Continue execution even if team assignment fails
      }
    }

    // Create an invitation record
    const { error: invitationError } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        email,
        role,
        user_id: authUser.user.id,
        created_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(), // Mark as accepted since we're creating the user directly
      })

    if (invitationError) {
      console.error('Error creating invitation record:', invitationError)
      // Continue execution even if invitation record creation fails
    }

    // Return success response with user data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          full_name,
          role,
        },
        password: password ? undefined : userPassword, // Only return the generated password if one wasn't provided
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})