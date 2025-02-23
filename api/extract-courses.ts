
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
            content: `You are a course information extractor specialized in academic course data.
            Analyze the provided text carefully for course information.
            For each course, extract and validate:
            - Course code (must follow standard format, e.g., CS101, MATH201)
            - Course name (full name)
            - Lecturer name (if available)
            - Class size (numeric value or estimate based on context)
            - Prerequisites (if mentioned)
            - Course description (if available)

            Return ONLY a JSON array with this exact structure:
            [
              {
                "code": string,
                "name": string,
                "lecturer": string,
                "classSize": number,
                "academicLevel": null,
                "prerequisites": string[],
                "description": string,
                "confidence": number
              }
            ]
            
            For each field:
            - Set empty string if information is missing
            - Set confidence score (0-1) based on certainty of extraction
            - Validate course codes against common patterns
            - Remove any malformed or incomplete entries`
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
      
      // Validate course data
      const validatedCourses = courses.filter(course => {
        const isValid = 
          course.code && 
          course.code.match(/^[A-Z]{2,4}\d{3,4}$/) && 
          course.name &&
          typeof course.classSize === 'number';
          
        return isValid;
      });

      // Flag courses with low confidence
      const processedCourses = validatedCourses.map(course => ({
        ...course,
        needsReview: course.confidence < 0.8
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
      throw new Error("Failed to parse extracted course data: " + error.message);
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
