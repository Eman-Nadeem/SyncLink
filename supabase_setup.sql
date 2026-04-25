

-- ==========================================
-- PHASE 1: DATABASE ARCHITECTURE UPGRADE
-- ==========================================

-- 1. First, safely rename the old 'assignments' table to 'submissions' if it exists.
-- (We must do this before creating the NEW assignments table)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assignments') THEN
    -- If it has student_email, it's the old submissions table, let's rename it
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='assignments' AND column_name='student_email') THEN
      ALTER TABLE assignments RENAME TO submissions;
    END IF;
  END IF;
END $$;

-- 2. Create Teacher's Assignments Table (Tasks given to students)
CREATE TABLE IF NOT EXISTS assignments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  deadline timestamp with time zone,
  total_marks integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create/Update Submissions Table (Files uploaded by students)
CREATE TABLE IF NOT EXISTS submissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE, -- Link to teacher's assignment
  student_name text NOT NULL,
  student_email text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size text NOT NULL,
  status text DEFAULT 'submitted', -- Options: 'submitted', 'graded', 'late'
  grade numeric, -- Teacher's marks
  feedback text, -- Teacher's comments
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Add missing columns to 'submissions' if it was renamed from the old table
DO $$
BEGIN
  BEGIN
    ALTER TABLE submissions ADD COLUMN assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE submissions ADD COLUMN grade numeric;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE submissions ADD COLUMN feedback text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE submissions RENAME COLUMN created_at TO submitted_at;
  EXCEPTION WHEN undefined_column THEN END;
END $$;

-- ==========================================
-- SECURITY & POLICIES (RLS)
-- ==========================================

GRANT ALL ON TABLE assignments TO anon, authenticated;
GRANT ALL ON TABLE submissions TO anon, authenticated;

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (Easy Development)
DROP POLICY IF EXISTS "Allow all inserts on assignments" ON assignments;
CREATE POLICY "Allow all inserts on assignments" ON assignments FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all selects on assignments" ON assignments;
CREATE POLICY "Allow all selects on assignments" ON assignments FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow all inserts on submissions" ON submissions;
CREATE POLICY "Allow all inserts on submissions" ON submissions FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all selects on submissions" ON submissions;
CREATE POLICY "Allow all selects on submissions" ON submissions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow all updates on submissions" ON submissions;
CREATE POLICY "Allow all updates on submissions" ON submissions FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ==========================================
-- STORAGE BUCKET
-- ==========================================
insert into storage.buckets (id, name, public)
values ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'assignments');


-- ==========================================
-- ✅ REALTIME ENABLE (ZAROORI HAI!)
-- Yeh commands Supabase Realtime ko ON karte hain
-- Bina iske postgres_changes events kaam nahi karte
-- ==========================================

-- Pehle check karo kya supabase_realtime publication exist karti hai
DO $$
BEGIN
  -- assignments table ko realtime publication mein add karo
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
  END IF;

  -- submissions table ko realtime publication mein add karo
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
  END IF;
END $$;

