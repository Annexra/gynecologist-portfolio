-- Migration: 20260830000001_update_dynamic_contact_map.sql
-- Description: Add map_link column if missing, set dynamic map_link default, and update existing contact_details records.

-- 1. Ensure map_link column exists in contact_details table
ALTER TABLE contact_details 
ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT 'https://maps.google.com/maps?q=Level%204%2C%20Specialist%20Medical%20Centre%2C%20Perungudi%2C%20T.%20Nagar%2C%20Chennai%2C%20Tamil%20Nadu&t=&z=15&ie=UTF8&iwloc=&output=embed';

-- 2. Update column default in case column already existed
ALTER TABLE contact_details 
ALTER COLUMN map_link SET DEFAULT 'https://maps.google.com/maps?q=Level%204%2C%20Specialist%20Medical%20Centre%2C%20Perungudi%2C%20T.%20Nagar%2C%20Chennai%2C%20Tamil%20Nadu&t=&z=15&ie=UTF8&iwloc=&output=embed';

-- 3. Update existing records with the dynamic map location query format
UPDATE contact_details
SET map_link = 'https://maps.google.com/maps?q=Level%204%2C%20Specialist%20Medical%20Centre%2C%20Perungudi%2C%20T.%20Nagar%2C%20Chennai%2C%20Tamil%20Nadu&t=&z=15&ie=UTF8&iwloc=&output=embed'
WHERE map_link IS NULL 
   OR map_link LIKE '%LIVF+Fertility%'
   OR map_link LIKE '%Perungudi%';
