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

    const { to, subject, body, originalMessage } = requestBody;

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

    // Send email via Resend using template
    console.log("Enviando email via Resend con plantilla Nyura...");
    console.log("Datos:", { to, subject, body, fromEmail });
    
    const emailData = {
      from: fromEmail,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">Nyura Motors</h1>
              <p style="color: #666; margin: 5px 0;">Respuesta a tu consulta</p>
            </div>
            
            ${originalMessage ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
              <p style="margin: 0; color: #495057;"><strong>Mensaje original:</strong></p>
              <p style="margin: 10px 0; color: #6c757d; font-style: italic;">${originalMessage}</p>
            </div>
            ` : ''}
            
            <div style="margin: 30px 0;">
              <p style="color: #333; line-height: 1.6;">${body}</p>
            </div>
            
            <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                Este mensaje fue enviado desde el panel de administración de Nyura Motors.<br>
                Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    console.log("Payload Resend:", JSON.stringify(emailData, null, 2));
    
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
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
