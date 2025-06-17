
-- Create exam courses table
CREATE TABLE public.exam_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code VARCHAR(10) NOT NULL,
  course_title TEXT NOT NULL,
  department VARCHAR(100) NOT NULL,
  college VARCHAR(200) NOT NULL,
  level VARCHAR(10) NOT NULL,
  student_count INTEGER NOT NULL CHECK (student_count > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam schedules table
CREATE TABLE public.exam_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_course_id UUID REFERENCES public.exam_courses(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_name VARCHAR(50) NOT NULL, -- 'Morning', 'Midday', 'Afternoon'
  venue_name VARCHAR(100),
  created_by UUID REFERENCES auth.users,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.exam_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for exam_courses
CREATE POLICY "Anyone can view exam courses" 
  ON public.exam_courses 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert exam courses" 
  ON public.exam_courses 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exam courses" 
  ON public.exam_courses 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exam courses" 
  ON public.exam_courses 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create policies for exam_schedules
CREATE POLICY "Anyone can view published exam schedules" 
  ON public.exam_schedules 
  FOR SELECT 
  USING (published = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exam schedules" 
  ON public.exam_schedules 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exam schedules" 
  ON public.exam_schedules 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exam schedules" 
  ON public.exam_schedules 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create function to clear and insert exam courses
CREATE OR REPLACE FUNCTION public.clear_and_insert_exam_courses(courses_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear existing exam courses
  DELETE FROM public.exam_courses WHERE id IS NOT NULL;
  
  -- Insert new exam courses
  INSERT INTO public.exam_courses (course_code, course_title, department, college, level, student_count)
  SELECT 
    item->>'course_code',
    item->>'course_title',
    item->>'department',
    item->>'college',
    item->>'level',
    (item->>'student_count')::integer
  FROM jsonb_array_elements(courses_data) AS item;
END;
$$;

-- Create function to clear and insert exam schedule
CREATE OR REPLACE FUNCTION public.clear_and_insert_exam_schedule(schedule_data jsonb, should_publish boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear existing exam schedules
  DELETE FROM public.exam_schedules WHERE id IS NOT NULL;
  
  -- Insert new exam schedule items
  INSERT INTO public.exam_schedules (exam_course_id, day, start_time, end_time, session_name, venue_name, created_by, published)
  SELECT 
    (item->>'exam_course_id')::uuid,
    (item->>'day')::date,
    (item->>'start_time')::time,
    (item->>'end_time')::time,
    item->>'session_name',
    item->>'venue_name',
    auth.uid(),
    should_publish
  FROM jsonb_array_elements(schedule_data) AS item;
END;
$$;

-- Create function to publish exam schedule
CREATE OR REPLACE FUNCTION public.publish_exam_schedule(should_publish boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.exam_schedules 
  SET published = should_publish
  WHERE true;
END;
$$;
