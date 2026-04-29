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
  slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
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
