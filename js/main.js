// Main JavaScript for Dr. Raveena Thalluru Portfolio
// Handles UI Interactivity and Three.js 3D Model Rendering (Uterus Primary & Fetus Secondary)

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initPrimaryUterus3D();
  initSecondaryFetus3D();
});

// UI Event Handlers (Header, Scroll Progress, Cursor, Revealer)
function initUI() {
  // Header Scroll Effect
  const header = document.getElementById('global-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
      header?.classList.remove('bg-transparent');
    } else {
      header?.classList.remove('scrolled');
      header?.classList.add('bg-transparent');
    }
  });

  // Loader hiding
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loader = document.getElementById('loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 800);
      }

      // Initial Hero Animations
      const heroContent = document.getElementById('hero-content');
      if (heroContent) heroContent.classList.add('is-visible');
      const heroMask = heroContent?.nextElementSibling;
      if (heroMask && heroMask.classList.contains('reveal-mask')) {
        heroMask.classList.add('is-visible');
      }
    }, 500);
  });

  // Custom Cursor
  const cursorDot = document.getElementById('cursor-dot');
  const cursorFollower = document.getElementById('cursor-follower');

  if (window.matchMedia('(pointer: fine)').matches && cursorDot && cursorFollower) {
    document.addEventListener('mousemove', (e) => {
      cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      cursorFollower.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    });

    const interactives = document.querySelectorAll('.interactive-element, a, button');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Magnetic Buttons
    const magneticBtns = document.querySelectorAll('.magnetic-wrap');
    magneticBtns.forEach(wrap => {
      const btn = wrap.querySelector('.magnetic-btn');
      if (btn) {
        wrap.addEventListener('mousemove', (e) => {
          const rect = wrap.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
        });
        wrap.addEventListener('mouseleave', () => {
          btn.style.transform = 'translate(0px, 0px) scale(1)';
        });
      }
    });
  }

  // Scroll Progress Bar
  const scrollProgress = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    if (scrollProgress) {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      scrollProgress.style.width = `${scrolled}%`;
    }
  });

  // Intersection Observer for Reveal animations
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-text, .reveal-mask, .timeline-node').forEach(el => {
    if (el.id !== 'hero-content' && !el.closest('#hero-content')) {
      revealObserver.observe(el);
    }
  });
}

// -------------------------------------------------------------
// PRIMARY 3D MODEL: Uterus with Corpus Luteum (Hero Section)
// -------------------------------------------------------------
function initPrimaryUterus3D() {
  const container = document.getElementById('threejs-uterus-container');
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

  // Ambient Particles floating around Uterus
  const partGeo = new THREE.BufferGeometry();
  const partCount = 300;
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
  const loader = new THREE.GLTFLoader();

  loader.load(
    'assets/models/uterus.glb',
    (gltf) => {
      uterusModel = gltf.scene;
      
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

      const modelGroup = new THREE.Group();
      modelGroup.add(uterusModel);
      modelGroup.position.x = 0;
      scene.add(modelGroup);

      // Mouse and Scroll Interactivity
      let mouseX = 0, mouseY = 0;
      let targetX = 0, targetY = 0;

      window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      });

      const clock = new THREE.Clock();
      function animateUterus() {
        requestAnimationFrame(animateUterus);
        const time = clock.getElapsedTime();

        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        if (modelGroup) {
          modelGroup.rotation.y = time * 0.25 + targetX * 0.5;
          modelGroup.rotation.x = targetY * 0.3;
          modelGroup.position.y = Math.sin(time * 1.2) * 0.4;
        }

        particles.rotation.y = time * 0.05;

        renderer.render(scene, camera);
      }
      animateUterus();
    },
    undefined,
    (error) => {
      console.error('Error loading Uterus GLB model:', error);
    }
  );

  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth / 2;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// -------------------------------------------------------------
// SECONDARY 3D MODEL: Fetus in Womb (Interactive Section)
// -------------------------------------------------------------
function initSecondaryFetus3D() {
  const container = document.getElementById('threejs-fetus-container');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // OrbitControls for interactive 360 exploration of fetus model
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.maxDistance = 30;
  controls.minDistance = 5;

  // Lighting tailored for soft pinkish Fetus anatomical display
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffb0c9, 3.0);
  dirLight1.position.set(10, 15, 15);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xff4081, 2.0);
  dirLight2.position.set(-10, -10, -10);
  scene.add(dirLight2);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffb0c9, 2.0);
  scene.add(hemiLight);

  let fetusModel = null;
  const loader = new THREE.GLTFLoader();

  loader.load(
    'assets/models/fetus.glb',
    (gltf) => {
      fetusModel = gltf.scene;

      // Recolor fetus model to bright warm pink using MeshBasicMaterial
      fetusModel.traverse((child) => {
        if (child.isMesh || child.type === 'Mesh') {
          child.material = new THREE.MeshBasicMaterial({
            color: 0xFF80AB // Bright soft anatomical pink
          });
        }
      });

      // Umbilical cord curve starting directly from fetus belly/navel area
      const cordCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.2, -1.2, 0.4),    // Fetus belly / navel center
        new THREE.Vector3(0.8, -1.8, 1.2),    // Outward loop forward
        new THREE.Vector3(1.5, -2.6, 0.6),    // Middle curve
        new THREE.Vector3(1.2, -3.6, -0.4),   // Spiral downward
        new THREE.Vector3(0.2, -4.5, -1.2)    // Extension
      ]);

      const cordGeo = new THREE.TubeGeometry(cordCurve, 64, 0.28, 16, false);
      const cordMat = new THREE.MeshBasicMaterial({
        color: 0xD81B60 // Deeper rose pink for umbilical cord
      });

      const umbilicalCordMesh = new THREE.Mesh(cordGeo, cordMat);
      fetusModel.add(umbilicalCordMesh);

      // Auto center and scale model
      const box = new THREE.Box3().setFromObject(fetusModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 8.5 / maxDim;

      fetusModel.position.x = -center.x * scale;
      fetusModel.position.y = -center.y * scale;
      fetusModel.position.z = -center.z * scale;
      fetusModel.scale.set(scale, scale, scale);

      const fetusGroup = new THREE.Group();
      fetusGroup.add(fetusModel);
      scene.add(fetusGroup);

      const clock = new THREE.Clock();
      function animateFetus() {
        requestAnimationFrame(animateFetus);
        const time = clock.getElapsedTime();

        if (fetusGroup && !controls.state == -1) {
          fetusGroup.rotation.y = time * 0.2;
        }

        controls.update();
        renderer.render(scene, camera);
      }
      animateFetus();
    },
    undefined,
    (error) => {
      console.error('Error loading Fetus GLB model:', error);
    }
  );

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
