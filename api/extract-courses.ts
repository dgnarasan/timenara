
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    
    if (!pdfFile) {
      throw new Error("No PDF file provided");
    }

    // Log file details for debugging
    console.log("Processing PDF:", {
      name: pdfFile.name,
      type: pdfFile.type,
      size: pdfFile.size
    });

    const pdfContent = await pdfFile.text();
    
    // Validate PDF content
    if (!pdfContent || pdfContent.trim().length === 0) {
      throw new Error("PDF content is empty");
    }

    // Log first 100 characters of content for debugging
    console.log("PDF content preview:", pdfContent.substring(0, 100));

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
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

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI API error response:", errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`OpenAI API error: ${errorJson.error?.message || 'Unknown error'}`);
      } catch (e) {
        throw new Error(`OpenAI API error: ${errorText.substring(0, 200)}`);
      }
    }

    const contentType = openAIResponse.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error("OpenAI API returned invalid content type");
    }

    const data = await openAIResponse.json();
    const extractedText = data.choices[0].message.content;
    
    try {
      const courses = JSON.parse(extractedText);
      
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
      console.error("Failed to parse extracted course data:", error);
      throw new Error(`Failed to parse course data: ${error.message}`);
    }
  } catch (error) {
    console.error("Error processing PDF:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestion: "Please verify the PDF content and try again, or enter courses manually."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
