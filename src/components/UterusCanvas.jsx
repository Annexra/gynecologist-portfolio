import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function UterusCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth / 2;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffb0c9, 2.5);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xb50a53, 1.8);
    dirLight2.position.set(-10, -10, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 30);
    pointLight.position.set(0, 5, 10);
    scene.add(pointLight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // Ambient Particles floating around Uterus
    const partGeo = new THREE.BufferGeometry();
    const partCount = isMobile ? 120 : (prefersReducedMotion ? 100 : 300);
    const posArray = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 25;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const partMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xfe97b9,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    let uterusModel = null;
    let modelGroup = null;
    const loader = new GLTFLoader();

    loader.load(
      'assets/models/uterus.glb',
      (gltf) => {
        uterusModel = gltf.scene;
        // Apply rich vibrant medical pink/rose material styling to meshes
        uterusModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              // Enhance material color, roughness, metalness, and emissive glow
              child.material.color = new THREE.Color(0xf472b6); // Vibrant rose pink
              if ('roughness' in child.material) child.material.roughness = 0.35;
              if ('metalness' in child.material) child.material.metalness = 0.15;
              if ('emissive' in child.material) {
                child.material.emissive = new THREE.Color(0x9d174d); // Warm deep pink glow
                child.material.emissiveIntensity = 0.25;
              }
            }
          }
        });

        // Auto center and scale model bounding box
        const box = new THREE.Box3().setFromObject(uterusModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10 / maxDim;

        uterusModel.position.x = -center.x * scale;
        uterusModel.position.y = -center.y * scale;
        uterusModel.position.z = -center.z * scale;
        uterusModel.scale.set(scale, scale, scale);

        modelGroup = new THREE.Group();
        modelGroup.add(uterusModel);
        modelGroup.position.x = 0;
        scene.add(modelGroup);
      },
      undefined,
      (error) => {
        console.error('Error loading Uterus GLB model:', error);
      }
    );

    // Mouse and Scroll Interactivity
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    const handleMouseMove = (e) => {
      if (prefersReducedMotion) return;
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();
    let animationFrameId;

    function animateUterus() {
      animationFrameId = requestAnimationFrame(animateUterus);
      const time = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        if (modelGroup) {
          modelGroup.rotation.y = time * 0.25 + targetX * 0.5;
          modelGroup.rotation.x = targetY * 0.3;
          modelGroup.position.y = Math.sin(time * 1.2) * 0.4;
        }

        particles.rotation.y = time * 0.05;
      } else if (modelGroup) {
        modelGroup.rotation.y = time * 0.05;
      }

      renderer.render(scene, camera);
    }
    animateUterus();

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth / 2;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative" aria-hidden="true">
      {/* Reduced motion or WebGL fallback visual */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none -z-10">
        <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-primary/30 to-secondary-container/40 blur-2xl animate-pulse" />
      </div>
    </div>
  );
}
