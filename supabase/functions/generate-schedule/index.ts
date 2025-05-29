import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const apiKey = Deno.env.get('OPENAI_API_KEY');

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
  // Updated to allow 8 AM to 5 PM range with 1-2 hour durations only
  return start >= 8 && end <= 17 && end > start && (end - start) <= 2 && (end - start) >= 1;
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

  // Check for classes longer than 2 hours
  for (const item of schedule) {
    const startHour = parseInt(item.timeSlot.startTime.split(':')[0]);
    const endHour = parseInt(item.timeSlot.endTime.split(':')[0]);
    const duration = endHour - startHour;
    
    if (startHour < 8 || endHour > 17) {
      conflicts.push({
        reason: `Course ${item.code} is scheduled outside business hours (${item.timeSlot.startTime} - ${item.timeSlot.endTime})`,
        courseId: item.id
      });
    }
    
    if (duration > 2) {
      conflicts.push({
        reason: `Course ${item.code} has invalid duration (${duration} hours). Maximum allowed is 2 hours.`,
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

    const systemPrompt = `You are an advanced scheduling system that generates optimal course schedules with flexible time slots.
Generate a timetable that assigns courses to time slots following these rules:
1. Classes can ONLY be 1 or 2 hours long (NO 3-hour classes allowed)
2. Time slots must be between 8:00 and 17:00 (8 AM to 5 PM), Monday to Friday only
3. No lecturer should teach multiple classes at the same time
4. Classes should be distributed evenly throughout the week
5. Use flexible time slots like: 8:00-9:00, 9:00-10:00, 10:00-11:00, 11:00-12:00, 12:00-13:00, 13:00-14:00, 14:00-15:00, 15:00-16:00, 16:00-17:00 (1-hour slots) and 8:00-10:00, 9:00-11:00, 10:00-12:00, 11:00-13:00, 12:00-14:00, 13:00-15:00, 14:00-16:00, 15:00-17:00 (2-hour slots)
6. Optimize for variety in class durations (1-2 hours only) and start times while avoiding conflicts

Return the schedule as a JSON array where each item contains:
- id (from input)
- code (from input)  
- name (from input)
- lecturer (from input)
- classSize (from input)
- timeSlot: { 
    day: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday", 
    startTime: "HH:00" format,
    endTime: "HH:00" format (can be 1 or 2 hours after startTime, NEVER 3 hours)
  }

Make sure each course gets scheduled and no lecturer has conflicting time slots.
Distribute different class durations (1-2 hours only) across the week for variety.
Return ONLY the JSON array, no markdown formatting.`;

    const userPrompt = `Generate a complete weekly schedule for ALL ${courses.length} courses with 1-2 hour durations only:
${JSON.stringify(courses, null, 2)}

Requirements:
- Schedule ALL courses provided
- Use ONLY 1-2 hour time slots (NO 3-hour classes)
- No lecturer conflicts
- Distribute evenly across Monday-Friday
- Use business hours 8:00-17:00 only
- Vary class durations between 1-2 hours for optimal scheduling
- Example valid time slots: 8:00-9:00, 9:00-10:00, 10:00-11:00, 8:00-10:00, 9:00-11:00, 10:00-12:00, etc.`;

    console.log('Sending request to flexible scheduling service (1-2 hour classes only)...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
    console.log('Flexible scheduling service response received (1-2 hour classes), tokens used:', rawResponse.usage?.total_tokens);

    if (!rawResponse.choices || !rawResponse.choices[0]?.message?.content) {
      console.error('Invalid service response structure:', rawResponse);
      throw new Error('Invalid response structure from scheduling service');
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
      console.log('Parsed flexible schedule items:', parsedContent.length);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Content:', jsonString.substring(0, 500));
      throw new Error('Failed to parse schedule from service response');
    }

    if (!Array.isArray(parsedContent)) {
      throw new Error('Service response is not an array');
    }

    const validScheduleItems = parsedContent.filter(isValidScheduleItem);
    console.log('Valid flexible schedule items:', validScheduleItems.length, 'out of', parsedContent.length);

    if (validScheduleItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          schedule: [],
          conflicts: [{ reason: 'No valid schedule items found in service response' }]
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

    console.log('Generated valid flexible schedule (1-2 hour classes) with', scheduleWithVenues.length, 'items');

    return new Response(
      JSON.stringify({
        success: true,
        schedule: scheduleWithVenues,
        conflicts: conflicts.length > 0 ? conflicts.slice(0, 3) : []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in flexible schedule generation function (1-2 hour classes):', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        schedule: [],
        conflicts: [{ reason: error instanceof Error ? error.message : 'Failed to generate flexible schedule with 1-2 hour classes' }]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
