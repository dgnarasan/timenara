
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

interface Venue {
  id: string;
  name: string;
  capacity: number;
}

interface ScheduleItem {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  classSize: number;
  department?: string;
  timeSlot: TimeSlot;
  venue?: Venue;
}

function isValidTimeSlot(startTime: string, endTime: string): boolean {
  const start = parseInt(startTime.split(':')[0]);
  const end = parseInt(endTime.split(':')[0]);
  return start >= 9 && end <= 17 && end > start;
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

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false;

  const start1 = parseTimeToMinutes(slot1.startTime);
  const end1 = parseTimeToMinutes(slot1.endTime);
  const start2 = parseTimeToMinutes(slot2.startTime);
  const end2 = parseTimeToMinutes(slot2.endTime);

  return (start1 < end2) && (start2 < end1);
}

function validateSchedule(schedule: ScheduleItem[]): { reason: string; courseId?: string }[] {
  const conflicts: { reason: string; courseId?: string }[] = [];
  
  const lecturerSchedules = new Map<string, ScheduleItem[]>();
  
  for (const item of schedule) {
    if (!lecturerSchedules.has(item.lecturer)) {
      lecturerSchedules.set(item.lecturer, []);
    }
    lecturerSchedules.get(item.lecturer)!.push(item);
  }

  for (const [lecturer, items] of lecturerSchedules.entries()) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (doTimeSlotsOverlap(items[i].timeSlot, items[j].timeSlot)) {
          conflicts.push({
            reason: `Lecturer ${lecturer} has overlapping classes: ${items[i].code} and ${items[j].code} on ${items[i].timeSlot.day}`,
            courseId: items[j].id
          });
        }
      }
    }
  }

  for (const item of schedule) {
    const startHour = parseInt(item.timeSlot.startTime.split(':')[0]);
    const endHour = parseInt(item.timeSlot.endTime.split(':')[0]);
    
    if (startHour < 9 || endHour > 17) {
      conflicts.push({
        reason: `Course ${item.code} is scheduled outside business hours (${item.timeSlot.startTime} - ${item.timeSlot.endTime})`,
        courseId: item.id
      });
    }
  }

  return conflicts;
}

function addVenuesFromDatabase(schedule: ScheduleItem[], venues: Venue[]): ScheduleItem[] {
  return schedule.map((item, index) => {
    // Find suitable venue based on class size
    let selectedVenue = venues.find(v => v.capacity >= item.classSize) || venues[venues.length - 1];

    // Add some rotation to distribute venues if multiple suitable ones exist
    const suitableVenues = venues.filter(v => v.capacity >= item.classSize);
    if (suitableVenues.length > 1) {
      const venueIndex = index % suitableVenues.length;
      selectedVenue = suitableVenues[venueIndex];
    }

    return {
      ...item,
      venue: selectedVenue
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courses, venues } = await req.json();

    console.log('Input courses:', courses.length);
    console.log('Available venues:', venues.length);

    if (!venues || venues.length === 0) {
      throw new Error('No venues provided for scheduling');
    }

    const systemPrompt = `You are an AI assistant that generates optimal course schedules.
Generate a timetable that assigns courses to time slots following these rules:
1. Classes can be 1-3 hours long
2. Time slots are between 9:00 and 17:00, Monday to Friday only
3. No lecturer should teach multiple classes at the same time
4. Classes should be distributed evenly throughout the week
5. Use appropriate time slots like: 9:00-10:00, 10:00-12:00, 13:00-15:00, 15:00-17:00, etc.

Return the schedule as a JSON array where each item contains:
- id (from input)
- code (from input)  
- name (from input)
- lecturer (from input)
- classSize (from input)
- timeSlot: { 
    day: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday", 
    startTime: "HH:00" format,
    endTime: "HH:00" format
  }

Make sure each course gets scheduled and no lecturer has conflicting time slots.
Return ONLY the JSON array, no markdown formatting.`;

    const userPrompt = `Generate a complete weekly schedule for ALL ${courses.length} courses:
${JSON.stringify(courses, null, 2)}

Requirements:
- Schedule ALL courses provided
- No lecturer conflicts
- Distribute evenly across Monday-Friday
- Use business hours 9:00-17:00`;

    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    const rawResponse = await response.json();
    console.log('OpenAI response received, tokens used:', rawResponse.usage?.total_tokens);

    if (!rawResponse.choices || !rawResponse.choices[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', rawResponse);
      throw new Error('Invalid response structure from OpenAI');
    }

    const content = rawResponse.choices[0].message.content.trim();
    console.log('Content length:', content.length);
    
    let jsonString = content;
    const markdownMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (markdownMatch) {
      jsonString = markdownMatch[1].trim();
    }

    let parsedContent: any;
    try {
      parsedContent = JSON.parse(jsonString);
      console.log('Parsed schedule items:', parsedContent.length);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Content:', jsonString.substring(0, 500));
      throw new Error('Failed to parse schedule from OpenAI response');
    }

    if (!Array.isArray(parsedContent)) {
      throw new Error('OpenAI response is not an array');
    }

    const validScheduleItems = parsedContent.filter(isValidScheduleItem);
    console.log('Valid schedule items:', validScheduleItems.length, 'out of', parsedContent.length);

    if (validScheduleItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          schedule: [],
          conflicts: [{ reason: 'No valid schedule items found in OpenAI response' }]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const conflicts = validateSchedule(validScheduleItems);
    console.log('Conflicts found:', conflicts.length);

    const seriousConflicts = conflicts.filter(c => 
      c.reason.includes('overlapping classes') || 
      c.reason.includes('outside business hours')
    );

    if (seriousConflicts.length > 5) {
      console.log('Too many serious conflicts:', seriousConflicts);
      return new Response(
        JSON.stringify({
          success: false,
          schedule: [],
          conflicts: seriousConflicts.slice(0, 5)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scheduleWithVenues = addVenuesFromDatabase(validScheduleItems, venues);

    console.log('Generated valid schedule with', scheduleWithVenues.length, 'items');

    return new Response(
      JSON.stringify({
        success: true,
        schedule: scheduleWithVenues,
        conflicts: conflicts.length > 0 ? conflicts.slice(0, 3) : []
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
