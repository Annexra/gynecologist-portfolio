import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXPERIENCES_DATA, ATTRIBUTION_DATA } from '../data/WomensHealthLabData';

export default function WomensHealthLab() {
  const [activeExpId, setActiveExpId] = useState('anatomy');
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [hoveredStructure, setHoveredStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showAttribution, setShowAttribution] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileMinimized, setIsMobileMinimized] = useState(false);

  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelGroupRef = useRef(null);
  
  // Direct DOM references for 3D hotspots (Zero React Renders in 60FPS loop)
  const hotspotRefs = useRef({});
  const meshAnchorsRef = useRef(new Map());

  const currentExp = EXPERIENCES_DATA.find(e => e.id === activeExpId) || EXPERIENCES_DATA[0];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    setLoadProgress(0);
    setErrorMsg(null);
    setSelectedStructure(null);
    setHoveredStructure(null);
    setIsMobileMinimized(false);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Dedicated Camera Configuration per Experience
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const defaultPos = currentExp.defaultCameraPos;
    camera.position.set(defaultPos.x, defaultPos.y, defaultPos.z);
    cameraRef.current = camera;

    // Renderer with sRGB Color Management
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 30;
    controls.minDistance = 2;
    controls.autoRotate = false;
    controlsRef.current = controls;

    // Soft Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff1f2, 2.2);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9f1239, 1.2);
    fillLight.position.set(-8, -4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 1.0, 25);
    rimLight.position.set(0, 6, -6);
    scene.add(rimLight);

    // GLTFLoader + DRACOLoader setup
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);

    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);
    meshAnchorsRef.current.clear();

    loader.load(
      currentExp.modelPath,
      (gltf) => {
        const loadedModel = gltf.scene;

        // Auto center and scale model
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = (activeExpId === 'pelvis' ? 6.5 : activeExpId === 'pregnancy' ? 6.0 : 5.5) / maxDim;

        loadedModel.position.x = -center.x * scale;
        loadedModel.position.y = -center.y * scale;
        loadedModel.position.z = -center.z * scale;
        loadedModel.scale.set(scale, scale, scale);

        loadedModel.updateMatrixWorld(true);

        // Helper to match mesh or any parent node to structure (Ensures ENTIRE ORGAN turns pink)
        const findStructureForObject = (obj, structures) => {
          let curr = obj;
          while (curr && curr !== loadedModel) {
            const found = structures.find(s => s.meshNames?.includes(curr.name));
            if (found) return found;
            curr = curr.parent;
          }
          return null;
        };

        // Traverse & Store Original Material Properties
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            if (child.material) {
              child.material = child.material.clone();
              child.userData.originalColor = child.material.color.clone();
              if ('emissive' in child.material) {
                child.userData.originalEmissive = child.material.emissive.clone();
                child.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 0;
              }
            }

            // Map structure IDs to meshes (checking node or ancestor node names)
            const matchedStruct = findStructureForObject(child, currentExp.structures);
            if (matchedStruct) {
              child.userData.structureId = matchedStruct.id;

              // Register local center for dynamic mesh-anchored tracking if not set
              if (!meshAnchorsRef.current.has(matchedStruct.id)) {
                const meshBox = new THREE.Box3().setFromObject(child);
                const worldCenter = meshBox.getCenter(new THREE.Vector3());
                const localCenter = child.worldToLocal(worldCenter.clone());
                meshAnchorsRef.current.set(matchedStruct.id, { mesh: child, localCenter });
              }
            }
          }
        });

        modelGroup.add(loadedModel);
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error('Failed to load 3D model:', err);
        setErrorMsg('Unable to render 3D model. Please try again or refresh.');
        setLoading(false);
      }
    );

    // Throttled Raycasting Setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let needsRaycast = false;

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      needsRaycast = true;
    };

    const handlePointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(modelGroup.children, true);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        if (hitMesh.userData?.structureId) {
          const struct = currentExp.structures.find(s => s.id === hitMesh.userData.structureId);
          if (struct) {
            setSelectedStructure(struct);
            setIsMobileMinimized(false);
          }
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', handlePointerMove);
    domEl.addEventListener('pointerdown', handlePointerDown);

    // High-Performance 60FPS Render Loop (ZERO React Renders)
    let animId;
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Throttled Raycast Execution
      if (needsRaycast && modelGroup.children.length > 0) {
        needsRaycast = false;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(modelGroup.children, true);
        if (intersects.length > 0 && intersects[0].object.userData?.structureId) {
          const struct = currentExp.structures.find(s => s.id === intersects[0].object.userData.structureId);
          setHoveredStructure(struct || null);
          container.style.cursor = 'pointer';
        } else {
          setHoveredStructure(null);
          container.style.cursor = 'default';
        }
      }

      // DIRECT DOM HOTSPOT SCREEN PROJECTION (Dynamic Mesh-Anchored)
      meshAnchorsRef.current.forEach(({ mesh, localCenter }, structId) => {
        const el = hotspotRefs.current[structId];
        if (!el || !mesh) return;

        mesh.updateMatrixWorld(true);
        tempVec.copy(localCenter);
        mesh.localToWorld(tempVec);

        tempVec.project(camera);

        const isBehindCamera = tempVec.z > 1;
        if (isBehindCamera) {
          el.style.display = 'none';
        } else {
          const x = (tempVec.x * 0.5 + 0.5) * container.clientWidth;
          const y = (-tempVec.y * 0.5 + 0.5) * container.clientHeight;
          el.style.display = 'flex';
          el.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Controlled WebGL Resource Cleanup & Memory Disposal
    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('pointermove', handlePointerMove);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);

      controls.dispose();
      dracoLoader.dispose();

      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeExpId]);

  // Unified Consistent Color Highlight System (Highlights ENTIRE organ to vibrant pink)
  useEffect(() => {
    if (!modelGroupRef.current) return;

    modelGroupRef.current.traverse((child) => {
      if (child.isMesh && child.userData?.originalColor) {
        const isSelected = selectedStructure && child.userData.structureId === selectedStructure.id;
        const isOtherSelected = selectedStructure && child.userData.structureId !== selectedStructure.id;

        if (isSelected) {
          child.material.color.setHex(0xe11d48); // Vibrant Pink
          if ('emissive' in child.material) {
            child.material.emissive.setHex(0x9f1239);
            child.material.emissiveIntensity = 0.45;
          }
        } else if (isOtherSelected) {
          child.material.color.copy(child.userData.originalColor).multiplyScalar(0.55);
          if ('emissive' in child.material) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }
        } else {
          child.material.color.copy(child.userData.originalColor);
          if ('emissive' in child.material && child.userData.originalEmissive) {
            child.material.emissive.copy(child.userData.originalEmissive);
            child.material.emissiveIntensity = child.userData.originalEmissiveIntensity;
          }
        }
      }
    });
  }, [selectedStructure]);

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const def = currentExp.defaultCameraPos;
    cameraRef.current.position.set(def.x, def.y, def.z);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    setSelectedStructure(null);
  };

  const handleZoom = (delta) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.multiplyScalar(delta);
  };

  const toggleFullscreen = () => {
    if (!viewportRef.current) return;
    if (!document.fullscreenElement) {
      viewportRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  return (
    <section className="py-section-gap px-margin bg-surface-container-low/40 relative overflow-hidden" id="health-lab">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-fixed/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-container-max mx-auto space-y-10">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container/40 border border-primary/20 text-primary text-xs font-label-md uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Women's Health Lab</span>
            </div>
            <h2 className="font-display-lg text-on-surface text-4xl md:text-6xl font-bold tracking-tight">
              Explore. Understand. <span className="text-primary italic font-serif">Discover.</span>
            </h2>
            <p className="font-body-md text-on-surface-variant text-base md:text-lg max-w-2xl leading-relaxed pt-1">
              {currentExp.id === 'pregnancy'
                ? 'Explore how fetal position and orientation relate to maternal pelvic anatomy.'
                : 'Explore the anatomical structures behind women’s reproductive health, fertility, and wellness through an interactive, patient-friendly 3D visualization experience.'}
            </p>
          </div>

          {/* EDITORIAL EXPERIENCE SELECTOR */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-surface p-1.5 rounded-2xl border border-outline-variant/30 shadow-xs">
            {EXPERIENCES_DATA.map((exp) => {
              const isActive = exp.id === activeExpId;
              return (
                <button
                  key={exp.id}
                  onClick={() => {
                    if (exp.isAvailable) {
                      setActiveExpId(exp.id);
                    }
                  }}
                  className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 relative text-left ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-md font-semibold'
                      : exp.isAvailable
                      ? 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface cursor-pointer'
                      : 'text-on-surface-variant/40 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className={`font-mono text-xs ${isActive ? 'text-on-primary/80' : 'text-primary/60'}`}>{exp.code}</span>
                  <div>
                    <p className="text-xs uppercase font-label-md tracking-wider leading-tight">{exp.title}</p>
                    <p className={`text-[10px] font-normal mt-0.5 truncate max-w-[130px] ${isActive ? 'text-on-primary/90' : 'text-on-surface-variant/70'}`}>
                      {exp.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D VIEWER CONTAINER (RESPONSIVE MIN-HEIGHT ON MOBILE TO PREVENT OVERFLOW) */}
        <div ref={viewportRef} className="relative w-full min-h-[440px] sm:min-h-[480px] md:min-h-0 md:aspect-[16/9] rounded-3xl bg-surface/90 border border-outline-variant/30 shadow-2xl overflow-hidden group">
          
          {/* Canvas Mount */}
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Premium Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-surface/95 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-20">
              <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="text-center space-y-1.5 max-w-sm px-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary">WOMEN'S HEALTH LAB</span>
                <p className="font-display-lg text-on-surface text-lg font-semibold">
                  {activeExpId === 'pelvis'
                    ? 'Preparing pelvic anatomy & MRI scan...'
                    : activeExpId === 'pregnancy'
                    ? 'Preparing fetal position model...'
                    : 'Preparing reproductive system model...'}
                </p>
                <div className="w-48 h-1.5 bg-surface-container-highest rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-primary transition-all duration-200" style={{ width: `${loadProgress || 15}%` }} />
                </div>
                <p className="font-mono text-xs text-on-surface-variant">{loadProgress > 0 ? `${loadProgress}% loaded` : 'Initializing 3D viewer...'}</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {errorMsg && (
            <div className="absolute inset-0 bg-surface/95 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-20 p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-error">error</span>
              <p className="font-label-md text-on-surface text-sm">{errorMsg}</p>
              <button
                onClick={() => setActiveExpId('anatomy')}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold shadow-md"
              >
                Reload Experience
              </button>
            </div>
          )}

          {/* CLOSELY PLACED MESH-ANCHORED HOTSPOTS */}
          {!loading && currentExp.structures.map((struct) => {
            const isSelected = selectedStructure?.id === struct.id;
            const isHovered = hoveredStructure?.id === struct.id;

            return (
              <div
                key={struct.id}
                ref={el => hotspotRefs.current[struct.id] = el}
                onClick={() => {
                  setSelectedStructure(struct);
                  setIsMobileMinimized(false);
                }}
                className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150 z-10 hidden items-center justify-center pointer-events-auto"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#e11d48] text-white ring-4 ring-[#e11d48]/40 shadow-lg scale-110'
                    : isHovered
                    ? 'bg-[#e11d48] text-white ring-2 ring-[#e11d48]/60 scale-105'
                    : 'bg-surface/95 text-[#e11d48] border border-[#e11d48]/50 shadow-md backdrop-blur-sm'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-current" />
                </div>
              </div>
            );
          })}

          {/* 3D VIEWPORT CONTROLS TOOLBAR */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface/85 backdrop-blur-md p-1.5 rounded-2xl border border-outline-variant/30 shadow-md z-10">
            <button
              onClick={handleResetCamera}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
              title="Reset Camera Position"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
            </button>
            <button
              onClick={() => handleZoom(0.85)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
            <button
              onClick={() => handleZoom(1.15)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-xl">remove</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
              title="Fullscreen Mode"
            >
              <span className="material-symbols-outlined text-xl">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>

          {/* NON-OVERFLOWING FLEXIBLY SCROLLABLE INFORMATION SIDE PANEL */}
          {selectedStructure && (
            <div className="absolute left-3 right-3 bottom-3 md:left-auto md:right-4 md:top-4 md:bottom-auto md:max-w-md max-h-[65%] md:max-h-[85vh] flex flex-col bg-surface/95 backdrop-blur-xl p-4 md:p-6 rounded-2xl md:rounded-3xl border border-outline-variant/40 shadow-2xl z-20 transition-all duration-300">
              
              {/* Header (Shrink-0, ALWAYS visible at the top of the card) */}
              <div className="flex items-center justify-between gap-3 shrink-0 pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] md:text-[10px] font-label-md uppercase tracking-widest text-primary font-bold block">
                      Anatomical Structure
                    </span>
                    <h3 className="font-headline-sm text-on-surface text-base md:text-xl font-bold truncate">
                      {selectedStructure.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Minimize / Expand Toggle for Mobile View */}
                  <button
                    onClick={() => setIsMobileMinimized(!isMobileMinimized)}
                    className="md:hidden w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center"
                    title={isMobileMinimized ? 'Expand info panel' : 'Minimize info panel'}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isMobileMinimized ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedStructure(null)}
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm md:text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body (Flex-1, Scrollable, NEVER overflows parent container) */}
              {!isMobileMinimized && (
                <div className="flex-1 overflow-y-auto min-h-0 pt-2.5 space-y-2.5 md:space-y-3 pr-1">
                  <p className="font-body-md text-on-surface-variant text-xs md:text-sm leading-relaxed">
                    {selectedStructure.shortDesc}
                  </p>

                  {selectedStructure.whyItMatters && (
                    <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-primary-container/40 border border-primary/20 space-y-1">
                      <p className="text-[10px] md:text-xs font-semibold text-primary uppercase tracking-wider">Why It Matters</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {selectedStructure.whyItMatters}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEWPORT FOOTER INSTRUCTIONS & ATTRIBUTION LINK */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10 text-xs text-on-surface-variant/80">
            <div className="hidden sm:flex items-center gap-2 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-outline-variant/20 shadow-xs pointer-events-auto">
              <span className="material-symbols-outlined text-sm text-primary">touch_app</span>
              <span>Click structures or hotspots to explore anatomical details</span>
            </div>
            <button
              onClick={() => setShowAttribution(true)}
              className="ml-auto bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-outline-variant/20 shadow-xs text-[11px] hover:text-primary transition-colors pointer-events-auto"
            >
              3D Model Credits & Sources
            </button>
          </div>
        </div>
      </div>

      {/* ATTRIBUTION MODAL */}
      {showAttribution && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface p-6 md:p-8 rounded-3xl max-w-lg w-full border border-outline-variant/30 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                <h3 className="font-headline-sm text-on-surface text-xl font-bold">3D Model Credits & Licenses</h3>
              </div>
              <button
                onClick={() => setShowAttribution(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {ATTRIBUTION_DATA.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                  <p className="font-label-md text-sm font-semibold text-primary">{item.experience}</p>
                  <p className="text-xs text-on-surface-variant">Source: {item.source}</p>
                  <p className="text-[11px] text-secondary font-medium">{item.license}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAttribution(false)}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-xs font-semibold shadow-md"
            >
              Close Credits
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
