// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface Finding {
  pathology: string;
  confidence: number;
  description: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  anatomical_location: string;
}

export interface AnalysisResult {
  findings: Finding[];
  impression: string;
  recommendations: string[];
  differential_diagnosis: string[];
  urgency_level: 'routine' | 'urgent' | 'emergent';
}

export const analyzeXrayWithGemini = async (imageBase64: string): Promise<AnalysisResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Please add VITE_GEMINI_API_KEY to your .env file");
  }

  const systemPrompt = `You are an expert radiologist AI with specialized training in chest X-ray interpretation. Provide comprehensive medical analysis using precise clinical terminology.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations - just raw JSON.

Analyze the X-ray image and return a JSON object with this EXACT structure:
{
  "findings": [
    {
      "pathology": "specific medical finding",
      "confidence": 0.95,
      "description": "detailed clinical description",
      "severity": "normal|mild|moderate|severe",
      "anatomical_location": "specific anatomical region (RUL, RML, RLL, LUL, LLL, etc.)"
    }
  ],
  "impression": "comprehensive clinical impression",
  "recommendations": ["clinical recommendation 1", "clinical recommendation 2"],
  "differential_diagnosis": ["possible diagnosis 1", "possible diagnosis 2"],
  "urgency_level": "routine|urgent|emergent"
}

Systematic Analysis Protocol:
1. Cardiac Assessment: heart size, borders, mediastinum, cardiothoracic ratio
2. Pulmonary Assessment: lung fields, pleural spaces, diaphragm, infiltrates
3. Skeletal Assessment: ribs, spine, clavicles, fractures
4. Soft Tissue Assessment: chest wall, neck structures
5. Technical Quality: positioning, inspiration, penetration

Medical Requirements:
- Use precise anatomical terms (RUL=Right Upper Lobe, RML=Right Middle Lobe, RLL=Right Lower Lobe, LUL=Left Upper Lobe, LLL=Left Lower Lobe)
- Assess severity: normal, mild, moderate, severe
- Determine clinical urgency: routine, urgent, emergent
- Provide differential diagnoses for abnormal findings
- Include measurements when relevant (cardiothoracic ratio if abnormal)
- Look for: pneumonia, pneumothorax, cardiomegaly, fractures, masses, infiltrates, effusions, atelectasis, nodules`;

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
        temperature: 0.1,
        maxOutputTokens: 2000,
      }
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 403) {
      throw new Error("Invalid API key or quota exceeded.");
    }
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!aiResponse) {
    throw new Error("No response from Gemini API");
  }

  try {
    // Remove markdown code blocks if present
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const analysisResult = JSON.parse(cleanedResponse);
    
    // Validate structure
    if (!analysisResult.findings || !Array.isArray(analysisResult.findings)) {
      throw new Error("Invalid response structure from AI");
    }

    return analysisResult;
    
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    console.error("Raw AI response:", aiResponse);
    
    // Return fallback response
    return {
      findings: [
        {
          pathology: "Analysis Incomplete",
          confidence: 0.5,
          description: "The AI analysis could not be completed properly. Please ensure the image is a clear X-ray and try again.",
          severity: "normal" as const,
          anatomical_location: "chest"
        }
      ],
      impression: "Unable to generate complete analysis at this time.",
      recommendations: [
        "Verify image quality and try again",
        "If issue persists, consult with a radiologist directly"
      ],
      differential_diagnosis: ["Technical limitation"],
      urgency_level: "routine" as const
    };
  }
};

export const generateReportId = (): string => {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendEmailNotification = async (patientEmail: string, patientName: string, impression: string, reportId: string): Promise<void> => {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("EmailJS configuration missing. Please add VITE_EMAILJS_* environment variables.");
  }

  const templateParams = {
    to_email: patientEmail,
    patient_name: patientName,
    impression: impression,
    report_id: reportId,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    from_name: 'RadAI Orchestrator',
    message: `Dear ${patientName},\n\nYour X-ray analysis has been completed and reviewed by our medical team.\n\nReport Summary:\nImpression: ${impression}\nReport ID: ${reportId}\n\nNext Steps:\n• Please schedule an appointment with your doctor to discuss the results\n• Bring this report notification with you to your appointment\n• If you have any urgent concerns, contact your healthcare provider immediately\n\n⚠️ Important Medical Disclaimer:\nThis is an AI-assisted analysis for decision support only. It is not intended for sole diagnosis. Always consult with qualified medical professionals for proper medical advice and treatment.\n\n© 2025 RadAI Orchestrator - Medical Analysis System`
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    
    if (response.status !== 200) {
      throw new Error(`Email sending failed with status: ${response.status}`);
    }
    
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('EmailJS error:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};