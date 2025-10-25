import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientEmail, patientName, impression, reportId } = await req.json();
    
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log("Sending notification to:", patientEmail);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Your Radiology Report is Ready</h1>
        <p>Dear ${patientName},</p>
        <p>Your X-ray analysis has been completed and reviewed by our medical team.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1f2937;">Report Summary</h2>
          <p><strong>Impression:</strong> ${impression}</p>
          <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
            Report ID: ${reportId}
          </p>
        </div>

        <p style="margin-top: 30px;">
          <strong>Next Steps:</strong>
        </p>
        <ul style="color: #374151;">
          <li>Please schedule an appointment with your doctor to discuss the results</li>
          <li>Bring this report notification with you to your appointment</li>
          <li>If you have any urgent concerns, contact your healthcare provider immediately</li>
        </ul>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p><strong>⚠️ Important Medical Disclaimer:</strong></p>
          <p>This is an AI-assisted analysis for decision support only. It is not intended for sole diagnosis. 
          Always consult with qualified medical professionals for proper medical advice and treatment.</p>
          <p style="margin-top: 10px;">© 2025 RadAI Orchestrator - Hackathon Prototype</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RadAI Orchestrator <onboarding@resend.dev>',
        to: [patientEmail],
        subject: 'Your Radiology Report is Ready',
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      throw new Error(`Email service error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
