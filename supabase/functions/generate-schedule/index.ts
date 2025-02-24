
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
}

interface TimeSlot {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string;
}

interface ScheduleItem extends Course {
  timeSlot: TimeSlot;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courses } = await req.json();

    console.log('Received courses:', JSON.stringify(courses, null, 2));

    const systemPrompt = `You are an AI assistant that generates optimal course schedules.
Generate a timetable that assigns courses to time slots following these rules:
1. No lecturer should teach multiple classes at the same time
2. Classes should be distributed evenly throughout the week
3. Time slots are from 9:00 to 17:00, Monday to Friday
4. Each class is 1 hour long
5. Consider class sizes when distributing - try to avoid scheduling multiple large classes in the same time slot

Return ONLY a JSON array where each item contains:
- courseId (from input)
- code (from input)
- name (from input)
- lecturer (from input)
- classSize (from input)
- timeSlot: { day: string, startTime: string }

The response must be valid JSON with no additional text.`;

    const userPrompt = `Generate an optimized weekly schedule for these courses:
${JSON.stringify(courses, null, 2)}

The schedule should maximize teaching efficiency and student comfort by distributing courses evenly across the week.`;

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
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    let schedule: ScheduleItem[];
    try {
      schedule = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Failed to parse schedule from OpenAI response');
    }

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
  const timeSlotMap = new Map<string, { lecturer: string, totalClassSize: number }>();

  for (const item of schedule) {
    const timeKey = `${item.timeSlot.day}-${item.timeSlot.startTime}`;
    const existing = timeSlotMap.get(timeKey);

    if (existing) {
      if (existing.lecturer === item.lecturer) {
        conflicts.push({
          reason: `Lecturer ${item.lecturer} is scheduled for multiple classes at ${timeKey}`
        });
      }

      // Check if too many large classes are scheduled at the same time
      const totalClassSize = existing.totalClassSize + item.classSize;
      if (totalClassSize > 300) { // Arbitrary threshold for demonstration
        conflicts.push({
          reason: `Too many large classes scheduled at ${timeKey} (total students: ${totalClassSize})`
        });
      }
    }

    timeSlotMap.set(timeKey, {
      lecturer: item.lecturer,
      totalClassSize: (existing?.totalClassSize || 0) + item.classSize
    });
  }

  return conflicts;
}
