import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch context data for the AI
    const [subjects, vehicles, records, reports] = await Promise.all([
      supabase.from("subjects").select("full_name, date_of_birth, gender, nationality, address, phone, notes").limit(100),
      supabase.from("vehicles").select("plate_number, make, model, year, color, owner_name, registration_status, vin").limit(100),
      supabase.from("criminal_records").select("crime_type, date, description, evidence").limit(100),
      supabase.from("reports").select("report_number, title, report_type, status, location, narrative, incident_date").limit(50),
    ]);

    const dbContext = `
MCPD DATABASE CONTEXT (current data snapshot):

SUBJECTS (${subjects.data?.length || 0}):
${JSON.stringify(subjects.data || [], null, 1)}

VEHICLES (${vehicles.data?.length || 0}):
${JSON.stringify(vehicles.data || [], null, 1)}

CRIMINAL RECORDS (${records.data?.length || 0}):
${JSON.stringify(records.data || [], null, 1)}

REPORTS (${reports.data?.length || 0}):
${JSON.stringify(reports.data || [], null, 1)}
`;

    const { messages } = await req.json();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are the MCPD AI Assistant — an advanced law enforcement intelligence system for the Meta City Police Department. You help officers search records, query subjects, look up vehicles, summarize cases, and provide procedural guidance.

You have access to the department's database below. Use it to answer queries accurately. If data isn't found, say so. Be concise, tactical, and professional. Use police terminology. Format responses with markdown when helpful.

${dbContext}`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mcpd-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
