-- ==========================================
-- NOTIFICATIONS TABLE SETUP
-- ==========================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL, -- The user who should receive this notification
  message text NOT NULL,
  type text NOT NULL, -- e.g., 'assignment', 'message', 'reply', 'grade'
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Security and Policies
GRANT ALL ON TABLE notifications TO anon, authenticated;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all inserts on notifications" ON notifications;
CREATE POLICY "Allow all inserts on notifications" ON notifications FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all selects on notifications" ON notifications;
CREATE POLICY "Allow all selects on notifications" ON notifications FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow all updates on notifications" ON notifications;
CREATE POLICY "Allow all updates on notifications" ON notifications FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all deletes on notifications" ON notifications;
CREATE POLICY "Allow all deletes on notifications" ON notifications FOR DELETE TO public USING (true);

-- 3. Add to Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
