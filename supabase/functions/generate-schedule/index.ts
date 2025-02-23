
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Course {
  code: string;
  name: string;
  lecturer: string;
  classSize: number;
  preferredSlots?: TimeSlot[];
}

interface Venue {
  name: string;
  capacity: number;
  availability?: TimeSlot[];
}

interface TimeSlot {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string;
  endTime: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Get courses and venues from request
    const { courses, venues } = await req.json();

    // Create the prompt for OpenAI
    const systemPrompt = `You are a scheduling assistant that generates optimal course timetables. 
    Follow these constraints strictly:
    1. No lecturer can teach multiple classes at the same time
    2. Each venue can only host one class at a time
    3. Class sizes must not exceed venue capacity
    4. Classes should be spread across the week (avoid clustering)
    5. Honor preferred time slots when possible
    6. Time slots are from 9:00 to 17:00, Monday to Friday
    7. Each class is 1 hour long

    Return ONLY a JSON array of scheduled courses with this exact structure:
    [{
      "code": "string",
      "name": "string",
      "lecturer": "string",
      "classSize": number,
      "venue": { "name": "string", "capacity": number },
      "timeSlot": {
        "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
        "startTime": "string (HH:00)",
        "endTime": "string (HH:00)"
      }
    }]`;

    const userPrompt = `Generate an optimal timetable for these courses and venues:

    Courses:
    ${JSON.stringify(courses, null, 2)}

    Available Venues:
    ${JSON.stringify(venues, null, 2)}

    Remember to strictly follow all constraints and return only the JSON array as specified.`;

    // Make the OpenAI API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    let schedule;
    
    try {
      const content = data.choices[0].message.content;
      schedule = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Invalid schedule format received from OpenAI');
    }

    // Validate the schedule
    const validationErrors = validateSchedule(schedule.schedule, courses, venues);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          errors: validationErrors 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 422 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        schedule: schedule.schedule 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function validateSchedule(schedule: any[], courses: Course[], venues: Venue[]) {
  const errors = [];
  const timeSlotMap = new Map(); // Track used time slots
  const lecturerMap = new Map(); // Track lecturer assignments

  for (const slot of schedule) {
    // Check if course exists
    const course = courses.find(c => c.code === slot.code);
    if (!course) {
      errors.push(`Course ${slot.code} not found in original courses`);
      continue;
    }

    // Check venue capacity
    if (slot.classSize > slot.venue.capacity) {
      errors.push(`Venue ${slot.venue.name} capacity (${slot.venue.capacity}) exceeded for course ${slot.code} (${slot.classSize} students)`);
    }

    // Check time slot conflicts
    const timeKey = `${slot.timeSlot.day}-${slot.timeSlot.startTime}`;
    const venueKey = `${timeKey}-${slot.venue.name}`;
    const lecturerKey = `${timeKey}-${slot.lecturer}`;

    if (timeSlotMap.has(venueKey)) {
      errors.push(`Venue ${slot.venue.name} double-booked at ${timeKey}`);
    }
    if (lecturerMap.has(lecturerKey)) {
      errors.push(`Lecturer ${slot.lecturer} double-booked at ${timeKey}`);
    }

    timeSlotMap.set(venueKey, true);
    lecturerMap.set(lecturerKey, true);
  }

  return errors;
}
