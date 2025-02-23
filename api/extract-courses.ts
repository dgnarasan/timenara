
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
      return new Response(
        JSON.stringify({ error: "No PDF file provided" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log file details for debugging
    console.log("[Debug] Processing PDF:", {
      name: pdfFile.name,
      type: pdfFile.type,
      size: pdfFile.size
    });

    let pdfContent: string;
    try {
      pdfContent = await pdfFile.text();
      console.log("[Debug] PDF content length:", pdfContent.length);
      console.log("[Debug] PDF content preview:", pdfContent.substring(0, 200));
    } catch (error) {
      console.error("[Error] Failed to read PDF content:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to read PDF content",
          details: error.message 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!pdfContent || pdfContent.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "PDF content is empty" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
      console.error("[Error] OpenAI API key not found");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("[Debug] Sending request to OpenAI API");
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a specialized academic course information extractor. Extract and structure course information from educational documents with high precision.

            For each course found, identify and validate:
            1. Course Code: Must follow academic format (e.g., CS101, MATH201, ENG303)
            2. Course Name: Full official course title
            3. Lecturer Name: Primary instructor (if available)
            4. Class Size: Expected or maximum class size (numeric)
            5. Prerequisites (if mentioned)
            6. Course Description (if available)

            Format the response as a JSON array of course objects:
            [
              {
                "code": string (required, format: 2-4 letters + 3-4 digits),
                "name": string (required),
                "lecturer": string (optional),
                "classSize": number (required),
                "academicLevel": null,
                "prerequisites": string[] (optional),
                "description": string (optional),
                "confidence": number (0-1, indicating extraction confidence)
              }
            ]`
          },
          {
            role: "user",
            content: pdfContent
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    // Log OpenAI response status and headers
    console.log("[Debug] OpenAI Response:", {
      status: openAIResponse.status,
      statusText: openAIResponse.statusText,
      contentType: openAIResponse.headers.get("content-type")
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("[Error] OpenAI API error response:", errorText);
      
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API error",
          details: errorText.substring(0, 200)
        }),
        { 
          status: openAIResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const contentType = openAIResponse.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error("[Error] Invalid content type from OpenAI:", contentType);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from OpenAI API",
          details: `Expected JSON but got ${contentType}` 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await openAIResponse.json();
    const extractedText = data.choices[0].message.content;
    
    try {
      const courses = JSON.parse(extractedText);
      console.log("[Debug] Parsed courses:", courses);
      
      if (!Array.isArray(courses)) {
        throw new Error("OpenAI response is not a valid array");
      }

      const validatedCourses = courses.filter(course => {
        const isValid = 
          course.code && 
          course.code.match(/^[A-Z]{2,4}\d{3,4}$/) &&
          course.name &&
          course.name.length >= 3 &&
          typeof course.classSize === 'number' &&
          course.classSize > 0 &&
          course.classSize < 1000;
          
        if (!isValid) {
          console.log("[Debug] Invalid course:", course);
        }
        return isValid;
      });

      const processedCourses = validatedCourses.map(course => ({
        ...course,
        needsReview: course.confidence < 0.8 || 
                    course.name.length < 5 ||
                    !course.lecturer
      }));

      return new Response(JSON.stringify({ 
        courses: processedCourses,
        totalExtracted: courses.length,
        validCount: processedCourses.length,
        requiresReview: processedCourses.filter(c => c.needsReview).length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error("[Error] Failed to parse course data:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse course data",
          details: error.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error("[Error] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred",
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
