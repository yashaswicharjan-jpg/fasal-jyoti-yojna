import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, imageBase64, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langInstruction = language === 'hi' 
      ? 'Respond in Hindi using simple language a farmer with 5th grade education can understand.' 
      : language === 'mr' 
        ? 'Respond in Marathi using simple language.' 
        : 'Respond in English using simple language.';

    let systemPrompt = '';
    const userMessages: any[] = [];

    switch (mode) {
      case 'disease':
        systemPrompt = `You are an expert agricultural plant pathologist AI assistant for Indian farmers. ${langInstruction}
Analyze the plant image and return a JSON object with these fields:
{
  "DiseaseName": "name in English",
  "DiseaseNameHindi": "name in Hindi",
  "Severity": "Low|Medium|High",
  "Confidence": "percentage string like 85%",
  "ChemicalCure": "recommended chemical treatment",
  "ChemicalDosage": "exact dosage",
  "OrganicAlternative": "organic treatment name",
  "OrganicMethod": "how to apply organic treatment",
  "Prevention": ["tip1", "tip2", "tip3"],
  "AffectedCrops": ["crop1", "crop2"],
  "ImmediateAction": "what to do right now"
}
Only return valid JSON, no markdown wrapping.`;
        if (imageBase64) {
          userMessages.push({
            role: "user",
            content: [
              { type: "text", text: "Analyze this plant image for diseases." },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          });
        }
        break;

      case 'soil':
        systemPrompt = `You are an expert soil scientist AI assistant for Indian farmers. ${langInstruction}
Analyze the soil image and return a JSON object:
{
  "SoilType": "type name",
  "pH": "estimated pH range",
  "Fertility": "Low|Medium|High",
  "Confidence": "percentage string like 80%",
  "RecommendedCrops": ["crop1", "crop2", "crop3"],
  "Deficiencies": ["nutrient1", "nutrient2"],
  "Amendments": "detailed amendment recommendations"
}
Only return valid JSON, no markdown wrapping.`;
        if (imageBase64) {
          userMessages.push({
            role: "user",
            content: [
              { type: "text", text: "Analyze this soil image." },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          });
        }
        break;

      case 'diagnostic_followup':
        systemPrompt = `You are an expert agricultural diagnostician. A farmer has provided follow-up answers to refine an initial AI diagnosis. ${langInstruction}
Based on the original diagnosis and the farmer's additional observations, provide a REFINED and more accurate diagnosis.
Return a JSON object in the SAME FORMAT as the original diagnosis, but with updated/corrected values based on the new information.
If the follow-up answers confirm the original diagnosis, increase the Confidence. If they contradict it, provide a corrected diagnosis.
Only return valid JSON, no markdown wrapping.`;
        break;

      case 'crop_advisor':
        systemPrompt = `You are an expert crop advisor AI for Indian farmers. ${langInstruction}
Based on the farmer's inputs, recommend the top 3 best crops. Return a JSON array:
[{
  "CropName": "English name",
  "CropNameHindi": "Hindi name",
  "Emoji": "relevant emoji",
  "YieldPerAcre": "expected yield",
  "GrowingPeriod": "days range",
  "MarketPrice": "current price per quintal in ₹",
  "EstimatedProfit": "profit range in ₹",
  "WaterRequirement": "Low|Medium|High",
  "BestSowingTime": "date range",
  "KeyTips": ["tip1", "tip2", "tip3"],
  "GovernmentScheme": "relevant scheme name",
  "Confidence": "percentage"
}]
Only return valid JSON array, no markdown wrapping.`;
        break;

      case 'chat':
      default:
        systemPrompt = `You are "Kisan Dost" (किसान दोस्त), a friendly AI farming assistant for Indian farmers. ${langInstruction}
You help with: crop diseases, soil health, weather advice, government schemes, market prices, organic farming, irrigation, and pest management.
Use emojis. Keep answers practical and actionable. If unsure, say so and recommend consulting a local KVK expert.`;
        break;
    }

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...userMessages,
      ...(messages || []),
    ];

    const model = (mode === 'disease' || mode === 'soil') 
      ? "google/gemini-2.5-flash" 
      : "google/gemini-3-flash-preview";

    if (mode === 'chat') {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages: allMessages, stream: true }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages: allMessages }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ result: content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
