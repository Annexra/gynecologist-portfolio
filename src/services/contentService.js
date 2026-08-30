import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Fallback Initial Verified Content for offline/local development without active Supabase credentials
const INITIAL_DATA = {
  doctor_profile: {
    id: 'default',
    name: 'Dr. Raveena Thalluru',
    qualifications: 'MBBS, MS (OBGYN)',
    title: 'Obstetrician & Gynaecologist',
    specialties: ['IVF & Fertility Care', "Women's Hormonal Health"],
    clinic_name: 'LIVF Fertility',
    subtitle: 'Advanced IVF & Fertility Care',
    locations: ['Perungudi, Chennai', 'T. Nagar, Chennai'],
    photo_url: 'assets/dr_raveena.jpeg',
    tagline: 'Compassionate Care. Advanced Fertility Solutions. Healthier Futures.',
    hero_description: 'Dr. Raveena Thalluru, MBBS, MS (OBGYN), providing specialized, patient-centered care at LIVF Fertility, Perungudi & T. Nagar, Chennai.'
  },
  about_content: {
    id: 'default',
    heading: 'Meet Dr. Raveena Thalluru',
    paragraph_1: 'Dr. Raveena Thalluru is a dedicated Obstetrician and Gynaecologist with a profound focus on IVF and fertility care. Her practice is built on a foundation of rigorous medical education and a deep-seated commitment to patient-centered, compassionate care.',
    paragraph_2: 'Understanding the deeply personal journey of fertility and reproductive health, Dr. Thalluru combines advanced clinical expertise with a nurturing approach, ensuring every patient feels heard, supported, and confident in their treatment plan.',
    photo_url: 'assets/dr_raveena.jpeg'
  },
  care_areas: [
    { id: '1', title: 'IVF & Fertility Care', short_description: 'Advanced reproductive technologies to support your path to parenthood.', icon: 'child_care', color_class: 'primary', display_order: 1, is_published: true },
    { id: '2', title: 'Infertility Evaluation', short_description: 'Comprehensive diagnostics to identify underlying causes and formulate effective strategies.', icon: 'search', color_class: 'secondary', display_order: 2, is_published: true },
    { id: '3', title: 'PCOS Management', short_description: 'Holistic approaches to manage symptoms and improve fertility outcomes for PCOS.', icon: 'monitor_heart', color_class: 'tertiary', display_order: 3, is_published: true },
    { id: '4', title: "Women's Hormonal Health", short_description: 'Expert management of hormonal imbalances affecting reproductive health.', icon: 'spa', color_class: 'primary', display_order: 4, is_published: true },
    { id: '5', title: 'Preconception Counselling', short_description: 'Guidance and health optimization before embarking on a pregnancy.', icon: 'favorite', color_class: 'secondary', display_order: 5, is_published: true },
    { id: '6', title: 'Reproductive Health', short_description: 'Routine and specialized care for long-term gynecological wellness.', icon: 'vital_signs', color_class: 'tertiary', display_order: 6, is_published: true }
  ],
  education: [
    { id: '1', degree: 'MBBS', institution: 'Sri Venkateswara Medical College, Tirupati', display_order: 1, is_published: true },
    { id: '2', degree: 'MS (OBGYN)', institution: 'Institute of Obstetrics & Gynaecology, Egmore', display_order: 2, is_published: true }
  ],
  practice_details: {
    id: 'default',
    clinic_name: 'LIVF Fertility',
    tagline: "Advanced IVF & Fertility Care, Women's Hormone & PCOS Management",
    locations: [
      { name: 'Perungudi Clinic', city: 'Chennai' },
      { name: 'T. Nagar Clinic', city: 'Chennai' }
    ]
  },
  patient_approach: [
    { id: '1', step_number: '01', title: 'Personalised Evaluation', description: 'Thorough and tailored fertility assessments to understand your specific needs.', display_order: 1, is_published: true },
    { id: '2', step_number: '02', title: 'Clear Communication', description: 'Transparent discussions about diagnoses, options, and expected outcomes.', display_order: 2, is_published: true },
    { id: '3', step_number: '03', title: 'Individualised Planning', description: 'Custom treatment strategies designed specifically for your body and goals.', display_order: 3, is_published: true },
    { id: '4', step_number: '04', title: 'Compassionate Care', description: 'A safe, confidential environment providing emotional support throughout your journey.', display_order: 4, is_published: true }
  ],
  contact_details: {
    id: 'default',
    heading: 'Begin Your Journey',
    subheading: 'Schedule a consultation at one of our Chennai locations. We are here to support you.',
    phone_numbers: ['7878784079', '6374449659'],
    locations: ['Perungudi', 'T. Nagar'],
    city: 'Chennai, Tamil Nadu',
    address_display: 'Level 4, Specialist Medical Centre',
    email: 'contact@drthalluru.com',
    map_image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ7sUBYZZGU8sNk6XdICTUPoKDWeT6Erbb7M12MD1qT7oTTkX0qfS1paLQy9s_uPaWxsqGY7KNVOA61gT8XsUjUwnRItiGVPLOarn6NldL6pFoNzY87EUPdGvChpks6IZDimOCP_EYB5vyWQoJyHr_YFIlOsCKjNTxMRlK-7pOmt4iioKDhVVmrMLPR3loQvFntt5Af_5vUGakOUK2t_wCa-xxZyT7KTZHLirr0z-p16Lo322bGraF',
    map_link: 'https://maps.google.com/maps?q=Level%204%2C%20Specialist%20Medical%20Centre%2C%20Perungudi%2C%20T.%20Nagar%2C%20Chennai%2C%20Tamil%20Nadu&t=&z=15&ie=UTF8&iwloc=&output=embed'
  }
};

export function getDynamicMapQuery(contact) {
  if (!contact) return 'LIVF Fertility, Chennai';
  const address = contact.address_display || '';
  const locs = Array.isArray(contact.locations) 
    ? contact.locations.join(', ') 
    : (contact.locations || '');
  const city = contact.city || '';
  const parts = [address, locs, city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'LIVF Fertility, Chennai';
}

export function getDynamicMapEmbedUrl(contact) {
  const query = getDynamicMapQuery(contact);
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

export function parseLocationQueryToContact(queryOrUrl, existingContact = {}) {
  if (!queryOrUrl || typeof queryOrUrl !== 'string') return existingContact;

  let raw = queryOrUrl.trim();

  if (raw.includes('<iframe')) {
    const match = raw.match(/src=["']([^"']+)["']/);
    if (match && match[1]) raw = match[1];
  }

  if (raw.includes('http://') || raw.includes('https://')) {
    try {
      const urlObj = new URL(raw);
      const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('query');
      if (q) raw = decodeURIComponent(q);
    } catch (e) {
      const qMatch = raw.match(/[?&](?:q|query)=([^&]+)/);
      if (qMatch && qMatch[1]) raw = decodeURIComponent(qMatch[1]);
    }
  }

  raw = raw.replace(/^https?:\/\/maps\.google\.com\/maps\?q=/i, '');
  raw = raw.replace(/&.*$/, '');
  try {
    raw = decodeURIComponent(raw).trim();
  } catch (e) {
    raw = raw.trim();
  }

  if (!raw) return existingContact;

  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);

  let address_display = existingContact.address_display || '';
  let locations = Array.isArray(existingContact.locations) ? [...existingContact.locations] : [];
  let city = existingContact.city || '';

  if (parts.length === 1) {
    address_display = parts[0];
    locations = [parts[0]];
  } else if (parts.length === 2) {
    address_display = parts[0];
    locations = [parts[0]];
    city = parts[1];
  } else if (parts.length === 3) {
    address_display = parts[0];
    locations = [parts[1]];
    city = parts[2];
  } else if (parts.length >= 4) {
    const isLastStateOrCountry = /tamil nadu|india|karnataka|kerala|maharashtra|telangana|andhra pradesh|state/i.test(parts[parts.length - 1]);
    if (isLastStateOrCountry) {
      city = `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
      const middleParts = parts.slice(0, parts.length - 2);
      if (middleParts.length >= 2) {
        address_display = middleParts.slice(0, Math.ceil(middleParts.length / 2)).join(', ');
        locations = middleParts.slice(Math.ceil(middleParts.length / 2));
      } else {
        address_display = middleParts[0];
        locations = [middleParts[0]];
      }
    } else {
      city = parts[parts.length - 1];
      const middleParts = parts.slice(0, parts.length - 1);
      if (middleParts.length >= 2) {
        address_display = middleParts.slice(0, Math.ceil(middleParts.length / 2)).join(', ');
        locations = middleParts.slice(Math.ceil(middleParts.length / 2));
      } else {
        address_display = middleParts[0];
        locations = [middleParts[0]];
      }
    }
  }

  const dynamicEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(raw)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return {
    ...existingContact,
    address_display,
    locations,
    city,
    map_link: dynamicEmbedUrl
  };
}

// Public Data Service
export const publicContentService = {
  async getDoctorProfile() {
    const saved = localStorage.getItem('dr_raveena_doctor_profile');
    if (!isSupabaseConfigured()) {
      return saved ? JSON.parse(saved) : INITIAL_DATA.doctor_profile;
    }
    try {
      const { data, error } = await supabase.from('doctor_profile').select('*').single();
      if (error || !data) return saved ? JSON.parse(saved) : INITIAL_DATA.doctor_profile;
      return data;
    } catch {
      return saved ? JSON.parse(saved) : INITIAL_DATA.doctor_profile;
    }
  },

  async getAboutContent() {
    const saved = localStorage.getItem('dr_raveena_about_content');
    if (!isSupabaseConfigured()) {
      return saved ? JSON.parse(saved) : INITIAL_DATA.about_content;
    }
    try {
      const { data, error } = await supabase.from('about_content').select('*').single();
      if (error || !data) return saved ? JSON.parse(saved) : INITIAL_DATA.about_content;
      return data;
    } catch {
      return saved ? JSON.parse(saved) : INITIAL_DATA.about_content;
    }
  },

  async getCareAreas() {
    if (!isSupabaseConfigured()) return INITIAL_DATA.care_areas;
    try {
      const { data, error } = await supabase
        .from('care_areas')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      if (error || !data || data.length === 0) return INITIAL_DATA.care_areas;
      return data;
    } catch {
      return INITIAL_DATA.care_areas;
    }
  },

  async getEducation() {
    if (!isSupabaseConfigured()) return INITIAL_DATA.education;
    try {
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      if (error || !data || data.length === 0) return INITIAL_DATA.education;
      return data;
    } catch {
      return INITIAL_DATA.education;
    }
  },

  async getPracticeDetails() {
    if (!isSupabaseConfigured()) return INITIAL_DATA.practice_details;
    try {
      const { data, error } = await supabase.from('practice_details').select('*').single();
      if (error || !data) return INITIAL_DATA.practice_details;
      return data;
    } catch {
      return INITIAL_DATA.practice_details;
    }
  },

  async getPatientApproach() {
    if (!isSupabaseConfigured()) return INITIAL_DATA.patient_approach;
    try {
      const { data, error } = await supabase
        .from('patient_approach')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      if (error || !data || data.length === 0) return INITIAL_DATA.patient_approach;
      return data;
    } catch {
      return INITIAL_DATA.patient_approach;
    }
  },

  async getContactDetails() {
    const saved = localStorage.getItem('dr_raveena_contact_details');
    const localData = saved ? JSON.parse(saved) : null;

    if (!isSupabaseConfigured()) {
      return localData || INITIAL_DATA.contact_details;
    }
    try {
      const { data, error } = await supabase.from('contact_details').select('*').single();
      if (error || !data) {
        return localData || INITIAL_DATA.contact_details;
      }
      return { ...data, ...(localData || {}) };
    } catch {
      return localData || INITIAL_DATA.contact_details;
    }
  }
};

// Admin Content Service (CRUD)
export const adminContentService = {
  // Doctor Profile
  async updateDoctorProfile(profile) {
    localStorage.setItem('dr_raveena_doctor_profile', JSON.stringify(profile));
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { data, error } = await supabase.from('doctor_profile').upsert(profile).select();
      if (error) {
        if (profile.id) {
          const { data: updateData, error: updateErr } = await supabase.from('doctor_profile').update(profile).eq('id', profile.id).select();
          if (updateErr) throw updateErr;
          return { success: true, data: updateData };
        }
        throw error;
      }
      return { success: true, data };
    } catch (err) {
      console.warn('Supabase DB write restricted, using local session state:', err.message);
      return { success: true, localOnly: true, message: err.message };
    }
  },

  // About Content
  async updateAboutContent(about) {
    localStorage.setItem('dr_raveena_about_content', JSON.stringify(about));
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { data, error } = await supabase.from('about_content').upsert(about).select();
      if (error) {
        if (about.id) {
          const { data: updateData, error: updateErr } = await supabase.from('about_content').update(about).eq('id', about.id).select();
          if (updateErr) throw updateErr;
          return { success: true, data: updateData };
        }
        throw error;
      }
      return { success: true, data };
    } catch (err) {
      console.warn('Supabase DB write restricted, using local session state:', err.message);
      return { success: true, localOnly: true, message: err.message };
    }
  },

  // Care Areas CRUD
  async getAllCareAreas() {
    if (!isSupabaseConfigured()) return INITIAL_DATA.care_areas;
    try {
      const { data, error } = await supabase.from('care_areas').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return data && data.length > 0 ? data : INITIAL_DATA.care_areas;
    } catch {
      return INITIAL_DATA.care_areas;
    }
  },
  async saveCareArea(careArea) {
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { data, error } = await supabase.from('care_areas').upsert(careArea).select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('Care Area save notice:', err.message);
      return { success: true, localOnly: true, message: err.message };
    }
  },
  async deleteCareArea(id) {
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { error } = await supabase.from('care_areas').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Care Area delete notice:', err.message);
      return { success: true, localOnly: true };
    }
  },

  // Education CRUD
  async getAllEducation() {
    if (!isSupabaseConfigured()) return INITIAL_DATA.education;
    try {
      const { data, error } = await supabase.from('education').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return data && data.length > 0 ? data : INITIAL_DATA.education;
    } catch {
      return INITIAL_DATA.education;
    }
  },
  async saveEducation(edu) {
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { data, error } = await supabase.from('education').upsert(edu).select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('Education save notice:', err.message);
      return { success: true, localOnly: true, message: err.message };
    }
  },
  async deleteEducation(id) {
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { error } = await supabase.from('education').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Education delete notice:', err.message);
      return { success: true, localOnly: true };
    }
  },

  // Practice Details
  async updatePracticeDetails(practice) {
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { data, error } = await supabase.from('practice_details').upsert(practice).select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('Practice update notice:', err.message);
      return { success: true, localOnly: true, message: err.message };
    }
  },

  // Patient Approach CRUD
  async getAllPatientApproach() {
    if (!isSupabaseConfigured()) return INITIAL_DATA.patient_approach;
    try {
      const { data, error } = await supabase.from('patient_approach').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return data && data.length > 0 ? data : INITIAL_DATA.patient_approach;
    } catch {
      return INITIAL_DATA.patient_approach;
    }
  },
  async savePatientApproach(approach) {
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { data, error } = await supabase.from('patient_approach').upsert(approach).select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.warn('Patient approach save notice:', err.message);
      return { success: true, localOnly: true, message: err.message };
    }
  },
  async deletePatientApproach(id) {
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { error } = await supabase.from('patient_approach').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Patient approach delete notice:', err.message);
      return { success: true, localOnly: true };
    }
  },

  // Contact Details
  async updateContactDetails(contact) {
    localStorage.setItem('dr_raveena_contact_details', JSON.stringify(contact));
    if (!isSupabaseConfigured()) return { success: true, localOnly: true };
    try {
      const { data, error } = await supabase.from('contact_details').upsert(contact).select();
      if (error) {
        if (contact.id) {
          const { data: updateData, error: updateErr } = await supabase.from('contact_details').update(contact).eq('id', contact.id).select();
          if (updateErr) throw updateErr;
          return { success: true, data: updateData };
        }
        throw error;
      }
      return { success: true, data };
    } catch (err) {
      console.warn('Contact details update notice:', err.message);
      return { success: true, localOnly: true, message: err.message };
    }
  },

  // Storage Media Upload
  async uploadMedia(file, bucket = 'portfolio-media') {
    if (!isSupabaseConfigured()) {
      return { success: true, url: URL.createObjectURL(file), localOnly: true };
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
  }
};
