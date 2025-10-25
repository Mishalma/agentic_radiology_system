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
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error("No image data provided");
    }

    console.log("Analyzing X-ray image with Gemini...");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert radiologist AI assistant analyzing X-ray images. 
Your task is to provide a detailed, professional analysis following evidence-based radiology practices.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations - just raw JSON.

Analyze the X-ray image and return a JSON object with this EXACT structure:
{
  "findings": [
    {
      "pathology": "specific finding name",
      "confidence": 0.85,
      "description": "detailed description of the finding"
    }
  ],
  "impression": "overall clinical impression summary",
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Guidelines:
- Be thorough but concise
- confidence values between 0.0 and 1.0
- Look for: pneumonia, cardiomegaly, fractures, nodules, infiltrates, effusions
- If normal, return findings array with one item indicating normal appearance
- Provide 2-4 clinical recommendations`;

    // Extract base64 data from data URL
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `${systemPrompt}\n\nPlease analyze this chest X-ray image following the JSON structure provided.`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1500,
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    console.log("Gemini response received");
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      analysisResult = JSON.parse(cleanedResponse);
      
      // Validate structure
      if (!analysisResult.findings || !Array.isArray(analysisResult.findings)) {
        throw new Error("Invalid response structure");
      }

      console.log("Analysis successful:", analysisResult);
      
      return new Response(
        JSON.stringify(analysisResult),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
      
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw AI response:", aiResponse);
      
      // Return a fallback response
      return new Response(
        JSON.stringify({
          findings: [
            {
              pathology: "Analysis Incomplete",
              confidence: 0.5,
              description: "The AI analysis could not be completed properly. Please ensure the image is a clear X-ray and try again."
            }
          ],
          impression: "Unable to generate complete analysis at this time.",
          recommendations: [
            "Verify image quality and try again",
            "If issue persists, consult with a radiologist directly"
          ]
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

  } catch (error) {
    console.error("Error in analyze-xray function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});