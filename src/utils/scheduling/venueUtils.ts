
import { Course, Venue } from "@/lib/types";

export const suggestClassSplitting = (
  course: Course,
  venues: Venue[]
): { groups: number; suggestedSize: number; venue: Venue } | null => {
  const largestVenue = venues.reduce((max, venue) => 
    venue.capacity > max.capacity ? venue : max
  );

  if (course.classSize > largestVenue.capacity) {
    const groups = Math.ceil(course.classSize / largestVenue.capacity);
    const suggestedSize = Math.ceil(course.classSize / groups);
    return {
      groups,
      suggestedSize,
      venue: largestVenue
    };
  }

  return null;
};

export const findAlternativeVenue = (
  requiredCapacity: number,
  venues: Venue[]
): Venue | null => {
  // Sort venues by capacity
  const sortedVenues = [...venues].sort((a, b) => b.capacity - a.capacity);
  
  // Find the venue with closest capacity to required
  return sortedVenues.find(venue => venue.capacity >= requiredCapacity * 0.8) || null;
};

export const getDefaultVenues = (): Venue[] => [
  {
    id: "v1",
    name: "Room 101",
    capacity: 30,
    availability: [],
  },
  {
    id: "v2",
    name: "Room 102",
    capacity: 50,
    availability: [],
  },
  {
    id: "v3",
    name: "Lecture Hall 1",
    capacity: 100,
    availability: [],
  },
];
