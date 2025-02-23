
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Course {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  classSize: number;
  preferredSlots?: TimeSlot[];
  constraints?: string[];
}

interface Venue {
  name: string;
  capacity: number;
}

interface TimeSlot {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string;
  endTime: string;
}

interface ScheduleItem extends Course {
  venue: Venue;
  timeSlot: TimeSlot;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courses, venues } = await req.json();

    // Format the prompt for OpenAI
    const systemPrompt = `You are an AI assistant that generates optimal course schedules. 
    Your task is to create a weekly timetable following these constraints:
    1. No lecturer can teach multiple classes at the same time
    2. No venue can host multiple classes at the same time
    3. Venue capacity must be sufficient for class size
    4. Classes should be distributed evenly across the week
    5. Time slots are from 9:00 to 17:00, Monday to Friday
    6. Honor preferred time slots when specified
    7. Each class is 1 hour long

    Return ONLY a JSON array of scheduled courses with no additional text.
    Each scheduled course should include: code, name, lecturer, classSize, venue, and timeSlot (day and startTime).`;

    const userPrompt = `Generate a schedule for these courses and venues:
    
    Courses:
    ${JSON.stringify(courses, null, 2)}
    
    Available Venues:
    ${JSON.stringify(venues, null, 2)}
    
    Response should be a valid JSON array of scheduled courses.`;

    console.log('Sending request to OpenAI...');
    
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
        temperature: 0.2, // Lower temperature for more consistent results
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    // Parse the schedule from OpenAI's response
    let schedule: ScheduleItem[];
    try {
      schedule = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Failed to parse schedule from OpenAI response');
    }

    // Validate the schedule
    const conflicts = validateSchedule(schedule);
    
    return new Response(
      JSON.stringify({
        success: conflicts.length === 0,
        schedule: schedule,
        conflicts: conflicts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating schedule:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        schedule: [],
        conflicts: [{ reason: error.message }]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function validateSchedule(schedule: ScheduleItem[]): { reason: string }[] {
  const conflicts: { reason: string }[] = [];
  const timeSlotMap = new Map<string, { lecturer: string; venue: string }>();

  for (const item of schedule) {
    const timeKey = `${item.timeSlot.day}-${item.timeSlot.startTime}`;
    const existing = timeSlotMap.get(timeKey);

    if (existing) {
      if (existing.lecturer === item.lecturer) {
        conflicts.push({
          reason: `Lecturer ${item.lecturer} is scheduled for multiple classes at ${timeKey}`
        });
      }
      if (existing.venue === item.venue.name) {
        conflicts.push({
          reason: `Venue ${item.venue.name} is double-booked at ${timeKey}`
        });
      }
    }

    timeSlotMap.set(timeKey, {
      lecturer: item.lecturer,
      venue: item.venue.name
    });

    // Check venue capacity
    if (item.classSize > item.venue.capacity) {
      conflicts.push({
        reason: `Venue ${item.venue.name} capacity (${item.venue.capacity}) is too small for ${item.code} class size (${item.classSize})`
      });
    }
  }

  return conflicts;
}
