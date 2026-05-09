-- Create slots table
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_capacity INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_plate TEXT,
  vehicle_make_model TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, waiting, in_progress, completed
  donated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read slots
CREATE POLICY "Public Read Slots" ON slots FOR SELECT USING (true);

-- Allow anyone to create bookings
CREATE POLICY "Public Insert Bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Allow authenticated users (admin) to manage everything
CREATE POLICY "Admin Manage Slots" ON slots FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Manage Bookings" ON bookings FOR ALL TO authenticated USING (true);
CREATE POLICY "Public Read Bookings" ON bookings FOR SELECT USING (true);

-- Explicitly grant permissions
GRANT ALL ON TABLE slots TO postgres, authenticated, service_role;
GRANT SELECT ON TABLE slots TO anon;
GRANT ALL ON TABLE bookings TO postgres, authenticated, service_role;
GRANT INSERT, SELECT ON TABLE bookings TO anon;

-- Add Realtime to Bookings and Slots Tables
ALTER PUBLICATION supabase_realtime ADD TABLE bookings, slots;

-- Function to check slot availability and prevent overbooking
CREATE OR REPLACE FUNCTION check_slot_availability()
RETURNS TRIGGER AS $$
DECLARE
  current_count INT;
  max_cap INT;
--  all_slots TEXT;
BEGIN
  -- Lock the slot row to prevent concurrent booking counts from bypassing the check
  SELECT max_capacity INTO max_cap 
  FROM slots 
  WHERE id = NEW.slot_id 
  FOR UPDATE;
  
  IF max_cap IS NULL THEN
    --  SELECT string_agg(id::text, ', ') INTO all_slots FROM slots;
    --    RAISE EXCEPTION 'Slot not found for booking by user % with slot id %. Known slot ids: %', NEW.email, NEW.slot_id, all_slots;
    RAISE EXCEPTION 'Slot not found for booking by user % with slot id %', NEW.email, NEW.slot_id;
  END IF;

  -- Count existing bookings for this slot
  SELECT COUNT(*) INTO current_count 
  FROM bookings 
  WHERE slot_id = NEW.slot_id;
  
  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'This time slot is already full. Please select another slot.' USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to enforce availability check before each booking
DROP TRIGGER IF EXISTS tr_check_slot_availability ON bookings;
CREATE TRIGGER tr_check_slot_availability
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_slot_availability();