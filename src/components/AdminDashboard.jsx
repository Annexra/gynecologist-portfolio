import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminContentService, publicContentService } from '../services/contentService';

export default function AdminDashboard({ onLogout }) {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // CMS State
  const [profile, setProfile] = useState({});
  const [about, setAbout] = useState({});
  const [careAreas, setCareAreas] = useState([]);
  const [education, setEducation] = useState([]);
  const [practice, setPractice] = useState({});
  const [patientApproach, setPatientApproach] = useState([]);
  const [contact, setContact] = useState({});

  // UI Feedback
  const [statusMessage, setStatusMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modals for CRUD
  const [careModal, setCareModal] = useState({ open: false, data: null });
  const [eduModal, setEduModal] = useState({ open: false, data: null });
  const [approachModal, setApproachModal] = useState({ open: false, data: null });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [profData, aboutData, careData, eduData, practiceData, approachData, contactData] = await Promise.all([
        publicContentService.getDoctorProfile(),
        publicContentService.getAboutContent(),
        adminContentService.getAllCareAreas(),
        adminContentService.getAllEducation(),
        publicContentService.getPracticeDetails(),
        adminContentService.getAllPatientApproach(),
        publicContentService.getContactDetails()
      ]);

      setProfile(profData || {});
      setAbout(aboutData || {});
      setCareAreas(careData || []);
      setEducation(eduData || []);
      setPractice(practiceData || {});
      setPatientApproach(approachData || []);
      setContact(contactData || {});
    } catch (err) {
      showNotice('Error loading CMS data', 'error');
    }
  };

  const showNotice = (msg, type = 'success') => {
    setStatusMessage({ msg, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminContentService.updateDoctorProfile(profile);
      showNotice('Doctor Profile updated successfully!');
    } catch (err) {
      showNotice('Failed to update profile: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // About Save
  const handleSaveAbout = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminContentService.updateAboutContent(about);
      showNotice('About section updated successfully!');
    } catch (err) {
      showNotice('Failed to update about section: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Media Upload
  const handleImageUpload = async (e, targetField, objectType = 'profile') => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await adminContentService.uploadMedia(file);
      if (objectType === 'profile') {
        setProfile(prev => ({ ...prev, [targetField]: result.url }));
      } else if (objectType === 'about') {
        setAbout(prev => ({ ...prev, [targetField]: result.url }));
      }
      showNotice('Media uploaded successfully!');
    } catch (err) {
      showNotice('Image upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Care Area Save & Delete
  const handleSaveCareArea = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminContentService.saveCareArea(careModal.data);
      setCareModal({ open: false, data: null });
      loadAllData();
      showNotice('Care Area saved successfully!');
    } catch (err) {
      showNotice('Failed to save Care Area: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCareArea = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Care Area?')) return;
    try {
      await adminContentService.deleteCareArea(id);
      loadAllData();
      showNotice('Care Area deleted.');
    } catch (err) {
      showNotice('Failed to delete: ' + err.message, 'error');
    }
  };

  // Education Save & Delete
  const handleSaveEducation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminContentService.saveEducation(eduModal.data);
      setEduModal({ open: false, data: null });
      loadAllData();
      showNotice('Education entry saved!');
    } catch (err) {
      showNotice('Failed to save Education: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    if (!window.confirm('Delete this education entry?')) return;
    try {
      await adminContentService.deleteEducation(id);
      loadAllData();
      showNotice('Education entry deleted.');
    } catch (err) {
      showNotice('Failed to delete: ' + err.message, 'error');
    }
  };

  // Contact Save
  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminContentService.updateContactDetails(contact);
      showNotice('Contact details updated!');
    } catch (err) {
      showNotice('Failed to update contact: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-surface border-r border-outline-variant/30 flex-shrink-0">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
          <div>
            <h2 className="font-display-lg text-primary text-xl">Dr. Raveena CMS</h2>
            <p className="font-body-sm text-on-surface-variant text-xs">Admin Control Center</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
            { id: 'profile', label: 'Doctor Profile', icon: 'person' },
            { id: 'about', label: 'About Section', icon: 'info' },
            { id: 'care', label: 'Areas of Care', icon: 'child_care' },
            { id: 'education', label: 'Education & Training', icon: 'school' },
            { id: 'practice', label: 'Current Practice', icon: 'local_hospital' },
            { id: 'approach', label: 'Patient Approach', icon: 'favorite' },
            { id: 'contact', label: 'Contact Details', icon: 'call' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary font-semibold shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-outline-variant/30 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            <span>View Public Site</span>
          </a>
          <button
            onClick={onLogout || logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error-container text-on-error-container text-xs hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl overflow-y-auto">
        {/* Status Toast Notice */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between shadow-lg ${
            statusMessage.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'
          }`}>
            <span className="font-semibold">{statusMessage.msg}</span>
            <button onClick={() => setStatusMessage(null)} className="material-symbols-outlined text-sm">close</button>
          </div>
        )}

        {/* DASHBOARD OVERVIEW TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display-lg text-primary text-3xl">Website Overview</h1>
              <p className="font-body-md text-on-surface-variant text-sm mt-1">Manage public website details and section contents securely.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 space-y-2">
                <span className="material-symbols-outlined text-primary text-3xl">child_care</span>
                <p className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant">Care Areas</p>
                <p className="font-headline-lg text-2xl text-on-surface">{careAreas.length} Published</p>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 space-y-2">
                <span className="material-symbols-outlined text-secondary text-3xl">school</span>
                <p className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant">Education Records</p>
                <p className="font-headline-lg text-2xl text-on-surface">{education.length} Degrees</p>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 space-y-2">
                <span className="material-symbols-outlined text-tertiary text-3xl">local_hospital</span>
                <p className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant">Clinic Locations</p>
                <p className="font-headline-lg text-2xl text-on-surface">{practice?.locations?.length || 2} Clinics</p>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 space-y-2">
                <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
                <p className="font-label-md text-xs uppercase tracking-wider text-on-surface-variant">Admin Session</p>
                <p className="font-headline-lg text-lg text-on-surface truncate">{user?.email || 'Active'}</p>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 space-y-4">
              <h3 className="font-headline-sm text-lg text-primary">Quick Navigation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setActiveTab('profile')} className="p-4 rounded-xl bg-surface-container-low text-left hover:bg-surface-container transition-colors">
                  <p className="font-label-md text-sm text-on-surface">Edit Doctor Profile</p>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-1">Name, qualifications, tagline</p>
                </button>
                <button onClick={() => setActiveTab('care')} className="p-4 rounded-xl bg-surface-container-low text-left hover:bg-surface-container transition-colors">
                  <p className="font-label-md text-sm text-on-surface">Manage Care Areas</p>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-1">Add, update, or remove specialties</p>
                </button>
                <button onClick={() => setActiveTab('contact')} className="p-4 rounded-xl bg-surface-container-low text-left hover:bg-surface-container transition-colors">
                  <p className="font-label-md text-sm text-on-surface">Update Contact Info</p>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-1">Phone numbers & clinic addresses</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOCTOR PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h1 className="font-display-lg text-primary text-3xl">Doctor Profile CMS</h1>
            <form onSubmit={handleSaveProfile} className="bg-surface p-8 rounded-3xl border border-outline-variant/30 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Doctor Name</label>
                  <input
                    type="text"
                    value={profile.name || ''}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Qualifications</label>
                  <input
                    type="text"
                    value={profile.qualifications || ''}
                    onChange={e => setProfile({ ...profile, qualifications: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Professional Title</label>
                <input
                  type="text"
                  value={profile.title || ''}
                  onChange={e => setProfile({ ...profile, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Hero Section Tagline</label>
                <textarea
                  rows={2}
                  value={profile.hero_description || ''}
                  onChange={e => setProfile({ ...profile, hero_description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <img src={profile.photo_url || 'assets/dr_raveena.jpg'} alt="Preview" className="w-16 h-16 rounded-2xl object-cover border" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, 'photo_url', 'profile')}
                    disabled={uploading}
                    className="text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-secondary-container file:text-on-secondary-container hover:file:opacity-90"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md text-sm shadow-md hover:shadow-lg transition-all"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

        {/* ABOUT SECTION TAB */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <h1 className="font-display-lg text-primary text-3xl">About Section CMS</h1>
            <form onSubmit={handleSaveAbout} className="bg-surface p-8 rounded-3xl border border-outline-variant/30 space-y-6">
              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Section Heading</label>
                <input
                  type="text"
                  value={about.heading || ''}
                  onChange={e => setAbout({ ...about, heading: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Paragraph 1 (Background & Specialty)</label>
                <textarea
                  rows={4}
                  value={about.paragraph_1 || ''}
                  onChange={e => setAbout({ ...about, paragraph_1: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Paragraph 2 (Patient Philosophy)</label>
                <textarea
                  rows={4}
                  value={about.paragraph_2 || ''}
                  onChange={e => setAbout({ ...about, paragraph_2: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md text-sm shadow-md hover:shadow-lg transition-all"
              >
                {saving ? 'Saving...' : 'Save About Changes'}
              </button>
            </form>
          </div>
        )}

        {/* AREAS OF CARE TAB */}
        {activeTab === 'care' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="font-display-lg text-primary text-3xl">Areas of Care (Specialties)</h1>
              <button
                onClick={() => setCareModal({ open: true, data: { title: '', short_description: '', icon: 'child_care', display_order: careAreas.length + 1, is_published: true } })}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Specialty</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {careAreas.map(item => (
                <div key={item.id} className="bg-surface p-6 rounded-2xl border border-outline-variant/30 space-y-3 relative">
                  <div className="flex items-start justify-between">
                    <span className="material-symbols-outlined text-2xl text-primary">{item.icon || 'child_care'}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCareModal({ open: true, data: item })} className="text-secondary hover:text-primary text-xs">Edit</button>
                      <button onClick={() => handleDeleteCareArea(item.id)} className="text-error text-xs">Delete</button>
                    </div>
                  </div>
                  <h3 className="font-headline-sm text-on-surface text-base">{item.title}</h3>
                  <p className="font-body-sm text-on-surface-variant text-xs">{item.short_description}</p>
                </div>
              ))}
            </div>

            {/* Care Area Modal */}
            {careModal.open && (
              <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveCareArea} className="bg-surface p-6 rounded-3xl max-w-md w-full border border-outline-variant/30 space-y-4">
                  <h3 className="font-headline-sm text-primary text-lg">{careModal.data?.id ? 'Edit Specialty' : 'Add New Specialty'}</h3>
                  <div className="space-y-1">
                    <label className="font-label-md text-xs uppercase font-semibold">Title</label>
                    <input
                      type="text"
                      required
                      value={careModal.data?.title || ''}
                      onChange={e => setCareModal({ ...careModal, data: { ...careModal.data, title: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-xs uppercase font-semibold">Short Description</label>
                    <textarea
                      required
                      rows={3}
                      value={careModal.data?.short_description || ''}
                      onChange={e => setCareModal({ ...careModal, data: { ...careModal.data, short_description: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setCareModal({ open: false, data: null })} className="px-4 py-2 border rounded-xl text-xs">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs">{saving ? 'Saving...' : 'Save'}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* EDUCATION TAB */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="font-display-lg text-primary text-3xl">Education & Training</h1>
              <button
                onClick={() => setEduModal({ open: true, data: { degree: '', institution: '', display_order: education.length + 1, is_published: true } })}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Education</span>
              </button>
            </div>

            <div className="space-y-3">
              {education.map(item => (
                <div key={item.id} className="bg-surface p-6 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-sm text-on-surface text-lg">{item.degree}</h3>
                    <p className="font-body-sm text-on-surface-variant text-sm mt-0.5">{item.institution}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEduModal({ open: true, data: item })} className="text-secondary hover:text-primary text-xs">Edit</button>
                    <button onClick={() => handleDeleteEducation(item.id)} className="text-error text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Education Modal */}
            {eduModal.open && (
              <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveEducation} className="bg-surface p-6 rounded-3xl max-w-md w-full border border-outline-variant/30 space-y-4">
                  <h3 className="font-headline-sm text-primary text-lg">{eduModal.data?.id ? 'Edit Education' : 'Add Education Entry'}</h3>
                  <div className="space-y-1">
                    <label className="font-label-md text-xs uppercase font-semibold">Degree / Qualification</label>
                    <input
                      type="text"
                      required
                      value={eduModal.data?.degree || ''}
                      onChange={e => setEduModal({ ...eduModal, data: { ...eduModal.data, degree: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-xs uppercase font-semibold">Medical College / Institution</label>
                    <input
                      type="text"
                      required
                      value={eduModal.data?.institution || ''}
                      onChange={e => setEduModal({ ...eduModal, data: { ...eduModal.data, institution: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setEduModal({ open: false, data: null })} className="px-4 py-2 border rounded-xl text-xs">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs">{saving ? 'Saving...' : 'Save'}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* CONTACT DETAILS TAB */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h1 className="font-display-lg text-primary text-3xl">Contact Details CMS</h1>
            <form onSubmit={handleSaveContact} className="bg-surface p-8 rounded-3xl border border-outline-variant/30 space-y-6">
              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Contact Section Subheading</label>
                <input
                  type="text"
                  value={contact.subheading || ''}
                  onChange={e => setContact({ ...contact, subheading: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Phone Number 1</label>
                  <input
                    type="text"
                    value={contact.phone_numbers?.[0] || ''}
                    onChange={e => {
                      const nums = [...(contact.phone_numbers || [])];
                      nums[0] = e.target.value;
                      setContact({ ...contact, phone_numbers: nums });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Phone Number 2</label>
                  <input
                    type="text"
                    value={contact.phone_numbers?.[1] || ''}
                    onChange={e => {
                      const nums = [...(contact.phone_numbers || [])];
                      nums[1] = e.target.value;
                      setContact({ ...contact, phone_numbers: nums });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md text-sm shadow-md hover:shadow-lg transition-all"
              >
                {saving ? 'Saving...' : 'Save Contact Details'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
