import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("=== VERSIÓN 2025-03-25-17:30 - FUNCIÓN INVOCADA ===");
  console.log("Método:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  console.log("Timestamp:", new Date().toISOString());

  try {
    // Parse request body
    const requestBody = await req.json();
    console.log("Body recibido:", requestBody);

    const { to, subject, body } = requestBody;

    if (!to || !subject || !body) {
      console.log("Error: Faltan campos requeridos");
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const fromEmail = Deno.env.get("RESEND_FROM")!;

    console.log("Variables de entorno verificadas");

    // Send email via Resend
    console.log("Enviando email via Resend...");
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      }),
    });

    console.log("Respuesta Resend:", resendResp.status);

    if (!resendResp.ok) {
      const errorText = await resendResp.text();
      console.error("Error Resend:", errorText);
      return new Response(
        JSON.stringify({ error: "Error sending email", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resendData = await resendResp.json();
    console.log("Email enviado exitosamente:", resendData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        data: resendData 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error general:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
