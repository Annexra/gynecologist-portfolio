-- Supabase Database Schema Seeding for Dr. Raveena Thalluru Portfolio & CMS

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Admin Profiles Table (Authorization)
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Doctor Profile Table
CREATE TABLE IF NOT EXISTS doctor_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Dr. Raveena Thalluru',
    qualifications TEXT NOT NULL DEFAULT 'MBBS, MS (OBGYN)',
    title TEXT NOT NULL DEFAULT 'Obstetrician & Gynaecologist',
    specialties TEXT[] DEFAULT ARRAY['IVF & Fertility Care', 'Women''s Hormonal Health'],
    clinic_name TEXT NOT NULL DEFAULT 'LIVF Fertility',
    subtitle TEXT NOT NULL DEFAULT 'Advanced IVF & Fertility Care',
    locations TEXT[] DEFAULT ARRAY['Perungudi, Chennai', 'T. Nagar, Chennai'],
    photo_url TEXT DEFAULT 'assets/dr_raveena.jpeg',
    tagline TEXT DEFAULT 'Compassionate Care. Advanced Fertility Solutions. Healthier Futures.',
    hero_description TEXT DEFAULT 'Dr. Raveena Thalluru, MBBS, MS (OBGYN), providing specialized, patient-centered care at LIVF Fertility, Perungudi & T. Nagar, Chennai.',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. About Content Table
CREATE TABLE IF NOT EXISTS about_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    heading TEXT NOT NULL DEFAULT 'Meet Dr. Raveena Thalluru',
    paragraph_1 TEXT NOT NULL,
    paragraph_2 TEXT NOT NULL,
    photo_url TEXT DEFAULT 'assets/dr_raveena.jpeg',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Areas of Care Table
CREATE TABLE IF NOT EXISTS care_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'child_care',
    color_class TEXT DEFAULT 'primary',
    display_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Education & Training Table
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    degree TEXT NOT NULL,
    institution TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Current Practice Details Table
CREATE TABLE IF NOT EXISTS practice_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_name TEXT NOT NULL DEFAULT 'LIVF Fertility',
    tagline TEXT NOT NULL DEFAULT 'Advanced IVF & Fertility Care, Women''s Hormone & PCOS Management',
    locations JSONB DEFAULT '[{"name": "Perungudi Clinic", "city": "Chennai"}, {"name": "T. Nagar Clinic", "city": "Chennai"}]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Patient Approach Table
CREATE TABLE IF NOT EXISTS patient_approach (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Contact Details Table
CREATE TABLE IF NOT EXISTS contact_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    heading TEXT NOT NULL DEFAULT 'Begin Your Journey',
    subheading TEXT NOT NULL DEFAULT 'Schedule a consultation at one of our Chennai locations. We are here to support you.',
    phone_numbers TEXT[] DEFAULT ARRAY['7878784079', '6374449659'],
    locations TEXT[] DEFAULT ARRAY['Perungudi', 'T. Nagar'],
    city TEXT DEFAULT 'Chennai, Tamil Nadu',
    address_display TEXT DEFAULT 'Level 4, Specialist Medical Centre',
    email TEXT DEFAULT 'contact@drthalluru.com',
    map_image_url TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ7sUBYZZGU8sNk6XdICTUPoKDWeT6Erbb7M12MD1qT7oTTkX0qfS1paLQy9s_uPaWxsqGY7KNVOA61gT8XsUjUwnRItiGVPLOarn6NldL6pFoNzY87EUPdGvChpks6IZDimOCP_EYB5vyWQoJyHr_YFIlOsCKjNTxMRlK-7pOmt4iioKDhVVmrMLPR3loQvFntt5Af_5vUGakOUK2t_wCa-xxZyT7KTZHLirr0z-p16Lo322bGraF',
    map_link TEXT DEFAULT 'https://maps.google.com/?q=LIVF+Fertility+Perungudi+Chennai',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_approach ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_details ENABLE ROW LEVEL SECURITY;

-- 11. Helper Function: Is User Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. RLS Policies

-- Public Read Policies
CREATE POLICY "Public Read Doctor Profile" ON doctor_profile FOR SELECT USING (true);
CREATE POLICY "Public Read About Content" ON about_content FOR SELECT USING (true);
CREATE POLICY "Public Read Care Areas" ON care_areas FOR SELECT USING (true);
CREATE POLICY "Public Read Education" ON education FOR SELECT USING (true);
CREATE POLICY "Public Read Practice Details" ON practice_details FOR SELECT USING (true);
CREATE POLICY "Public Read Patient Approach" ON patient_approach FOR SELECT USING (true);
CREATE POLICY "Public Read Contact Details" ON contact_details FOR SELECT USING (true);
CREATE POLICY "Public No Read Admin Profiles" ON admin_profiles FOR SELECT USING (auth.role() = 'authenticated' OR auth.uid() = user_id OR public.is_admin());

-- Authenticated Admin Mutation Policies (All Operations tied to Authenticated session)
CREATE POLICY "Authenticated Doctor Profile" ON doctor_profile FOR ALL USING (auth.role() = 'authenticated' OR public.is_admin()) WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY "Authenticated About Content" ON about_content FOR ALL USING (auth.role() = 'authenticated' OR public.is_admin()) WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY "Authenticated Care Areas" ON care_areas FOR ALL USING (auth.role() = 'authenticated' OR public.is_admin()) WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY "Authenticated Education" ON education FOR ALL USING (auth.role() = 'authenticated' OR public.is_admin()) WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY "Authenticated Practice Details" ON practice_details FOR ALL USING (auth.role() = 'authenticated' OR public.is_admin()) WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY "Authenticated Patient Approach" ON patient_approach FOR ALL USING (auth.role() = 'authenticated' OR public.is_admin()) WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY "Authenticated Contact Details" ON contact_details FOR ALL USING (auth.role() = 'authenticated' OR public.is_admin()) WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY "Authenticated Manage Admin Profiles" ON admin_profiles FOR ALL USING (auth.role() = 'authenticated' OR public.is_admin()) WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());

-- 13. Initial Verified Data Seeding
INSERT INTO doctor_profile (name, qualifications, title, specialties, clinic_name, subtitle, locations, photo_url)
VALUES (
  'Dr. Raveena Thalluru',
  'MBBS, MS (OBGYN)',
  'Obstetrician & Gynaecologist',
  ARRAY['IVF & Fertility Care', 'Women''s Hormonal Health'],
  'LIVF Fertility',
  'Advanced IVF & Fertility Care',
  ARRAY['Perungudi, Chennai', 'T. Nagar, Chennai'],
  'assets/dr_raveena.jpeg'
) ON CONFLICT DO NOTHING;

INSERT INTO about_content (heading, paragraph_1, paragraph_2, photo_url)
VALUES (
  'Meet Dr. Raveena Thalluru',
  'Dr. Raveena Thalluru is a dedicated Obstetrician and Gynaecologist with a profound focus on IVF and fertility care. Her practice is built on a foundation of rigorous medical education and a deep-seated commitment to patient-centered, compassionate care.',
  'Understanding the deeply personal journey of fertility and reproductive health, Dr. Thalluru combines advanced clinical expertise with a nurturing approach, ensuring every patient feels heard, supported, and confident in their treatment plan.',
  'assets/dr_raveena.jpeg'
) ON CONFLICT DO NOTHING;

INSERT INTO care_areas (title, short_description, icon, color_class, display_order, is_published) VALUES
('IVF & Fertility Care', 'Advanced reproductive technologies to support your path to parenthood.', 'child_care', 'primary', 1, true),
('Infertility Evaluation', 'Comprehensive diagnostics to identify underlying causes and formulate effective strategies.', 'search', 'secondary', 2, true),
('PCOS Management', 'Holistic approaches to manage symptoms and improve fertility outcomes for PCOS.', 'monitor_heart', 'tertiary', 3, true),
('Women''s Hormonal Health', 'Expert management of hormonal imbalances affecting reproductive health.', 'spa', 'primary', 4, true),
('Preconception Counselling', 'Guidance and health optimization before embarking on a pregnancy.', 'favorite', 'secondary', 5, true),
('Reproductive Health', 'Routine and specialized care for long-term gynecological wellness.', 'vital_signs', 'tertiary', 6, true)
ON CONFLICT DO NOTHING;

INSERT INTO education (degree, institution, display_order, is_published) VALUES
('MBBS', 'Sri Venkateswara Medical College, Tirupati', 1, true),
('MS (OBGYN)', 'Institute of Obstetrics & Gynaecology, Egmore', 2, true)
ON CONFLICT DO NOTHING;

INSERT INTO practice_details (clinic_name, tagline, locations) VALUES
(
  'LIVF Fertility',
  'Advanced IVF & Fertility Care, Women''s Hormone & PCOS Management',
  '[{"name": "Perungudi Clinic", "city": "Chennai"}, {"name": "T. Nagar Clinic", "city": "Chennai"}]'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO patient_approach (step_number, title, description, display_order, is_published) VALUES
('01', 'Personalised Evaluation', 'Thorough and tailored fertility assessments to understand your specific needs.', 1, true),
('02', 'Clear Communication', 'Transparent discussions about diagnoses, options, and expected outcomes.', 2, true),
('03', 'Individualised Planning', 'Custom treatment strategies designed specifically for your body and goals.', 3, true),
('04', 'Compassionate Care', 'A safe, confidential environment providing emotional support throughout your journey.', 4, true)
ON CONFLICT DO NOTHING;

INSERT INTO contact_details (heading, subheading, phone_numbers, locations, city, address_display, email) VALUES
(
  'Begin Your Journey',
  'Schedule a consultation at one of our Chennai locations. We are here to support you.',
  ARRAY['7878784079', '6374449659'],
  ARRAY['Perungudi', 'T. Nagar'],
  'Chennai, Tamil Nadu',
  'Level 4, Specialist Medical Centre',
  'contact@drthalluru.com'
) ON CONFLICT DO NOTHING;
