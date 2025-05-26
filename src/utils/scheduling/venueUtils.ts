import { Course, Venue, CALEB_VENUES } from "@/lib/types";

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

export const getCalebVenues = (): Venue[] => [
  // Lecture Halls
  { id: "l101", name: "L101", capacity: 80, availability: [] },
  { id: "l201", name: "L201", capacity: 80, availability: [] },
  { id: "l301", name: "L301", capacity: 80, availability: [] },
  
  // Regular Rooms
  { id: "r101", name: "R101", capacity: 50, availability: [] },
  { id: "r201", name: "R201", capacity: 50, availability: [] },
  { id: "r301", name: "R301", capacity: 50, availability: [] },
  
  // Laboratories
  { id: "bio_lab_1", name: "BIO LAB 1", capacity: 30, availability: [] },
  { id: "bio_lab_2", name: "BIO LAB 2", capacity: 30, availability: [] },
  { id: "chm_lab_1", name: "CHM LAB 1", capacity: 30, availability: [] },
  { id: "chm_lab_2", name: "CHM LAB 2", capacity: 30, availability: [] },
  { id: "lab_pg", name: "LAB PG", capacity: 40, availability: [] },
  { id: "phy_lab", name: "PHY LAB", capacity: 30, availability: [] },
  
  // Auditoriums and Special Venues
  { id: "mass_comm_aud", name: "Mass Comm AUD", capacity: 200, availability: [] },
  { id: "multipurpose_h", name: "Multipurpose H", capacity: 300, availability: [] },
  { id: "univ_aud", name: "UNIV AUD", capacity: 500, availability: [] },
  
  // Other Rooms
  { id: "b029", name: "B029", capacity: 40, availability: [] },
  { id: "bo29", name: "BO29", capacity: 40, availability: [] },
];

export const getDefaultVenues = (): Venue[] => getCalebVenues();

export const assignVenueBasedOnCourseType = (course: Course): string => {
  const courseCode = course.code.toUpperCase();
  
  // Laboratory courses
  if (courseCode.includes('LAB') || courseCode.includes('PRAC')) {
    if (courseCode.startsWith('BIO') || courseCode.includes('MICRO')) return 'BIO LAB 1';
    if (courseCode.startsWith('CHM') || courseCode.includes('CHEM')) return 'CHM LAB 1';
    if (courseCode.startsWith('PHY') || courseCode.includes('PHYS')) return 'PHY LAB';
    return 'LAB PG';
  }
  
  // Large classes
  if (course.classSize > 150) return 'UNIV AUD';
  if (course.classSize > 100) return 'Mass Comm AUD';
  if (course.classSize > 80) return 'Multipurpose H';
  
  // Regular classes
  if (course.classSize > 50) return 'L101';
  return 'R101';
};
