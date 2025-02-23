
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    
    if (!pdfFile) {
      throw new Error("No PDF file provided");
    }

    const pdfContent = await pdfFile.text();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a course information extractor. Extract course information from the provided PDF text.
            Return ONLY a JSON array of courses with the following format, and nothing else:
            [
              {
                "code": string (e.g., "CS101"),
                "name": string,
                "lecturer": string,
                "credits": number,
                "venue": string,
                "timeSlot": string (e.g., "MON_0800"),
                "academicLevel": string,
                "classSize": number,
                "department": string
              }
            ]`
          },
          {
            role: "user",
            content: pdfContent
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    try {
      const courses = JSON.parse(extractedText);
      return new Response(JSON.stringify({ courses }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      throw new Error("Failed to parse extracted course data: " + error.message);
    }
  } catch (error) {
    console.error("Error processing PDF:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
