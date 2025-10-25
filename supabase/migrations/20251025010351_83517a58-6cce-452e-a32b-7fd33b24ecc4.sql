-- Create radiology_reports table for storing X-ray analysis results
CREATE TABLE public.radiology_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  image_url TEXT NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  impression TEXT,
  recommendations TEXT[],
  ai_confidence TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'approved', 'notified')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.radiology_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (hackathon demo - no auth required)
CREATE POLICY "Allow all access to radiology_reports" 
ON public.radiology_reports 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_radiology_reports_updated_at
BEFORE UPDATE ON public.radiology_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();