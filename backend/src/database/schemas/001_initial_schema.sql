-- Devs Society Portal - Supabase Schema Migration
-- This file contains the complete database schema for migrating from MongoDB to Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('core-member', 'board-member', 'special-member', 'other');
CREATE TYPE admin_role AS ENUM ('super-admin', 'admin');
CREATE TYPE event_type AS ENUM ('college-specific', 'open-to-all');
CREATE TYPE event_category AS ENUM ('workshop', 'seminar', 'hackathon', 'competition', 'meetup', 'other');
CREATE TYPE registration_status AS ENUM ('confirmed', 'waitlisted', 'cancelled');

-- COLLEGES table
CREATE TABLE colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADMINS table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role admin_role NOT NULL DEFAULT 'admin',
    assigned_college_id UUID REFERENCES colleges(id),
    permissions JSONB DEFAULT '[]'::jsonb,
    tenure_start_date TIMESTAMP WITH TIME ZONE,
    tenure_end_date TIMESTAMP WITH TIME ZONE,
    tenure_is_active BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: admin role requires assigned college
    CONSTRAINT admin_college_check CHECK (
        (role = 'super-admin') OR 
        (role = 'admin' AND assigned_college_id IS NOT NULL)
    )
);

-- USERS table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    college VARCHAR(255) NOT NULL,
    college_ref_id UUID REFERENCES colleges(id),
    batch_year VARCHAR(10) NOT NULL,
    role user_role NOT NULL DEFAULT 'other',
    photo_url VARCHAR(500),
    member_id VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EVENTS table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    event_type event_type NOT NULL DEFAULT 'college-specific',
    target_college_id UUID REFERENCES colleges(id),
    max_attendees INTEGER NOT NULL CHECK (max_attendees > 0 AND max_attendees <= 10000),
    category event_category NOT NULL DEFAULT 'other',
    organizer_admin_id UUID NOT NULL REFERENCES admins(id),
    organizer_name VARCHAR(255) NOT NULL,
    organizer_contact VARCHAR(255) NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    prizes JSONB DEFAULT '[]'::jsonb,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: college-specific events require target college
    CONSTRAINT event_college_check CHECK (
        (event_type = 'open-to-all') OR 
        (event_type = 'college-specific' AND target_college_id IS NOT NULL)
    )
);

-- EVENT_REGISTRATIONS table (separate table for better normalization)
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status registration_status DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate registrations
    UNIQUE(event_id, user_id)
);

-- COLLEGE_TENURE_HEADS table (separate table for better normalization)
CREATE TABLE college_tenure_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_colleges_code ON colleges(code);
CREATE INDEX idx_colleges_active ON colleges(is_active);

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_active ON admins(is_active);
CREATE INDEX idx_admins_college ON admins(assigned_college_id);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_member_id ON users(member_id);
CREATE INDEX idx_users_college ON users(college_ref_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_batch ON users(batch_year);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_college ON events(target_college_id);
CREATE INDEX idx_events_organizer ON events(organizer_admin_id);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_deadline ON events(registration_deadline);

CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_registrations_status ON event_registrations(status);

CREATE INDEX idx_tenure_heads_college ON college_tenure_heads(college_id);
CREATE INDEX idx_tenure_heads_admin ON college_tenure_heads(admin_id);
CREATE INDEX idx_tenure_heads_active ON college_tenure_heads(is_active);

-- Create functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_college_tenure_heads_updated_at BEFORE UPDATE ON college_tenure_heads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate member ID (similar to MongoDB pre-save hook)
CREATE OR REPLACE FUNCTION generate_member_id()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER;
    user_count INTEGER;
    new_member_id VARCHAR(50);
BEGIN
    IF NEW.member_id IS NULL OR NEW.member_id = '' THEN
        current_year := EXTRACT(YEAR FROM NOW());
        SELECT COUNT(*) + 1 INTO user_count FROM users;
        new_member_id := 'DEVS-' || current_year || '-' || LPAD(user_count::TEXT, 4, '0');
        NEW.member_id := new_member_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for member ID generation
CREATE TRIGGER generate_member_id_trigger BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION generate_member_id();

-- Row Level Security (RLS) policies can be added here if needed
-- For now, we'll handle authorization in the application layer

-- Insert default super admin (similar to createSuperAdmin script)
-- Note: Password should be hashed before inserting
-- This is just a placeholder - you'll need to hash the password in your application
INSERT INTO admins (
    username, 
    email, 
    password_hash, 
    full_name, 
    role, 
    permissions,
    tenure_start_date
) VALUES (
    'superadmin',
    'admin@devs-society.com',
    '$2b$12$placeholder_hash_replace_with_actual_bcrypt_hash',
    'Super Administrator',
    'super-admin',
    '["users.read","users.write","users.delete","events.read","events.write","events.delete","colleges.read","colleges.write","colleges.delete","admins.read","admins.write","admins.delete","settings.read","settings.write","analytics.read","system.admin"]',
    NOW()
) ON CONFLICT (email) DO NOTHING; 