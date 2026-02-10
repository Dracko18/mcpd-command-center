import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const isAdmin = callerRoles?.some((r: any) => r.role === "administrator");
    if (!isAdmin) throw new Error("Admin access required");

    const { full_name, badge_number, username, rank, division_id } = await req.json();
    if (!full_name || !badge_number || !username) throw new Error("Missing required fields");

    const email = `${username.trim().toLowerCase()}@mcpd.local`;

    // Create user with service role (won't affect caller's session)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "1234",
      email_confirm: true,
      user_metadata: { badge_number, username },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create user");
    }

    await supabaseAdmin.from("profiles").insert({
      user_id: authData.user.id,
      full_name,
      badge_number,
      username: username.trim().toLowerCase(),
      rank: rank || "Enforcer I [ENF-I]",
      division_id: division_id || null,
      must_change_password: true,
    });

    await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id,
      role: "officer",
    });

    return new Response(JSON.stringify({ success: true, user_id: authData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-user error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
