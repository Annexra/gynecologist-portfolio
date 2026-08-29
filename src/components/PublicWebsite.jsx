import React, { useEffect, useState } from 'react';
import { publicContentService } from '../services/contentService';
import UterusCanvas from './UterusCanvas';

export default function PublicWebsite() {
  const [profile, setProfile] = useState(null);
  const [about, setAbout] = useState(null);
  const [careAreas, setCareAreas] = useState([]);
  const [education, setEducation] = useState([]);
  const [practice, setPractice] = useState(null);
  const [patientApproach, setPatientApproach] = useState([]);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllContent() {
      try {
        const [profData, aboutData, careData, eduData, practiceData, approachData, contactData] = await Promise.all([
          publicContentService.getDoctorProfile(),
          publicContentService.getAboutContent(),
          publicContentService.getCareAreas(),
          publicContentService.getEducation(),
          publicContentService.getPracticeDetails(),
          publicContentService.getPatientApproach(),
          publicContentService.getContactDetails()
        ]);

        setProfile(profData);
        setAbout(aboutData);
        setCareAreas(careData);
        setEducation(eduData);
        setPractice(practiceData);
        setPatientApproach(approachData);
        setContact(contactData);
      } catch (err) {
        console.error('Error fetching CMS content:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllContent();

    const handleSync = () => loadAllContent();
    window.addEventListener('cms_contact_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('cms_contact_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // UI Interactive Effects & Scroll Observers
  useEffect(() => {
    if (loading) return;

    // Enable custom cursor scoping on public website
    document.body.classList.add('public-site');

    // Header Scroll Effect
    const header = document.getElementById('global-header');
    const handleScroll = () => {
      if (window.scrollY > 50) {
        header?.classList.add('scrolled');
        header?.classList.remove('bg-transparent');
      } else {
        header?.classList.remove('scrolled');
        header?.classList.add('bg-transparent');
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Custom Cursor
    const cursorDot = document.getElementById('cursor-dot');
    const cursorFollower = document.getElementById('cursor-follower');
    let handleMouseMove;

    if (window.matchMedia('(pointer: fine) and (min-width: 768px)').matches && cursorDot && cursorFollower) {
      handleMouseMove = (e) => {
        cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        cursorFollower.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      };
      document.addEventListener('mousemove', handleMouseMove);

      const interactives = document.querySelectorAll('.interactive-element, a, button');
      interactives.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
      });
    }

    // Scroll Progress Bar
    const scrollProgress = document.getElementById('scroll-progress');
    const handleProgress = () => {
      if (scrollProgress) {
        const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        scrollProgress.style.width = `${scrolled}%`;
      }
    };
    window.addEventListener('scroll', handleProgress);

    // Intersection Observer for Animations
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal-text, .reveal-mask, .timeline-node').forEach(el => {
      revealObserver.observe(el);
    });

    return () => {
      document.body.classList.remove('public-site', 'cursor-hover');
      if (handleMouseMove) document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleProgress);
    };
  }, [loading]);

  if (loading) {
    return (
      <div id="loader" className="fixed inset-0 bg-[#fff8f7] z-[99999] flex flex-col justify-center items-center gap-4">
        <div class="pulse-ring w-[70px] h-[70px] rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-primary text-3xl">favorite</span>
        </div>
        <span className="font-headline-sm text-primary text-xl">Loading Dr. Raveena Thalluru...</span>
      </div>
    );
  }

  return (
    <div id="top" className="bg-surface font-body-md text-on-surface antialiased">
      {/* Scroll Progress & Custom Cursor */}
      <div id="scroll-progress" className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-primary to-secondary-container z-[10000] w-0 transition-all duration-100" />
      <div className="hidden md:block fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2" id="cursor-dot" />
      <div className="hidden md:block fixed top-0 left-0 w-10 h-10 border border-primary/50 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 transition-all duration-300" id="cursor-follower" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 transition-all duration-500 bg-transparent" id="global-header">
        <div className="h-20 max-w-container-max mx-auto px-margin flex items-center justify-between">
          <div className="flex items-center gap-2 interactive-element">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-[20px]">medical_services</span>
            </div>
            <span className="font-headline-sm text-on-surface tracking-tight">{profile?.name || 'Dr. Raveena Thalluru'}</span>
          </div>
          <nav className="hidden lg:flex items-center gap-8">
            <a className="transition-colors text-primary font-semibold interactive-element" href="#top">Home</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element" href="#about">About</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element" href="#care-areas">Care Areas</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element" href="#education">Education</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element" href="#practice">Practice</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element" href="#approach">Approach</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element" href="#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-6">
            <a href="/admin/login" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center interactive-element" title="Admin CMS Portal">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </a>
          </div>
        </div>
      </header>

      <main className="w-full">
        <div className="flex flex-col w-full font-body-md text-on-surface bg-surface overflow-x-hidden">
          
          {/* HERO SECTION */}
          <section className="relative min-h-[100vh] flex items-center pt-24 pb-section-gap px-margin isolate overflow-hidden">
            <div className="absolute right-0 top-0 w-full lg:w-1/2 h-full z-[-1] pointer-events-auto opacity-90" id="threejs-uterus-container">
              <UterusCanvas />
            </div>
            
            <div className="w-full max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center h-full">
              <div className="lg:col-span-6 space-y-8 z-10 reveal-text" id="hero-content">
                <span className="inline-block px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container font-label-md uppercase tracking-wider text-sm shadow-sm backdrop-blur-sm bg-opacity-80">
                  {profile?.title || 'Obstetrician & Gynaecologist'} | {profile?.clinic_name || 'IVF & Fertility Care'}
                </span>
                <h1 className="font-display-lg text-on-surface text-5xl md:text-7xl lg:text-[80px] leading-[1.1]">
                  Compassionate Care. <br/>
                  <span className="text-primary italic">Advanced Fertility Solutions.</span> <br/>
                  Healthier Futures.
                </h1>
                <p className="font-body-lg text-on-surface-variant max-w-2xl text-lg md:text-xl leading-relaxed">
                  {profile?.hero_description || `${profile?.name}, ${profile?.qualifications}, providing specialized, patient-centered care at ${profile?.clinic_name}, Chennai.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <div className="magnetic-wrap">
                    <a className="inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary font-label-md rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 interactive-element magnetic-btn" href="#care-areas">
                      Explore Care Areas
                      <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ABOUT SECTION */}
          <section className="py-section-gap px-margin bg-surface-container-low relative" id="about">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-fixed opacity-50 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="w-full max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-stack-lg items-center">
              <div className="lg:col-span-5 lg:col-start-2 relative">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-md reveal-mask">
                  <img className="w-full h-full object-cover" alt={profile?.name || 'Dr. Raveena Thalluru'} src={profile?.photo_url || about?.photo_url || 'assets/dr_raveena.jpeg'} />
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg font-headline-md italic rotate-12 timeline-node">
                  RT
                </div>
              </div>
              <div className="lg:col-span-6 lg:pl-12 space-y-6 reveal-text">
                <h2 className="font-display-lg text-primary text-4xl md:text-5xl">{about?.heading || `Meet ${profile?.name || 'Dr. Raveena Thalluru'}`}</h2>
                <div className="h-1 w-20 bg-secondary rounded-full"></div>
                <p className="font-body-lg text-on-surface-variant leading-relaxed">
                  {about?.paragraph_1}
                </p>
                <p className="font-body-lg text-on-surface-variant leading-relaxed">
                  {about?.paragraph_2}
                </p>
              </div>
            </div>
          </section>

          {/* AREAS OF CARE SECTION */}
          <section className="py-section-gap px-margin bg-surface-container-low relative" id="care-areas">
            <div className="w-full max-w-container-max mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 reveal-text">
                <span className="font-label-md text-secondary uppercase tracking-widest">Specialties</span>
                <h2 className="font-display-lg text-on-surface text-4xl md:text-5xl">Areas of Care</h2>
                <p className="font-body-md text-on-surface-variant text-lg">Comprehensive reproductive and fertility services tailored to your unique journey.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {careAreas.map((area) => (
                  <div key={area.id} className="group bg-surface-container-lowest p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden interactive-element interactive-list-item timeline-node">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                    <span className="material-symbols-outlined text-4xl text-primary mb-6 block">{area.icon || 'child_care'}</span>
                    <h3 className="font-headline-sm text-on-surface mb-3 transition-transform duration-300">{area.title}</h3>
                    <p className="font-body-md text-on-surface-variant">{area.short_description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* EDUCATION & PRACTICE SECTION */}
          <section className="py-section-gap px-margin bg-surface-variant/30">
            <div className="w-full max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8" id="education">
                <div className="flex items-center gap-4 mb-8 reveal-text">
                  <span className="material-symbols-outlined text-3xl text-primary">school</span>
                  <h2 className="font-display-lg text-on-surface text-3xl md:text-4xl">Education</h2>
                </div>
                <div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-outline-variant">
                  {education.map((edu) => (
                    <div key={edu.id} className="relative timeline-node">
                      <div className="absolute -left-10 mt-1.5 w-4 h-4 rounded-full bg-primary shadow-[0_0_0_4px_rgba(181,10,83,0.2)]"></div>
                      <h3 className="font-headline-sm text-on-surface">{edu.degree}</h3>
                      <p className="font-body-md text-on-surface-variant mt-1">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-8 reveal-text" id="practice">
                <div className="flex items-center gap-4 mb-8">
                  <span className="material-symbols-outlined text-3xl text-primary">local_hospital</span>
                  <h2 className="font-display-lg text-on-surface text-3xl md:text-4xl">Current Practice</h2>
                </div>
                <div className="bg-surface p-8 rounded-3xl shadow-sm">
                  <h3 className="font-headline-md text-primary mb-2">{practice?.clinic_name || 'LIVF Fertility'}</h3>
                  <p className="font-body-md text-on-surface-variant mb-6 italic">{practice?.tagline}</p>
                  <div className="space-y-4">
                    {practice?.locations?.map((loc, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary mt-0.5">location_on</span>
                        <div>
                          <p className="font-label-md text-on-surface">{loc.name}</p>
                          <p className="font-body-sm text-on-surface-variant">{loc.city}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PATIENT APPROACH SECTION */}
          <section className="py-section-gap px-margin bg-primary text-on-primary reveal-text relative overflow-hidden" id="approach">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div className="w-[800px] h-[800px] rounded-full border-[1px] border-on-primary animate-[pulse_10s_ease-in-out_infinite]"></div>
              <div className="absolute w-[600px] h-[600px] rounded-full border-[1px] border-on-primary animate-[pulse_8s_ease-in-out_infinite_1s]"></div>
              <div className="absolute w-[400px] h-[400px] rounded-full border-[1px] border-on-primary animate-[pulse_6s_ease-in-out_infinite_2s]"></div>
            </div>
            <div className="w-full max-w-container-max mx-auto relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <h2 className="font-display-lg text-4xl md:text-5xl">Patient Approach</h2>
                <p className="font-body-md text-primary-fixed-dim text-lg">Four pillars of care guiding every patient interaction.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {patientApproach.map((item) => (
                  <div key={item.id} className="bg-on-primary-fixed/20 p-8 rounded-2xl backdrop-blur-sm hover:bg-on-primary-fixed/30 transition-colors timeline-node">
                    <div className="text-3xl font-display-lg text-primary-fixed-dim mb-4 opacity-50">{item.step_number}</div>
                    <h3 className="font-headline-sm mb-3">{item.title}</h3>
                    <p className="font-body-sm text-primary-fixed-dim">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CONTACT SECTION */}
          <section className="py-section-gap px-margin bg-surface relative overflow-hidden" id="contact">
            <div className="w-full max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-8 z-10 reveal-text">
                <h2 className="font-display-lg text-primary text-4xl md:text-5xl">{contact?.heading || 'Begin Your Journey'}</h2>
                <p className="font-body-lg text-on-surface-variant">{contact?.subheading}</p>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors interactive-element">
                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-secondary-container">call</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface-variant mb-1">Direct Lines</p>
                      {contact?.phone_numbers?.map((num, idx) => (
                        <a key={idx} className="block font-headline-sm text-on-surface hover:text-primary transition-colors" href={`tel:${num}`}>
                          {num}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors interactive-element">
                    <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-tertiary-container">map</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface-variant mb-1">Clinic Locations</p>
                      <p className="font-headline-sm text-on-surface text-lg">{contact?.locations?.join(' & ')}</p>
                      <p className="font-body-sm text-on-surface-variant">{contact?.city}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 z-10 h-96 w-full rounded-3xl overflow-hidden shadow-lg relative reveal-mask border border-outline-variant/30 group">
                {(() => {
                  let mapUrl = contact?.map_link || '';
                  if (mapUrl.includes('<iframe')) {
                    const match = mapUrl.match(/src=["']([^"']+)["']/);
                    if (match && match[1]) mapUrl = match[1];
                  }
                  
                  const isEmbed = mapUrl.includes('embed') || mapUrl.includes('maps/embed') || mapUrl.includes('output=embed');

                  // Extract location query for external link if available, fallback to full search query
                  let externalUrl = mapUrl;
                  if (isEmbed) {
                    const qParam = new URLSearchParams(mapUrl.split('?')[1] || '').get('q');
                    if (qParam) {
                      externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(qParam)}`;
                    } else {
                      externalUrl = mapUrl.replace(/(\/embed|output=embed)/g, '');
                    }
                  }
                  if (!externalUrl) {
                    externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${contact?.locations?.[0] || 'LIVF Fertility'}, ${contact?.city || 'Chennai'}`)}`;
                  }

                  return isEmbed ? (
                    <div className="w-full h-full relative">
                      <iframe
                        title="Clinic Google Map Location"
                        src={mapUrl}
                        className="w-full h-full border-0"
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer interactive-element"
                      >
                        <div className="px-5 py-2.5 bg-primary text-on-primary font-label-md rounded-2xl shadow-2xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <span className="material-symbols-outlined text-lg">open_in_new</span>
                          <span className="font-semibold tracking-wide text-xs">View Location</span>
                        </div>
                      </a>
                    </div>
                  ) : (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full h-full relative overflow-hidden interactive-element cursor-pointer"
                    >
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${contact?.map_image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ7sUBYZZGU8sNk6XdICTUPoKDWeT6Erbb7M12MD1qT7oTTkX0qfS1paLQy9s_uPaWxsqGY7KNVOA61gT8XsUjUwnRItiGVPLOarn6NldL6pFoNzY87EUPdGvChpks6IZDimOCP_EYB5vyWQoJyHr_YFIlOsCKjNTxMRlK-7pOmt4iioKDhVVmrMLPR3loQvFntt5Af_5vUGakOUK2t_wCa-xxZyT7KTZHLirr0z-p16Lo322bGraF'}')` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-300 flex items-center justify-center">
                        <div className="px-5 py-2.5 bg-primary text-on-primary font-label-md rounded-2xl shadow-2xl flex items-center gap-2 transform translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="material-symbols-outlined text-lg">near_me</span>
                          <span className="font-semibold text-xs tracking-wide font-label-md">View Location</span>
                        </div>
                      </div>
                    </a>
                  );
                })()}
              </div>
            </div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-container opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
          </section>
        </div>
      </main>

      <footer className="bg-surface-container-low border-t border-outline-variant/40 py-10 reveal-text text-sm">
        <div className="max-w-container-max mx-auto px-margin grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Doctor Info */}
          <div className="space-y-2">
            <h3 className="font-headline-sm text-primary text-base font-bold">{profile?.name || 'Dr. Raveena Thalluru'}</h3>
            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              {profile?.title || 'Consultant Gynecologist & Obstetrician'}. Providing compassionate, specialist fertility and women's health care.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="font-label-md text-xs text-on-surface uppercase font-bold tracking-wider">Contact Details</h4>
            <div className="space-y-1 text-xs text-on-surface-variant">
              {contact?.phone_numbers?.map((num, i) => (
                <p key={i} className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-primary">call</span>
                  <a href={`tel:${num}`} className="hover:text-primary transition-colors">{num}</a>
                </p>
              ))}
              {contact?.email && (
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-primary">mail</span>
                  <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors">{contact.email}</a>
                </p>
              )}
            </div>
          </div>

          {/* Current Practice Location */}
          <div className="space-y-2">
            <h4 className="font-label-md text-xs text-on-surface uppercase font-bold tracking-wider">Current Practice</h4>
            <div className="space-y-1 text-xs text-on-surface-variant">
              <p className="font-semibold text-on-surface">{practice?.clinic_name || 'LIVF Fertility'}</p>
              <p className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-primary">location_on</span>
                <span>{contact?.address_display || 'Level 4, Specialist Medical Centre'}, {contact?.city || 'Chennai'}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center font-label-md text-xs text-on-surface-variant opacity-70">
          © {new Date().getFullYear()} {profile?.name || 'Dr. Raveena Thalluru'}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
