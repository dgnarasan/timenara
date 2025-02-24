
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimeSlot {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string;
  endTime: string;
}

interface ScheduleItem {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  classSize: number;
  timeSlot: TimeSlot;
}

function isValidTimeSlot(startTime: string, endTime: string): boolean {
  const start = parseInt(startTime.split(':')[0]);
  const end = parseInt(endTime.split(':')[0]);
  return start >= 9 && end <= 17 && end - start === 2;
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
    typeof item.timeSlot.endTime === 'string' &&
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(item.timeSlot.day) &&
    isValidTimeSlot(item.timeSlot.startTime, item.timeSlot.endTime)
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
4. Each class is EXACTLY 2 hours long
5. Consider class sizes when distributing - try to avoid scheduling multiple large classes in the same time slot

Return the schedule as a JSON array where each item contains:
- id (from input)
- code (from input)
- name (from input)
- lecturer (from input)
- classSize (from input)
- timeSlot: { 
    day: string, 
    startTime: string (HH:00 format),
    endTime: string (HH:00 format, must be startTime + 2 hours)
  }

IMPORTANT: Return ONLY the JSON array, no markdown formatting or additional text.`;

    const userPrompt = `Generate an optimized weekly schedule for these courses:
${JSON.stringify(courses, null, 2)}

Requirements:
- Every course must be exactly 2 hours long
- No lecturer can teach multiple courses at the same time
- Distribute courses evenly across Monday to Friday
- Only use time slots between 9 AM and 5 PM`;

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

    const content = rawResponse.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    
    let jsonString = content;
    // Handle markdown code blocks if present
    const markdownMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (markdownMatch) {
      jsonString = markdownMatch[1].trim();
    }
    
    console.log('Extracted JSON string:', jsonString);

    let parsedContent: any;
    try {
      parsedContent = JSON.parse(jsonString);
      console.log('Parsed content:', JSON.stringify(parsedContent, null, 2));
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      throw new Error('Failed to parse schedule from OpenAI response');
    }

    if (!Array.isArray(parsedContent)) {
      throw new Error('OpenAI response is not an array');
    }

    // Validate all schedule items
    const validScheduleItems = parsedContent.filter(isValidScheduleItem);
    if (validScheduleItems.length === 0) {
      throw new Error('No valid schedule items found in OpenAI response');
    }

    // Check for scheduling conflicts
    const conflicts = validateSchedule(validScheduleItems);
    if (conflicts.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          schedule: [],
          conflicts
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        schedule: validScheduleItems,
        conflicts: []
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
  const timeSlotMap = new Map<string, Set<string>>();
  const lecturerMap = new Map<string, Set<string>>();

  for (const item of schedule) {
    const { timeSlot, lecturer } = item;
    const timeKey = `${timeSlot.day}-${timeSlot.startTime}-${timeSlot.endTime}`;

    // Check if the slot is already taken
    if (!timeSlotMap.has(timeKey)) {
      timeSlotMap.set(timeKey, new Set());
    }
    timeSlotMap.get(timeKey)!.add(lecturer);

    // Check lecturer availability
    if (!lecturerMap.has(lecturer)) {
      lecturerMap.set(lecturer, new Set());
    }
    lecturerMap.get(lecturer)!.add(timeKey);

    // Validate time slot duration
    const startHour = parseInt(timeSlot.startTime.split(':')[0]);
    const endHour = parseInt(timeSlot.endTime.split(':')[0]);
    if (endHour - startHour !== 2) {
      conflicts.push({
        reason: `Course ${item.code} duration is not exactly 2 hours (${timeSlot.startTime} - ${timeSlot.endTime})`
      });
    }

    // Check for lecturer conflicts
    const lecturerSlots = lecturerMap.get(lecturer)!;
    lecturerSlots.forEach(slot => {
      if (slot !== timeKey && doTimeSlotsOverlap(timeKey, slot)) {
        conflicts.push({
          reason: `Lecturer ${lecturer} has overlapping classes at ${timeSlot.day} ${timeSlot.startTime}-${timeSlot.endTime}`
        });
      }
    });
  }

  return conflicts;
}

function doTimeSlotsOverlap(slot1: string, slot2: string): boolean {
  const [day1, start1, end1] = slot1.split('-');
  const [day2, start2, end2] = slot2.split('-');

  if (day1 !== day2) return false;

  const start1Hour = parseInt(start1.split(':')[0]);
  const end1Hour = parseInt(end1.split(':')[0]);
  const start2Hour = parseInt(start2.split(':')[0]);
  const end2Hour = parseInt(end2.split(':')[0]);

  return (
    (start1Hour >= start2Hour && start1Hour < end2Hour) ||
    (start2Hour >= start1Hour && start2Hour < end1Hour)
  );
}
