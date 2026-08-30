import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminContentService, publicContentService, getDynamicMapQuery, getDynamicMapEmbedUrl, parseLocationQueryToContact } from '../services/contentService';

function InteractiveMapModal({ initialQuery, contact, onConfirm, onClose }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerRef = React.useRef(null);

  const [searchQuery, setSearchQuery] = React.useState(initialQuery || '');
  const [selectedCoords, setSelectedCoords] = React.useState({ lat: 13.0827, lng: 80.2707 });
  const [selectedAddress, setSelectedAddress] = React.useState(initialQuery || '');
  const [loading, setLoading] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(null);
  const [locationVerified, setLocationVerified] = React.useState(Boolean(initialQuery));

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const searchTimeoutRef = React.useRef(null);

  // Helper to sanitize incoming query or URL into clean place text
  const sanitizeQueryText = (text) => {
    if (!text || typeof text !== 'string') return '';
    let q = text.trim();
    if (q.includes('<iframe')) {
      const m = q.match(/src=["']([^"']+)["']/);
      if (m && m[1]) q = m[1];
    }
    if (q.includes('http://') || q.includes('https://')) {
      try {
        const u = new URL(q);
        const qP = u.searchParams.get('q') || u.searchParams.get('query');
        if (qP && !qP.includes('http')) return decodeURIComponent(qP);
        if (u.pathname.includes('/place/')) {
          const pm = u.pathname.match(/\/place\/([^/]+)/);
          if (pm && pm[1]) return decodeURIComponent(pm[1].replace(/\+/g, ' ')).replace(/@.*$/, '');
        }
      } catch (e) {
        const qm = q.match(/[?&](?:q|query)=([^&]+)/);
        if (qm && qm[1] && !qm[1].includes('http')) {
          try { return decodeURIComponent(qm[1]); } catch (e2) { return qm[1]; }
        }
      }
    }
    // Clean out raw coordinate parameters like 963m/data=!3m2...
    q = q.replace(/\/data=!.*$/i, '').replace(/@[\d.,]+z?/i, '').trim();
    if (q.includes('http://') || q.includes('https://')) return '';
    return q;
  };

  React.useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!window.L) {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!window.leafletLoadingPromise) {
          window.leafletLoadingPromise = new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }
        await window.leafletLoadingPromise;
      }

      if (!isMounted || !mapRef.current) return;

      if (!mapInstanceRef.current && window.L) {
        const L = window.L;
        const initialLat = selectedCoords.lat;
        const initialLng = selectedCoords.lng;

        const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="background-color: #7d4d7a; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });

        const marker = L.marker([initialLat, initialLng], {
          draggable: true,
          icon: customIcon
        }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng();
          setSelectedCoords({ lat, lng });
          await reverseGeocode(lat, lng);
        });

        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setSelectedCoords({ lat, lng });
          await reverseGeocode(lat, lng);
        });

        const cleanInitial = sanitizeQueryText(initialQuery);
        if (cleanInitial) {
          geocodeSearch(cleanInitial, map, marker);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch Live Autocomplete Suggestions as user types
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setLocationVerified(false);
    if (searchError) setSearchError(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const cleanVal = sanitizeQueryText(val);
    if (!cleanVal || cleanVal.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanVal)}&limit=5&addressdetails=1`);
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (placeItem) => {
    const lat = parseFloat(placeItem.lat);
    const lng = parseFloat(placeItem.lon);
    const addressText = placeItem.display_name;

    setSelectedCoords({ lat, lng });
    setSelectedAddress(addressText);
    setSearchQuery(addressText);
    setLocationVerified(true);
    setSearchError(null);
    setShowSuggestions(false);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    setLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        const addressText = data.display_name;
        setSelectedAddress(addressText);
        setSearchQuery(addressText);
        setLocationVerified(true);
      } else {
        setLocationVerified(false);
        setSearchError('Could not find address details for this map point. Please select a valid location.');
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setSearchError('Failed to fetch address. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const geocodeSearch = async (queryText, targetMap, targetMarker) => {
    const cleanQuery = sanitizeQueryText(queryText);
    if (!cleanQuery) {
      setSearchError('Please enter a location name, address, or landmark to search.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    setShowSuggestions(false);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=5&addressdetails=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const addressText = data[0].display_name || cleanQuery;

        const map = targetMap || mapInstanceRef.current;
        const marker = targetMarker || markerRef.current;

        setSelectedCoords({ lat, lng });
        setSelectedAddress(addressText);
        setSearchQuery(addressText);
        setLocationVerified(true);
        setSearchError(null);

        if (map && marker) {
          map.setView([lat, lng], 15);
          marker.setLatLng([lat, lng]);
        }
      } else {
        setLocationVerified(false);
        setSearchError(`No real location match found for "${cleanQuery}". Please enter a valid area, street, hospital, or city name.`);
      }
    } catch (err) {
      console.error('Geocode search error:', err);
      setSearchError('Geocoding search service unavailable. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    if (!locationVerified || !selectedAddress) {
      setSearchError('Invalid location! Please search for a valid real place or click a point on the map first.');
      return;
    }
    onConfirm(selectedAddress);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-surface w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/40 flex flex-col max-h-[95vh] my-auto">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-display-lg text-primary text-base sm:text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg sm:text-xl">location_on</span>
              <span>Interactive Map Location Picker</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5">Click on the map or drag the pin marker to select clinic location.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">close</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {/* Big Responsive Search Bar Area with Autocomplete */}
          <div className="p-3.5 sm:p-4 bg-surface border-b border-outline-variant/30 space-y-2.5 shrink-0 relative z-40">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 relative">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search location, clinic, hospital or street (e.g. Apollo Hospital, Chennai)"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      geocodeSearch(searchQuery);
                    }
                  }}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs sm:text-sm font-medium text-on-surface focus:outline-none focus:border-primary shadow-inner"
                />
                {searchLoading && (
                  <span className="material-symbols-outlined animate-spin absolute right-3 top-3 text-primary text-base">sync</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => geocodeSearch(searchQuery)}
                disabled={searching}
                className="w-full sm:w-auto px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-xs font-bold hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-base">{searching ? 'sync' : 'search'}</span>
                <span>{searching ? 'Searching...' : 'Search Location'}</span>
              </button>
            </div>

            {/* Google Maps Style Location Autocomplete Suggestions List */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-3.5 right-3.5 top-full z-50 mt-1 bg-surface border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden divide-y divide-outline-variant/30 max-h-64 overflow-y-auto animate-in fade-in duration-150">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-3 hover:bg-surface-container-high cursor-pointer flex items-start gap-3 transition-colors interactive-element"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary text-base">location_on</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-on-surface truncate">
                        {item.address?.hospital || item.address?.clinic || item.address?.amenity || item.address?.road || item.display_name.split(',')[0]}
                      </p>
                      <p className="text-[11px] text-on-surface-variant truncate">{item.display_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Validation & Search Feedback Notice (Prevents Overflow with break-all) */}
            {searchError && (
              <div className="p-2.5 bg-error-container/90 text-on-error-container rounded-xl text-xs flex items-start gap-2 shadow-sm animate-in fade-in duration-200 min-w-0 max-w-full overflow-hidden break-all break-words">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                <span className="font-semibold break-all break-words min-w-0">{searchError}</span>
              </div>
            )}

            {locationVerified && !searchError && (
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                <span className="material-symbols-outlined text-base text-primary">verified</span>
                <span>Real Location Verified</span>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="h-64 sm:h-96 min-h-[220px] sm:min-h-[350px] relative bg-surface-container-low shrink-0 overflow-hidden">
            <div ref={mapRef} className="w-full h-full z-10" />
            {loading && (
              <div className="absolute top-3 right-3 z-20 bg-surface/95 px-3 py-1.5 rounded-xl shadow-md border border-outline-variant text-xs text-primary font-semibold flex items-center gap-2 backdrop-blur-sm">
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                <span>Fetching location details...</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer (Prevents text overflow with break-all / truncate) */}
        <div className="p-3.5 sm:p-4 bg-surface border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20 min-w-0 max-w-full overflow-hidden">
          <div className="text-xs text-on-surface-variant max-w-lg w-full min-w-0 overflow-hidden">
            <span className="font-semibold text-on-surface block text-[11px] sm:text-xs">Active Location Selected:</span>
            <span className="text-primary font-medium text-xs truncate block mt-0.5 break-all">
              {selectedAddress || searchQuery || 'Click map pin to pick location'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                const active = selectedAddress || searchQuery;
                if (active) {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(active)}`, '_blank');
                }
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-surface-container-high text-on-surface font-label-md text-xs hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1.5 font-medium"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>Open in Maps</span>
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 font-bold"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onLogout }) {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const [mapPickerModal, setMapPickerModal] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'profile', label: 'Doctor Profile', icon: 'person' },
    { id: 'about', label: 'About Section', icon: 'info' },
    { id: 'care', label: 'Areas of Care', icon: 'child_care' },
    { id: 'education', label: 'Education & Training', icon: 'school' },
    { id: 'practice', label: 'Current Practice', icon: 'local_hospital' },
    { id: 'approach', label: 'Patient Approach', icon: 'favorite' },
    { id: 'contact', label: 'Contact Details', icon: 'call' },
  ];

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

  // Practice Save
  const handleSavePractice = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminContentService.updatePracticeDetails(practice);
      showNotice('Current Practice details updated!');
    } catch (err) {
      showNotice('Failed to update practice details: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Patient Approach Save & Delete
  const handleSavePatientApproach = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminContentService.savePatientApproach(approachModal.data);
      setApproachModal({ open: false, data: null });
      loadAllData();
      showNotice('Patient Approach pillar saved!');
    } catch (err) {
      showNotice('Failed to save Patient Approach: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatientApproach = async (id) => {
    if (!window.confirm('Delete this patient approach pillar?')) return;
    try {
      await adminContentService.deletePatientApproach(id);
      loadAllData();
      showNotice('Patient approach pillar deleted.');
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
      window.dispatchEvent(new Event('cms_contact_updated'));
      showNotice('Contact details updated successfully! Live website updated.');
    } catch (err) {
      showNotice('Failed to update contact: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col md:flex-row relative">
      {/* Mobile Top Floating Menu Button (Always visible at any scroll / Y position) */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-12 h-12 rounded-2xl bg-primary text-on-primary shadow-2xl flex items-center justify-center active:scale-95 hover:scale-105 transition-all border border-white/20"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Header Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 px-5 py-3.5 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="font-display-lg text-primary text-lg font-bold">Dr. Raveena CMS</h2>
          <p className="font-body-sm text-on-surface-variant text-[11px]">Admin Control Center</p>
        </div>
      </header>

      {/* Mobile Menu Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-40 animate-in fade-in duration-200"
        />
      )}

      {/* Mobile Floating Navigation Drawer Card */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-20 z-50 bg-surface border border-outline-variant/40 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <span className="font-headline-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant">Navigation Menu</span>
            <span className="text-xs text-primary font-semibold">Select Tab</span>
          </div>

          <nav className="space-y-1">
            {navTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-label-md text-sm transition-all ${
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

          <div className="pt-3 border-t border-outline-variant/30 space-y-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>View Public Site</span>
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onLogout) onLogout();
                else logout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-error-container text-on-error-container text-xs hover:opacity-90 transition-opacity font-semibold"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex md:w-64 bg-surface border-r border-outline-variant/30 flex-col flex-shrink-0 min-h-screen">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
          <div>
            <h2 className="font-display-lg text-primary text-xl font-bold">Dr. Raveena CMS</h2>
            <p className="font-body-sm text-on-surface-variant text-xs">Admin Control Center</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {navTabs.map(tab => (
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
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error-container text-on-error-container text-xs hover:opacity-90 transition-opacity font-semibold"
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
                  <img src={profile.photo_url || 'assets/dr_raveena.jpeg'} alt="Preview" className="w-16 h-16 rounded-2xl object-cover border" />
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

              <div className="space-y-2">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">About Section Photo</label>
                <div className="flex items-center gap-4">
                  <img src={about.photo_url || 'assets/dr_raveena.jpeg'} alt="Preview" className="w-16 h-16 rounded-2xl object-cover border" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, 'photo_url', 'about')}
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

        {/* CURRENT PRACTICE TAB */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            <h1 className="font-display-lg text-primary text-3xl">Current Practice CMS</h1>
            <form onSubmit={handleSavePractice} className="bg-surface p-8 rounded-3xl border border-outline-variant/30 space-y-6">
              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Clinic Name</label>
                <input
                  type="text"
                  value={practice.clinic_name || ''}
                  onChange={e => setPractice({ ...practice, clinic_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Practice Tagline / Focus</label>
                <textarea
                  rows={2}
                  value={practice.tagline || ''}
                  onChange={e => setPractice({ ...practice, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="space-y-4">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Clinic Locations</label>
                {(practice.locations || []).map((loc, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface-container-low border">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant">Location Name</label>
                      <input
                        type="text"
                        value={loc.name || ''}
                        onChange={e => {
                          const locs = [...(practice.locations || [])];
                          locs[idx] = { ...locs[idx], name: e.target.value };
                          setPractice({ ...practice, locations: locs });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-surface border text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant">City</label>
                      <input
                        type="text"
                        value={loc.city || ''}
                        onChange={e => {
                          const locs = [...(practice.locations || [])];
                          locs[idx] = { ...locs[idx], city: e.target.value };
                          setPractice({ ...practice, locations: locs });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-surface border text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md text-sm shadow-md hover:shadow-lg transition-all"
              >
                {saving ? 'Saving...' : 'Save Practice Details'}
              </button>
            </form>
          </div>
        )}

        {/* PATIENT APPROACH TAB */}
        {activeTab === 'approach' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="font-display-lg text-primary text-3xl">Patient Approach Pillars</h1>
              <button
                onClick={() => setApproachModal({ open: true, data: { step_number: `0${patientApproach.length + 1}`, title: '', description: '', display_order: patientApproach.length + 1, is_published: true } })}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Pillar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {patientApproach.map(item => (
                <div key={item.id} className="bg-surface p-6 rounded-2xl border border-outline-variant/30 space-y-3 relative">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl font-display-lg text-primary font-bold">{item.step_number}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setApproachModal({ open: true, data: item })} className="text-secondary hover:text-primary text-xs">Edit</button>
                      <button onClick={() => handleDeletePatientApproach(item.id)} className="text-error text-xs">Delete</button>
                    </div>
                  </div>
                  <h3 className="font-headline-sm text-on-surface text-base">{item.title}</h3>
                  <p className="font-body-sm text-on-surface-variant text-xs">{item.description}</p>
                </div>
              ))}
            </div>

            {/* Approach Modal */}
            {approachModal.open && (
              <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSavePatientApproach} className="bg-surface p-6 rounded-3xl max-w-md w-full border border-outline-variant/30 space-y-4">
                  <h3 className="font-headline-sm text-primary text-lg">{approachModal.data?.id ? 'Edit Pillar' : 'Add Approach Pillar'}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-label-md text-xs uppercase font-semibold">Step Number</label>
                      <input
                        type="text"
                        required
                        value={approachModal.data?.step_number || ''}
                        onChange={e => setApproachModal({ ...approachModal, data: { ...approachModal.data, step_number: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-label-md text-xs uppercase font-semibold">Title</label>
                      <input
                        type="text"
                        required
                        value={approachModal.data?.title || ''}
                        onChange={e => setApproachModal({ ...approachModal, data: { ...approachModal.data, title: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-xs uppercase font-semibold">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={approachModal.data?.description || ''}
                      onChange={e => setApproachModal({ ...approachModal, data: { ...approachModal.data, description: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setApproachModal({ open: false, data: null })} className="px-4 py-2 border rounded-xl text-xs">Cancel</button>
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

              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Clinic Location Names (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Perungudi, T. Nagar"
                  value={Array.isArray(contact.locations) ? contact.locations.join(', ') : contact.locations || ''}
                  onChange={e => {
                    const locs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    const updated = { ...contact, locations: locs };
                    setContact({ ...updated, map_link: getDynamicMapEmbedUrl(updated) });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Clinic Address Display</label>
                  <input
                    type="text"
                    placeholder="e.g. Level 4, Specialist Medical Centre"
                    value={contact.address_display || ''}
                    onChange={e => {
                      const updated = { ...contact, address_display: e.target.value };
                      setContact({ ...updated, map_link: getDynamicMapEmbedUrl(updated) });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-md text-xs uppercase font-semibold text-on-surface">City & State</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai, Tamil Nadu"
                    value={contact.city || ''}
                    onChange={e => {
                      const updated = { ...contact, city: e.target.value };
                      setContact({ ...updated, map_link: getDynamicMapEmbedUrl(updated) });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Contact Email</label>
                <input
                  type="email"
                  placeholder="contact@drthalluru.com"
                  value={contact.email || ''}
                  onChange={e => setContact({ ...contact, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-md text-xs uppercase font-semibold text-on-surface">Clinic Map Location</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      let initialQuery = '';
                      if (contact.map_link && !contact.map_link.includes('<iframe') && !contact.map_link.includes('http')) {
                        initialQuery = contact.map_link;
                      } else {
                        initialQuery = getDynamicMapQuery(contact);
                      }
                      setMapSearchQuery(initialQuery);
                      setMapPickerModal(true);
                    }}
                    className="px-5 py-3 bg-primary text-on-primary rounded-xl font-label-md text-xs flex items-center gap-2 hover:opacity-95 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>Choose / Pick Location on Map</span>
                  </button>
                  {contact.map_link && (
                    <span className="text-xs text-primary font-semibold flex items-center gap-1 bg-primary-container/40 px-3 py-1.5 rounded-lg border border-primary/20">
                      <span className="material-symbols-outlined text-sm text-primary">check_circle</span> Location Set
                    </span>
                  )}
                </div>

                <div className="pt-2 space-y-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">Map Link or Embed URL / Search Query:</label>
                  <input
                    type="text"
                    placeholder="https://maps.google.com/?q=... or <iframe src='...'></iframe> or clinic search query"
                    value={contact.map_link || ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val.trim()) {
                        setContact(prev => parseLocationQueryToContact(val, prev));
                      } else {
                        setContact(prev => ({ ...prev, map_link: '' }));
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface"
                  />
                  <p className="text-[11px] text-on-surface-variant">Use the 'Choose Location' button to search & select your clinic directly on Google Maps, or paste any map link / embed code / address text above.</p>
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

      {/* MAP LOCATION PICKER MODAL */}
      {mapPickerModal && (
        <InteractiveMapModal
          initialQuery={mapSearchQuery.trim() || getDynamicMapQuery(contact)}
          contact={contact}
          onConfirm={(selectedQuery) => {
            setContact(prev => parseLocationQueryToContact(selectedQuery, prev));
            setMapPickerModal(false);
            showNotice(`Location set to "${selectedQuery}" and form fields updated! Click "Save Contact Details" to publish.`, 'success');
          }}
          onClose={() => setMapPickerModal(false)}
        />
      )}
    </div>
  );
}
