// ---------- Particle Driver ------------
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const PARTICLE_COLORS = {
  dark: { h: 220, s: 0.9, l: 0.1, opacity: 0.22 },
  light: { h: 220, s: 1.3, l: 0.6, opacity: 0.72 },
};

function init() {
    // Create particles
    const positions = new Float32Array(state.particlesCount * 3);
    for (let i = 0; i < state.particlesCount * 3; i += 3) {
        const x = (Math.random() - 0.5) * 150;
        const y = (Math.random() - 0.5) * 150;
        const z = (Math.random() - 0.5) * 200;

        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;

        originalPositions.push(x, y, z);
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const textureLoader = new THREE.TextureLoader();
    // textureLoader.setCrossOrigin('anonymous');
    const particleTexture = textureLoader.load('img/circle.png');

    const p = PARTICLE_COLORS[state.theme];

    material = new THREE.PointsMaterial({
        map: particleTexture,
        size: 1.5,
        sizeAttenuation: true, // <— makes size shrink/grow smoothly with distance
        transparent: true,
        opacity: p.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    material.color.setHSL(p.h/360, p.s, p.l);

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function regenerateParticles() {
  scene.remove(particles);
  geometry.dispose();
  material.dispose();

  init(); // Recreate particles with new count
}

camera.position.z = 50;

// Mouse parallax
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

let scrollY = 0, lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

window.addEventListener('click', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * -2;

  ripples.push({
    x: x * 75,
    y: y * 75,
    radius: 0,
    maxRadius: 80,
  });
});

document.getElementById('particle-reset').addEventListener('click', (e) => {
    e.preventDefault();
    state.particlesCount=3500;
    document.getElementById('particleCount').value = 3500;
    localStorage.setItem('hw.particlesCount', 3500);
    regenerateParticles();
});

function repelParticles() {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const origX = originalPositions[i];
      const origY = originalPositions[i + 1];
      const origZ = originalPositions[i + 2];
  
      let px = positions[i];
      let py = positions[i + 1];
      let pz = positions[i + 2];
  
      // Cursor repulsion in 2D screen space
      let dx = px - camera.position.x - mouseX * 50;
      let dy = py - camera.position.y + mouseY * 50;
      let distSq = dx * dx + dy * dy;
  
      if (distSq < 2000) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / 100) * 0.25;
        positions[i] += (dx / dist) * force;
        positions[i + 1] += (dy / dist) * force;
      }
  
      // Elastic pullback to original position
      positions[i] += (origX - px) * 0.01;
      positions[i + 1] += (origY - py) * 0.01;
      positions[i + 2] += (origZ - pz) * 0.01;
    }
    
    // Wave propagation from clicks
    for (let r = ripples.length - 1; r >= 0; r--) {
      const ripple = ripples[r];
      ripple.radius += 0.9;
   
      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - ripple.x;
        const dy = positions[i + 1] - ripple.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
   
        if (dist > ripple.radius - 5 && dist < ripple.radius + 5) {
          const force = 0.4 * (1 - dist / ripple.maxRadius);
          positions[i] += (dx / dist) * force;
          positions[i + 1] += (dy / dist) * force;

          // Light flash effect: increase brightness briefly
          const glowColor = new THREE.Color();
          const lightness = 0.3 + Math.random() * 0.2; // random slight glow
          glowColor.setHSL(hue / 360, 0.9, lightness);
          material.color.lerp(glowColor, 0.02); // blend toward brighter
        }
      }
   
      // Remove ripple after it exceeds max
      if (ripple.radius > ripple.maxRadius) {
        ripples.splice(r, 1);
      }

    }

    geometry.attributes.position.needsUpdate = true;
}

// Animate
let hue = 220;
function animate() {
  animationId = requestAnimationFrame(animate);

  hue = (hue + 0.1) % 360;

  const scrollDiff = scrollY - lastScrollY;
  lastScrollY = scrollY;

  particles.rotation.y += 0.0008;
  particles.rotation.x += 0.0005;

  // apply decay when mouse hasn't moved
  mouseX *= 0.98;
  mouseY *= 0.98;

  particles.position.x += (mouseX * 0.5 - particles.position.x) * 0.02;
  particles.position.y += (-mouseY * 0.5 - particles.position.y + scrollDiff * 0.5) * 0.02;

  // Particle repulsion
  repelParticles();

  // Gradually fade the material color back to base hue
  const base = PARTICLE_COLORS[state.theme];
  targetColor.setHSL(hue / 360, base.s, base.l); // dark but tinted to hue
  material.color.lerp(targetColor, 0.05); // adjust 0.05 for slower or faster fade



  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('particleCount').value = state.particlesCount;
document.getElementById('particleCount').addEventListener('change', (e) => {
    //console.log("Change detected");
    const newCount = parseInt(e.target.value, 10);
    if (!isNaN(newCount)) {
        localStorage.setItem('hw.particlesCount', newCount);
        state.particlesCount = newCount;
        regenerateParticles();
    }
});

function initParticles() {
  init();
  animate();
}

function toggleParticles(on) {  
  if (on) {
    // Turn ON: clean, then start
    if (!particles) {
      originalPositions = [];
      ripples = [];
      init();
    }
    if (!animationId) animate();
  } else {
    // Turn OFF: stop animation and remove from scene
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (particles) {
      scene.remove(particles);
      geometry.dispose();
      material.dispose();
      particles.geometry = null;
      particles.material = null;
      particles = null;
      ripples = [];
      originalPositions = [];
    }
    renderer.clear();
    renderer.renderLists.dispose(); // free GPU memory
    renderer.setRenderTarget(null);
    renderer.clearColor();
  }
}