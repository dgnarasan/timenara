
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

function isValidScheduleItem(item: any): item is ScheduleItem {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.code === 'string' &&
    typeof item.name === 'string' &&
    typeof item.lecturer === 'string' &&
    typeof item.classSize === 'number' &&
    item.timeSlot &&
    typeof item.timeSlot.day === 'string' &&
    typeof item.timeSlot.startTime === 'string' &&
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(item.timeSlot.day)
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courses } = await req.json();

    console.log('Input courses:', JSON.stringify(courses, null, 2));

    const systemPrompt = `You are an AI assistant that generates optimal course schedules.
Generate a timetable that assigns courses to time slots following these rules:
1. No lecturer should teach multiple classes at the same time
2. Classes should be distributed evenly throughout the week
3. Time slots are from 9:00 to 17:00, Monday to Friday
4. Each class is 1 hour long
5. Consider class sizes when distributing - try to avoid scheduling multiple large classes in the same time slot

Return ONLY a JSON array where each item contains:
- id (from input)
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

    const rawResponse = await response.json();
    console.log('Raw OpenAI response:', JSON.stringify(rawResponse, null, 2));

    if (!rawResponse.choices || !rawResponse.choices[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', rawResponse);
      throw new Error('Invalid response structure from OpenAI');
    }

    let parsedContent: any;
    try {
      parsedContent = JSON.parse(rawResponse.choices[0].message.content);
      console.log('Parsed content:', JSON.stringify(parsedContent, null, 2));
    } catch (parseError) {
      console.error('Failed to parse OpenAI response content:', rawResponse.choices[0].message.content);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse schedule from OpenAI response');
    }

    if (!Array.isArray(parsedContent)) {
      console.error('Parsed content is not an array:', typeof parsedContent);
      throw new Error('OpenAI response is not an array');
    }

    // Filter out invalid items and log them
    const validScheduleItems = parsedContent.filter((item) => {
      const isValid = isValidScheduleItem(item);
      if (!isValid) {
        console.log('Invalid schedule item:', item);
      }
      return isValid;
    });

    console.log('Valid schedule items:', JSON.stringify(validScheduleItems, null, 2));

    if (validScheduleItems.length === 0) {
      throw new Error('No valid schedule items found in OpenAI response');
    }

    const conflicts = validateSchedule(validScheduleItems);
    console.log('Schedule conflicts:', conflicts);
    
    return new Response(
      JSON.stringify({
        success: conflicts.length === 0,
        schedule: validScheduleItems,
        conflicts: conflicts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-schedule function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        schedule: [],
        conflicts: [{ reason: error instanceof Error ? error.message : 'Failed to generate schedule' }]
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
      if (totalClassSize > 300) {
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
