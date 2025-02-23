
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
