import React, { useEffect, useState } from 'react';
import { publicContentService, getDynamicMapQuery, getDynamicMapEmbedUrl } from '../services/contentService';
import UterusCanvas from './UterusCanvas';
import WomensHealthLab from './WomensHealthLab';

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
    window.addEventListener('cms_about_updated', handleSync);
    window.addEventListener('cms_profile_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('cms_contact_updated', handleSync);
      window.removeEventListener('cms_about_updated', handleSync);
      window.removeEventListener('cms_profile_updated', handleSync);
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
          <a href="#about" className="flex items-center gap-3 interactive-element cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm group-hover:bg-primary group-hover:text-on-primary transition-all">
              <span className="material-symbols-outlined text-xl">stethoscope</span>
            </div>
            <div>
              <span className="font-headline-sm text-on-surface tracking-tight block text-base font-semibold group-hover:text-primary transition-colors">{profile?.name || 'Dr. Raveena Thalluru'}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block font-medium">Obstetrician & Gynecologist</span>
            </div>
          </a>
          <nav className="hidden lg:flex items-center gap-8">
            <a className="transition-colors text-primary font-semibold interactive-element text-sm" href="#top">Home</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element text-sm" href="#about">About</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element text-sm" href="#care-areas">Care Areas</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element text-sm" href="#health-lab">Health Lab</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element text-sm" href="#education">Education</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element text-sm" href="#practice">Practice</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element text-sm" href="#approach">Approach</a>
            <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors interactive-element text-sm" href="#contact">Contact</a>
          </nav>
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
              <div className="lg:col-span-6 space-y-8 z-10 reveal-text p-4 sm:p-6 lg:p-0 rounded-3xl bg-gradient-to-r from-surface/90 via-surface/75 to-transparent lg:bg-none backdrop-blur-[2px] lg:backdrop-blur-none" id="hero-content">
                <span className="inline-block px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container font-label-md uppercase tracking-wider text-xs font-semibold shadow-sm backdrop-blur-sm bg-opacity-80">
                  {profile?.title || 'Obstetrician & Gynaecologist'} | {profile?.clinic_name || 'IVF & Fertility Care'}
                </span>
                <h1 className="font-display-lg text-on-surface text-5xl md:text-7xl lg:text-[76px] leading-[1.08] tracking-tight">
                  Compassionate Care. <br/>
                  <span className="text-primary italic font-serif">Advanced Fertility Solutions.</span> <br/>
                  Healthier Futures.
                </h1>
                <p className="font-body-lg text-on-surface-variant max-w-2xl text-lg md:text-xl leading-relaxed">
                  {profile?.hero_description || `${profile?.name}, ${profile?.qualifications}, providing specialized, patient-centered care at ${profile?.clinic_name}, Chennai.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <div className="magnetic-wrap">
                    <a className="inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary font-label-md rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 interactive-element magnetic-btn font-semibold text-sm" href="#care-areas">
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-fixed opacity-40 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="w-full max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-stack-lg items-center">
              <div className="lg:col-span-5 lg:col-start-2 relative">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-xl reveal-mask border border-outline-variant/30">
                  <img className="w-full h-full object-cover" alt={profile?.name || 'Dr. Raveena Thalluru'} src={about?.photo_url || profile?.photo_url || 'assets/dr_raveena.jpeg'} />
                </div>
                {/* BRAND SIGNATURE SYMBOL EMBLEM */}
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary text-on-primary rounded-full flex flex-col items-center justify-center shadow-xl brand-signature cursor-pointer timeline-node interactive-element">
                  <span className="material-symbols-outlined text-2xl">stethoscope</span>
                  <span className="text-[9px] font-label-md tracking-wider uppercase font-bold mt-0.5">Care</span>
                </div>
              </div>
              <div className="lg:col-span-6 lg:pl-12 space-y-6 reveal-text">
                <span className="font-label-md text-secondary uppercase tracking-widest text-xs font-semibold">About Doctor</span>
                <h2 className="font-display-lg text-primary text-4xl md:text-5xl">{about?.heading || `Meet ${profile?.name || 'Dr. Raveena Thalluru'}`}</h2>
                <div className="h-1 w-20 bg-secondary rounded-full"></div>
                <p className="font-body-lg text-on-surface-variant leading-relaxed text-lg">
                  {about?.paragraph_1}
                </p>
                <p className="font-body-lg text-on-surface-variant leading-relaxed text-base">
                  {about?.paragraph_2}
                </p>
              </div>
            </div>
          </section>

          {/* AREAS OF CARE SECTION — EDITORIAL INTERACTIVE LIST */}
          <section className="py-section-gap px-margin bg-surface relative" id="care-areas">
            <div className="w-full max-w-container-max mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 reveal-text">
                <div>
                  <span className="font-label-md text-secondary uppercase tracking-widest text-xs font-semibold">Specialized Expertise</span>
                  <h2 className="font-display-lg text-on-surface text-4xl md:text-5xl mt-2">Areas of Care</h2>
                </div>
                <p className="font-body-md text-on-surface-variant text-base max-w-md">
                  Comprehensive reproductive & fertility services tailored thoughtfully to your unique path to parenthood.
                </p>
              </div>

              {/* EDITORIAL INTERACTIVE LIST */}
              <div className="space-y-3 care-editorial-container">
                {careAreas.map((area, idx) => (
                  <div
                    key={area.id || idx}
                    className="care-editorial-item py-6 px-6 md:px-8 rounded-2xl bg-surface-container-low/60 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-6 interactive-element group cursor-pointer timeline-node"
                    style={{ transitionDelay: `${idx * 70}ms` }}
                  >
                    <div className="flex items-start md:items-center gap-6 w-full">
                      <span className="font-mono text-xl md:text-2xl font-bold text-primary/40 group-hover:text-primary transition-all duration-300 care-number">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 shadow-sm">
                        {/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]/u.test(area.icon || '') ? (
                          <span className="text-2xl">{area.icon}</span>
                        ) : (
                          <span className="material-symbols-outlined text-2xl">{area.icon || 'child_care'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-headline-sm text-on-surface text-xl md:text-2xl font-semibold transition-all duration-300 care-title">
                          {area.title}
                        </h3>
                        <p className="font-body-md text-on-surface-variant text-sm md:text-base mt-1 max-w-3xl leading-relaxed">
                          {area.short_description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* WOMEN'S HEALTH LAB INTERACTIVE 3D EXPERIENCE */}
          <WomensHealthLab />

          {/* EDUCATION & PRACTICE SECTION — JOURNEY & LAYERED DEPTH */}
          <section className="py-section-gap px-margin bg-surface-container-low border-y border-outline-variant/30">
            <div className="w-full max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              
              {/* EDUCATION JOURNEY TIMELINE */}
              <div className="lg:col-span-6 space-y-8" id="education">
                <div className="flex items-center gap-4 reveal-text">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-2xl">school</span>
                  </div>
                  <div>
                    <span className="font-label-md text-secondary uppercase tracking-widest text-xs font-semibold">Academic Foundation</span>
                    <h2 className="font-display-lg text-on-surface text-3xl md:text-4xl font-bold">Education & Medical Training</h2>
                  </div>
                </div>

                <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-secondary before:to-primary/20">
                  {education.map((edu, index) => (
                    <div 
                      key={edu.id || index} 
                      className="relative timeline-node group"
                      style={{ transitionDelay: `${index * 120}ms` }}
                    >
                      <div className="absolute -left-8 top-4 w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20 group-hover:ring-primary/50 group-hover:scale-125 transition-all duration-300 shadow-md" />
                      <div className="p-6 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:shadow-md transition-all duration-300 space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="inline-block px-3 py-1 rounded-full bg-primary-container/60 text-primary text-xs font-bold font-label-md uppercase tracking-wider">
                            {edu.degree}
                          </span>
                          <span className="text-xs text-on-surface-variant font-mono uppercase tracking-wider font-medium">
                            {index === 0 ? 'Medical Foundation' : 'Specialization'}
                          </span>
                        </div>
                        <h3 className="font-headline-sm text-on-surface text-xl font-bold">{edu.degree}</h3>
                        <p className="font-body-md text-on-surface-variant text-sm flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">account_balance</span>
                          <span>{edu.institution}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CURRENT PRACTICE LAYERED COMPOSITION */}
              <div className="lg:col-span-6 space-y-8 reveal-text" id="practice">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container/60 text-secondary flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-2xl">local_hospital</span>
                  </div>
                  <div>
                    <span className="font-label-md text-secondary uppercase tracking-widest text-xs font-semibold">Clinical Presence</span>
                    <h2 className="font-display-lg text-on-surface text-3xl md:text-4xl font-bold">Current Practice</h2>
                  </div>
                </div>

                <div className="bg-surface p-8 rounded-3xl border border-outline-variant/40 shadow-lg relative overflow-hidden layered-card timeline-node">
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                  <span className="inline-block px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                    Active Clinical Center
                  </span>
                  <h3 className="font-display-lg text-primary text-3xl font-bold mb-2">{practice?.clinic_name || 'LIVF Fertility'}</h3>
                  <p className="font-body-md text-on-surface-variant mb-6 text-sm italic">{practice?.tagline}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {practice?.locations?.map((loc, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1 hover:border-primary/40 hover:bg-surface transition-all duration-300 shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          <span>{loc.name || 'Chennai Center'}</span>
                        </div>
                        <p className="font-body-sm text-on-surface text-sm font-semibold">{loc.city || 'Chennai'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* PATIENT APPROACH SECTION — HUMAN 4 PILLARS */}
          <section 
            className="py-section-gap px-margin bg-primary text-on-primary reveal-text relative overflow-hidden isolate" 
            id="approach"
            onMouseEnter={() => document.body.classList.add('cursor-on-dark')}
            onMouseLeave={() => document.body.classList.remove('cursor-on-dark')}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none overflow-hidden">
              <div className="w-[min(90vw,700px)] aspect-square rounded-full border border-on-primary animate-[pulse_10s_ease-in-out_infinite] flex-shrink-0" />
              <div className="absolute w-[min(65vw,500px)] aspect-square rounded-full border border-on-primary animate-[pulse_8s_ease-in-out_infinite_1.5s] flex-shrink-0" />
              <div className="absolute w-[min(40vw,300px)] aspect-square rounded-full border border-on-primary animate-[pulse_6s_ease-in-out_infinite_3s] flex-shrink-0" />
            </div>
            
            <div className="w-full max-w-container-max mx-auto relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <span className="font-label-md text-on-primary-container uppercase tracking-widest text-xs font-semibold opacity-90">Philosophy of Care</span>
                <h2 className="font-display-lg text-4xl md:text-5xl font-bold">Patient Approach</h2>
                <p className="font-body-md text-primary-fixed-dim text-lg">Four guiding pillars ensuring confidential, empathetic, and personalized clinical care.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {patientApproach.map((item, idx) => (
                  <div 
                    key={item.id || idx} 
                    className="bg-on-primary-fixed/15 p-8 rounded-3xl border border-on-primary/10 backdrop-blur-md hover:bg-on-primary-fixed/25 hover:border-on-primary/30 transition-all duration-300 timeline-node space-y-4 shadow-lg hover:-translate-y-1"
                    style={{ transitionDelay: `${idx * 100}ms` }}
                  >
                    <div className="text-2xl font-mono font-bold text-primary-fixed-dim opacity-70">
                      0{item.step_number || idx + 1}
                    </div>
                    <h3 className="font-headline-sm text-xl font-bold text-on-primary">{item.title}</h3>
                    <p className="font-body-sm text-primary-fixed-dim text-sm leading-relaxed">{item.description}</p>
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
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors interactive-element border border-outline-variant/30">
                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-secondary-container">call</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface-variant mb-1 text-xs uppercase font-semibold">Direct Lines</p>
                      {contact?.phone_numbers?.map((num, idx) => (
                        <a key={idx} className="block font-headline-sm text-on-surface hover:text-primary transition-colors text-base font-bold" href={`tel:${num}`}>
                          {num}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors interactive-element border border-outline-variant/30">
                    <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-tertiary-container">map</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface-variant mb-1 text-xs uppercase font-semibold">Clinic Locations</p>
                      <p className="font-headline-sm text-on-surface text-base font-bold">
                        {Array.isArray(contact?.locations) 
                          ? contact.locations.filter(l => typeof l === 'string' && !l.includes('http')).join(' & ') || 'Perungudi & T. Nagar'
                          : 'Perungudi & T. Nagar'}
                      </p>
                      <p className="font-body-sm text-on-surface-variant text-xs">
                        {(contact?.city && !contact.city.includes('http')) ? contact.city : 'Chennai, Tamil Nadu'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 z-10 h-96 w-full rounded-3xl overflow-hidden shadow-xl relative reveal-mask border border-outline-variant/30 group">
                {(() => {
                  let rawMapUrl = contact?.map_link || '';
                  if (rawMapUrl.includes('<iframe')) {
                    const match = rawMapUrl.match(/src=["']([^"']+)["']/);
                    if (match && match[1]) rawMapUrl = match[1];
                  }

                  const dynamicQuery = getDynamicMapQuery(contact);
                  const dynamicEmbedUrl = getDynamicMapEmbedUrl(contact);

                  let embedSrc = '';
                  let externalUrl = '';

                  if (rawMapUrl) {
                    if (rawMapUrl.includes('embed') || rawMapUrl.includes('output=embed') || rawMapUrl.includes('openstreetmap.org')) {
                      embedSrc = rawMapUrl;
                      const qParam = new URLSearchParams(rawMapUrl.split('?')[1] || '').get('q');
                      if (qParam) {
                        externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(qParam)}`;
                      } else {
                        externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dynamicQuery)}`;
                      }
                    } else if (rawMapUrl.startsWith('http://') || rawMapUrl.startsWith('https://')) {
                      externalUrl = rawMapUrl;
                      embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(rawMapUrl)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                    } else {
                      embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(rawMapUrl)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                      externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawMapUrl)}`;
                    }
                  } else {
                    embedSrc = dynamicEmbedUrl;
                    externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dynamicQuery)}`;
                  }

                  return (
                    <div className="w-full h-full relative">
                      <iframe
                        title="Clinic Google Map Location"
                        src={embedSrc}
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
                          <span className="font-semibold tracking-wide text-xs font-label-md">View Location</span>
                        </div>
                      </a>
                    </div>
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
                <span>
                  {(contact?.address_display && !contact.address_display.includes('http')) ? contact.address_display : 'Level 4, Specialist Medical Centre'}, {(contact?.city && !contact.city.includes('http')) ? contact.city : 'Chennai'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM BAR WITH SUBTLE DISCREET ADMIN UTILITY LINK */}
        <div className="mt-8 pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-container-max mx-auto px-margin font-label-md text-xs text-on-surface-variant opacity-80">
          <div>
            © {new Date().getFullYear()} {profile?.name || 'Dr. Raveena Thalluru'}. All rights reserved.
          </div>
          <div>
            <a
              href="/admin/login"
              className="hover:text-primary transition-colors text-on-surface-variant/70 hover:underline decoration-primary/40 underline-offset-4"
            >
              Admin Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
