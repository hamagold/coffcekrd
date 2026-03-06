import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();

    if (body.action === "check") {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const { data: roles } = await supabase.from("user_roles").select("user_id");
      const hasAdmin = roles && roles.length > 0;
      return new Response(JSON.stringify({ needsSetup: !hasAdmin }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create super admin (allow if no admin roles exist)
    const { email, password, name } = body;

    const { data: existingRoles } = await supabase.from("user_roles").select("user_id");
    if (existingRoles && existingRoles.length > 0) {
      return new Response(JSON.stringify({ error: "Initial setup already completed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user with this email already exists
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
    let userId: string;
    const existing = existingUsers?.find((u: any) => u.email === email);

    if (existing) {
      userId = existing.id;
      // Update password
      await supabase.auth.admin.updateUserById(userId, { password, user_metadata: { name } });
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { name },
      });
      if (error) throw error;
      userId = data.user.id;
    }

    // Ensure profile exists
    await supabase.from("profiles").upsert({ id: userId, name });

    // Assign super role
    await supabase.from("user_roles").upsert({ user_id: userId, role: "super" });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
