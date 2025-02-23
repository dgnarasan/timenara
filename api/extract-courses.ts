
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
            ]

            Validation requirements:
            - Course codes must match pattern: [A-Z]{2,4}[0-9]{3,4}
            - Course names must be complete and meaningful
            - Class size must be a reasonable number
            - Remove any incomplete or invalid entries
            - Set confidence score based on data completeness and clarity
            - Handle edge cases (typos, formatting issues) intelligently`
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    try {
      const courses = JSON.parse(extractedText);
      
      // Enhanced validation
      const validatedCourses = courses.filter(course => {
        const isValid = 
          course.code && 
          course.code.match(/^[A-Z]{2,4}\d{3,4}$/) &&
          course.name &&
          course.name.length >= 3 &&
          typeof course.classSize === 'number' &&
          course.classSize > 0 &&
          course.classSize < 1000; // reasonable class size limit
          
        return isValid;
      });

      // Enhanced course processing
      const processedCourses = validatedCourses.map(course => ({
        ...course,
        needsReview: course.confidence < 0.8 || 
                    course.name.length < 5 || // likely incomplete name
                    !course.lecturer // missing lecturer info
      }));

      return new Response(JSON.stringify({ 
        courses: processedCourses,
        totalExtracted: courses.length,
        validCount: processedCourses.length,
        requiresReview: processedCourses.filter(c => c.needsReview).length,
        stats: {
          averageConfidence: processedCourses.reduce((acc, c) => acc + c.confidence, 0) / processedCourses.length,
          completeEntries: processedCourses.filter(c => c.lecturer && c.prerequisites).length
        }
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
