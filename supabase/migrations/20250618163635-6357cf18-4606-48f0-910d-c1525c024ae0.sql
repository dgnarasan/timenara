
-- Increase the length limit for course_code column to accommodate longer course codes
ALTER TABLE public.exam_courses 
ALTER COLUMN course_code TYPE VARCHAR(50);
