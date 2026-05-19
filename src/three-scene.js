// IssamOS - Three.js WebGL Graphics System
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ThreeGraphicsManager {
  constructor() {
    this.bgCanvas = document.getElementById('bg-canvas');
    this.activeRenders = {}; // Map of active renders: { canvasId: { renderer, scene, camera, controls, animateId, cleanupFn } }
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.initBackground();
    this.initGlobalBinds();
  }

  // Create a procedurally generated soft radial particle texture
  createCircularParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(0, 242, 254, 0.8)');
    grad.addColorStop(0.7, 'rgba(189, 0, 255, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  }

  /* --------------------------------------------------
     Background Space / Starfield Scene
  -------------------------------------------------- */
  initBackground() {
    this.bgScene = new THREE.Scene();
    this.bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.bgCamera.position.z = 30;

    this.bgRenderer = new THREE.WebGLRenderer({
      canvas: this.bgCanvas,
      antialias: true,
      alpha: true
    });
    this.bgRenderer.setSize(window.innerWidth, window.innerHeight);
    this.bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Generate Stars Particle System
    const starsCount = 1500;
    const starsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);

    const colorCyan = new THREE.Color('#00f2fe');
    const colorMagenta = new THREE.Color('#bd00ff');
    const colorWhite = new THREE.Color('#ffffff');

    for (let i = 0; i < starsCount * 3; i += 3) {
      // Random coordinates in space cube
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;

      // Color distribution (mostly white/cyan stars, occasional purple/magenta)
      let mixedColor = colorWhite.clone();
      const rand = Math.random();
      if (rand < 0.3) {
        mixedColor.lerp(colorCyan, Math.random());
      } else if (rand < 0.5) {
        mixedColor.lerp(colorMagenta, Math.random());
      }
      
      colors[i] = mixedColor.r;
      colors[i + 1] = mixedColor.g;
      colors[i + 2] = mixedColor.b;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Material with custom circular texture
    const starTexture = this.createCircularParticleTexture();
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.25,
      map: starTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.bgStars = new THREE.Points(starsGeometry, starsMaterial);
    this.bgScene.add(this.bgStars);

    // Mouse drift listeners
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      this.mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    });

    // Animate background
    const animateBg = () => {
      requestAnimationFrame(animateBg);

      // Rotate starfield slowly
      this.bgStars.rotation.y += 0.0008;
      this.bgStars.rotation.x += 0.0003;

      // Parallax effect using mouse coordinates
      const targetCameraX = this.mouseX * 3;
      const targetCameraY = -this.mouseY * 3;
      
      this.bgCamera.position.x += (targetCameraX - this.bgCamera.position.x) * 0.05;
      this.bgCamera.position.y += (targetCameraY - this.bgCamera.position.y) * 0.05;
      this.bgCamera.lookAt(this.bgScene.position);

      this.bgRenderer.render(this.bgScene, this.bgCamera);
    };
    animateBg();

    // Resize listener
    window.addEventListener('resize', () => {
      this.bgCamera.aspect = window.innerWidth / window.innerHeight;
      this.bgCamera.updateProjectionMatrix();
      this.bgRenderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initGlobalBinds() {
    // Listen to custom project 3D load triggers
    window.addEventListener('project-3d-init', (e) => {
      const { win, projectId, canvasId, modelType } = e.detail;
      this.initProjectCanvas(win, projectId, canvasId, modelType);
    });

    // Listen to custom sandbox loads
    window.addEventListener('sandbox-init', (e) => {
      const { win } = e.detail;
      this.initSandboxCanvas(win);
    });

    // Window size changed trigger
    window.addEventListener('window-resized', (e) => {
      const { appId } = e.detail;
      this.handleAppResize(appId);
    });

    // Window closed trigger
    window.addEventListener('window-closed', (e) => {
      const { appId } = e.detail;
      this.cleanupAppRenders(appId);
    });
  }

  handleAppResize(appId) {
    // Find active canvas matching app window
    for (const [canvasId, renderObj] of Object.entries(this.activeRenders)) {
      if (renderObj.appId === appId) {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
          const container = canvas.parentElement;
          const width = container.clientWidth;
          const height = container.clientHeight;
          
          renderObj.camera.aspect = width / height;
          renderObj.camera.updateProjectionMatrix();
          renderObj.renderer.setSize(width, height);
        }
      }
    }
  }

  cleanupAppRenders(appId) {
    for (const [canvasId, renderObj] of Object.entries(this.activeRenders)) {
      if (renderObj.appId === appId) {
        // Stop animation loop
        cancelAnimationFrame(renderObj.animateId);
        
        // Custom cleanup hook
        if (renderObj.cleanupFn) renderObj.cleanupFn();

        // Dispose elements
        renderObj.controls.dispose();
        renderObj.renderer.dispose();
        
        // Remove from memory
        delete this.activeRenders[canvasId];
      }
    }
  }

  /* --------------------------------------------------
     Projects 3D Component Models
  -------------------------------------------------- */
  initProjectCanvas(win, projectId, canvasId, modelType) {
    const canvas = win.querySelector(`#${canvasId}`);
    const container = canvas.parentElement;
    
    // Clear any previous loops on the same canvas target
    if (this.activeRenders[canvasId]) {
      cancelAnimationFrame(this.activeRenders[canvasId].animateId);
      delete this.activeRenders[canvasId];
    }

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.maxDistance = 15;
    controls.minDistance = 3;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0x00f2fe, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xbd00ff, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    let mainObject = new THREE.Group();
    let cleanupFn = null;

    /* --- GLOBE MODEL --- */
    if (modelType === 'globe') {
      // 1. Solid wireframe sphere
      const sphereGeom = new THREE.SphereGeometry(2, 24, 24);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const wireSphere = new THREE.Mesh(sphereGeom, wireMat);
      mainObject.add(wireSphere);

      // 2. Glowing points representing nodes
      const pointsGeom = new THREE.SphereGeometry(2.02, 16, 16);
      const particleTexture = this.createCircularParticleTexture();
      const pointsMat = new THREE.PointsMaterial({
        size: 0.15,
        map: particleTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: 0x00f2fe
      });
      const glowPoints = new THREE.Points(pointsGeom, pointsMat);
      mainObject.add(glowPoints);

      // 3. Draw connection arcs on the globe
      const arcGroup = new THREE.Group();
      const numArcs = 8;
      const arcCurves = [];

      for (let i = 0; i < numArcs; i++) {
        // Generate random pairs of vectors on the sphere surface
        const v1 = new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        ).normalize().multiplyScalar(2);

        const v2 = new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        ).normalize().multiplyScalar(2);

        // Control point located above the midpoint for a nice bezier arch
        const midPoint = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        const midLength = midPoint.length();
        midPoint.normalize().multiplyScalar(midLength + 0.8 + Math.random() * 0.4);

        const curve = new THREE.QuadraticBezierCurve3(v1, midPoint, v2);
        arcCurves.push(curve);

        const points = curve.getPoints(30);
        const arcGeom = new THREE.BufferGeometry().setFromPoints(points);
        const arcMat = new THREE.LineBasicMaterial({
          color: 0xbd00ff,
          transparent: true,
          opacity: 0.4
        });
        const arcLine = new THREE.Line(arcGeom, arcMat);
        arcGroup.add(arcLine);
      }
      mainObject.add(arcGroup);

      // Glowing dots sliding along curves
      const dotGroup = new THREE.Group();
      const dotsData = [];
      
      arcCurves.forEach(curve => {
        const dotGeom = new THREE.SphereGeometry(0.04, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const dotMesh = new THREE.Mesh(dotGeom, dotMat);
        dotGroup.add(dotMesh);
        
        dotsData.push({
          mesh: dotMesh,
          curve: curve,
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.008
        });
      });
      mainObject.add(dotGroup);

      scene.add(mainObject);

      cleanupFn = () => {
        sphereGeom.dispose();
        wireMat.dispose();
        pointsGeom.dispose();
        pointsMat.dispose();
        dotGroup.children.forEach(dot => {
          dot.geometry.dispose();
          dot.material.dispose();
        });
        arcGroup.children.forEach(line => {
          line.geometry.dispose();
          line.material.dispose();
        });
      };

      // Custom animate cycle update for dot positions
      var customUpdate = () => {
        mainObject.rotation.y += 0.006;
        mainObject.rotation.x += 0.002;
        
        dotsData.forEach(d => {
          d.progress += d.speed;
          if (d.progress > 1) d.progress = 0;
          
          const pos = d.curve.getPointAt(d.progress);
          d.mesh.position.copy(pos);
        });
      };
    }

    /* --- NODES MODEL --- */
    else if (modelType === 'nodes') {
      const nodeCount = 20;
      const nodes = [];
      const nodeGeom = new THREE.SphereGeometry(0.12, 12, 12);
      const nodeMat = new THREE.MeshPhongMaterial({
        color: 0xbd00ff,
        emissive: 0x3d0066,
        shininess: 30
      });

      // Construct nodes at floating points
      for (let i = 0; i < nodeCount; i++) {
        const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
        nodeMesh.position.set(
          (Math.random() - 0.5) * 4.5,
          (Math.random() - 0.5) * 4.5,
          (Math.random() - 0.5) * 4.5
        );
        nodeMesh.userData = {
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.015,
            (Math.random() - 0.5) * 0.015,
            (Math.random() - 0.5) * 0.015
          )
        };
        mainObject.add(nodeMesh);
        nodes.push(nodeMesh);
      }

      // Connect nodes dynamically if close
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.35
      });
      let lineSegments = null;

      scene.add(mainObject);

      cleanupFn = () => {
        nodeGeom.dispose();
        nodeMat.dispose();
        lineMaterial.dispose();
        if (lineSegments) lineSegments.geometry.dispose();
      };

      customUpdate = () => {
        // Drift nodes in bounds
        nodes.forEach(node => {
          node.position.add(node.userData.velocity);
          
          // Bounce boundary checks
          if (Math.abs(node.position.x) > 2.2) node.userData.velocity.x *= -1;
          if (Math.abs(node.position.y) > 2.2) node.userData.velocity.y *= -1;
          if (Math.abs(node.position.z) > 2.2) node.userData.velocity.z *= -1;
        });

        // Regenerate connection lines
        if (lineSegments) {
          mainObject.remove(lineSegments);
          lineSegments.geometry.dispose();
        }

        const linePositions = [];
        const maxDist = 1.8;

        for (let i = 0; i < nodeCount; i++) {
          for (let j = i + 1; j < nodeCount; j++) {
            const dist = nodes[i].position.distanceTo(nodes[j].position);
            if (dist < maxDist) {
              linePositions.push(
                nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
                nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
              );
            }
          }
        }

        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        lineSegments = new THREE.LineSegments(lineGeom, lineMaterial);
        mainObject.add(lineSegments);

        mainObject.rotation.y += 0.003;
      };
    }

    /* --- CYBER-CORE MODEL --- */
    else if (modelType === 'core') {
      // 1. Central Torus Knot
      const coreGeom = new THREE.TorusKnotGeometry(1.2, 0.35, 100, 16);
      const coreMat = new THREE.MeshPhongMaterial({
        color: 0xbd00ff,
        emissive: 0x22003c,
        shininess: 80,
        wireframe: true
      });
      const knot = new THREE.Mesh(coreGeom, coreMat);
      mainObject.add(knot);

      // 2. Multi-axis orbital rings
      const rings = [];
      const colors = [0x00f2fe, 0xff9f1c];
      
      for (let i = 0; i < 2; i++) {
        const ringGeom = new THREE.TorusGeometry(2.3 + i * 0.2, 0.03, 8, 64);
        const ringMat = new THREE.MeshBasicMaterial({ 
          color: colors[i],
          transparent: true,
          opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.y = Math.random() * Math.PI;
        mainObject.add(ring);
        rings.push({
          mesh: ring,
          speedX: 0.01 + i * 0.005,
          speedY: 0.005 + i * 0.008
        });
      }

      scene.add(mainObject);

      cleanupFn = () => {
        coreGeom.dispose();
        coreMat.dispose();
        rings.forEach(r => {
          r.mesh.geometry.dispose();
          r.mesh.material.dispose();
        });
      };

      customUpdate = () => {
        knot.rotation.x += 0.012;
        knot.rotation.y += 0.008;

        rings.forEach(r => {
          r.mesh.rotation.x += r.speedX;
          r.mesh.rotation.y += r.speedY;
        });
      };
    }

    // Animation Loop
    const animate = () => {
      const animateId = requestAnimationFrame(animate);
      this.activeRenders[canvasId].animateId = animateId;

      controls.update();
      if (customUpdate) customUpdate();

      renderer.render(scene, camera);
    };

    // Store in active renders
    this.activeRenders[canvasId] = {
      appId: 'projects',
      renderer,
      scene,
      camera,
      controls,
      animateId: 0,
      cleanupFn
    };

    animate();
  }

  /* --------------------------------------------------
     3D CAD Sandbox Application
  -------------------------------------------------- */
  initSandboxCanvas(win) {
    const canvas = win.querySelector('#sandbox-canvas');
    const container = canvas.parentElement;
    const canvasId = 'sandbox-canvas';

    if (this.activeRenders[canvasId]) {
      cancelAnimationFrame(this.activeRenders[canvasId].animateId);
      delete this.activeRenders[canvasId];
    }

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xffffff, 1.5, 100);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    // Initial parameters (State)
    let state = {
      geomType: 'torusKnot',
      renderMode: 'glowing',
      speedMultiplier: 1.0,
      colorCode: '#00f2fe',
      autoOrbit: true
    };

    let activeMesh = null;

    // Helper to generate geometry
    const getGeometry = (type) => {
      if (type === 'torusKnot') return new THREE.TorusKnotGeometry(1.0, 0.3, 120, 16);
      if (type === 'sphere') return new THREE.SphereGeometry(1.3, 32, 32);
      if (type === 'box') return new THREE.BoxGeometry(1.6, 1.6, 1.6, 10, 10, 10);
      if (type === 'octahedron') return new THREE.OctahedronGeometry(1.4, 0);
      return new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    };

    // Helper to generate material
    const getMaterial = (mode, color) => {
      const col = new THREE.Color(color);
      if (mode === 'glowing') {
        return new THREE.MeshPhongMaterial({
          color: col,
          emissive: col.clone().multiplyScalar(0.2),
          shininess: 100,
          specular: 0xffffff
        });
      }
      if (mode === 'wireframe') {
        return new THREE.MeshBasicMaterial({
          color: col,
          wireframe: true
        });
      }
      return new THREE.PointsMaterial({
        size: 0.05,
        color: col,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
    };

    // Refresh model render
    const updateModel = () => {
      if (activeMesh) {
        scene.remove(activeMesh);
        activeMesh.geometry.dispose();
        if (activeMesh.material.dispose) activeMesh.material.dispose();
      }

      const geom = getGeometry(state.geomType);
      const mat = getMaterial(state.renderMode, state.colorCode);

      if (state.renderMode === 'points') {
        activeMesh = new THREE.Points(geom, mat);
      } else {
        activeMesh = new THREE.Mesh(geom, mat);
      }

      scene.add(activeMesh);
    };

    updateModel();

    // Bind Sandbox DOM inputs
    const geomSelect = win.querySelector('#sandbox-geom');
    const modeSelect = win.querySelector('#sandbox-mode');
    const speedSlider = win.querySelector('#sandbox-speed');
    const colorSelect = win.querySelector('#sandbox-color');
    const orbitBtn = win.querySelector('#sandbox-auto-rotate');
    const resetBtn = win.querySelector('#sandbox-reset');

    const updateSpeedLabel = (val) => {
      win.querySelector('#val-speed').innerText = `${parseFloat(val).toFixed(1)}x`;
    };

    geomSelect.addEventListener('change', (e) => {
      state.geomType = e.target.value;
      updateModel();
    });

    modeSelect.addEventListener('change', (e) => {
      state.renderMode = e.target.value;
      updateModel();
    });

    speedSlider.addEventListener('input', (e) => {
      state.speedMultiplier = parseFloat(e.target.value);
      updateSpeedLabel(state.speedMultiplier);
    });

    colorSelect.addEventListener('change', (e) => {
      state.colorCode = e.target.value;
      updateModel();
    });

    orbitBtn.addEventListener('click', () => {
      state.autoOrbit = !state.autoOrbit;
      orbitBtn.classList.toggle('active', !state.autoOrbit);
      orbitBtn.innerText = state.autoOrbit ? 'Auto Orbit: ON' : 'Auto Orbit: OFF';
    });

    resetBtn.addEventListener('click', () => {
      controls.reset();
      camera.position.set(0, 0, 6);
      speedSlider.value = 1.0;
      state.speedMultiplier = 1.0;
      updateSpeedLabel(1.0);
    });

    // Clean up callback when app closes
    cleanupFn = () => {
      if (activeMesh) {
        activeMesh.geometry.dispose();
        activeMesh.material.dispose();
      }
      ambientLight.dispose();
      mainLight.dispose();
    };

    // Anim loop
    const animate = () => {
      const animateId = requestAnimationFrame(animate);
      this.activeRenders[canvasId].animateId = animateId;

      controls.update();

      if (activeMesh) {
        const speed = 0.008 * state.speedMultiplier;
        activeMesh.rotation.y += speed;
        activeMesh.rotation.x += speed * 0.5;
      }

      if (state.autoOrbit) {
        // Orbit camera around target slowly if controls are idle
        const time = Date.now() * 0.0003;
        if (!controls.state === -1) { // -1 means idle in OrbitControls
          camera.position.x = Math.sin(time) * 6;
          camera.position.z = Math.cos(time) * 6;
          camera.lookAt(scene.position);
        }
      }

      renderer.render(scene, camera);
    };

    this.activeRenders[canvasId] = {
      appId: 'viewer',
      renderer,
      scene,
      camera,
      controls,
      animateId: 0,
      cleanupFn
    };

    animate();
  }
}

export default ThreeGraphicsManager;
