/**
 * The Whimsical Squirrels of Headington Hill - Interactive Engine
 * Oxford Brookes University Digital Field Guide (Whimsical Storybook Edition)
 */

document.addEventListener('DOMContentLoaded', () => {
  initAudioPlayer();
  initAmbientCanvas();
  initSquirrelPhotoGalleries();
  initInteractiveMap();
  initGalleryFilters();
  initLightbox();
  initAcornCollector();
  initHeaderScroll();
  initDynamicManifestImages();
});

/* ==========================================================================
   0. Dynamic Image Manifest Loader (Automated Apic/ Synchronizer)
   ========================================================================== */
function initDynamicManifestImages() {
  fetch('images-manifest.json')
    .then(response => {
      if (!response.ok) throw new Error('Manifest not found');
      return response.json();
    })
    .then(manifest => {
      if (!Array.isArray(manifest) || manifest.length === 0) return;
      
      const manifestMap = new Map();
      manifest.forEach(item => {
        if (item.filename && item.path) {
          manifestMap.set(item.filename.toLowerCase(), item.path);
        }
      });

      // Synchronize all existing images on the page referencing Apic/
      const imgElements = document.querySelectorAll('img[src*="Apic/"]');
      imgElements.forEach(img => {
        const currentSrc = img.getAttribute('src');
        const filename = currentSrc.split('/').pop().split('?')[0].toLowerCase();
        if (manifestMap.has(filename)) {
          img.src = manifestMap.get(filename);
        }
      });

      // Synchronize multi-photo thumbnail buttons referencing Apic/
      const thumbBtns = document.querySelectorAll('.thumb-btn[data-img*="Apic/"]');
      thumbBtns.forEach(btn => {
        const currentDataImg = btn.getAttribute('data-img');
        const filename = currentDataImg.split('/').pop().split('?')[0].toLowerCase();
        if (manifestMap.has(filename)) {
          btn.setAttribute('data-img', manifestMap.get(filename));
        }
      });

      // Check if new photos exist in Apic/ that can be appended to the Chronicle gallery
      const chronicleGallery = document.getElementById('chronicle-gallery');
      if (chronicleGallery) {
        const existingFilenames = new Set();
        chronicleGallery.querySelectorAll('.gallery-item img').forEach(img => {
          const fn = img.getAttribute('src').split('/').pop().split('?')[0].toLowerCase();
          existingFilenames.add(fn);
        });

        // Filter valid squirrel photo additions (e.g. IMG_*, acrobat, etc., excluding utility graphics/icons)
        const utilityFiles = new Set(['4816995.png', 'fildnote.png', 'phtotoa.png', 'oxford-brookes-drama-studio-location.jpg', '360_f_2158830097_lekntwh4pn8ivrqjulzz72iwngtsyvtl.jpg', 'guilly.jpeg']);
        manifest.forEach(item => {
          const lowerName = item.filename.toLowerCase();
          if (!existingFilenames.has(lowerName) && !utilityFiles.has(lowerName)) {
            const ext = lowerName.split('.').pop();
            if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
              const galleryItem = document.createElement('div');
              galleryItem.className = 'gallery-item';
              galleryItem.dataset.category = lowerName.includes('clement') ? 'clementine' : (lowerName.includes('acrobat') || lowerName.includes('barney') ? 'barnaby' : 'pipkin');
              const prettyName = item.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
              galleryItem.dataset.caption = `Captured in the Headington Hill canopy: ${prettyName}.`;
              
              galleryItem.innerHTML = `
                <img src="${item.path}" alt="${prettyName}" loading="lazy">
                <div class="gallery-overlay">
                  <span class="gallery-tag">Canopy Chronicle</span>
                  <p class="gallery-sub">${prettyName}</p>
                </div>
              `;
              
              galleryItem.addEventListener('click', () => {
                if (window.openLightbox) {
                  window.openLightbox(item.path, galleryItem.dataset.caption);
                }
              });
              
              chronicleGallery.appendChild(galleryItem);
            }
          }
        });
      }
    })
    .catch(err => {
      // Graceful offline fallback: static HTML image paths remain functional
      console.info('Dynamic manifest loader note:', err.message);
    });
}

/* ==========================================================================
   1. Audio Player & Volume Controller ("Acorns on the Quad")
   ========================================================================== */
function initAudioPlayer() {
  const audio = document.getElementById('bg-audio');
  const playToggle = document.getElementById('audio-play-toggle');
  const playIcon = document.getElementById('play-icon');
  const muteToggle = document.getElementById('audio-mute-toggle');
  const muteIcon = document.getElementById('mute-icon');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeLabel = document.getElementById('volume-label');
  const waveform = document.getElementById('audio-waveform');
  const quickSerenadeBtn = document.getElementById('quick-serenade-btn');

  if (!audio) return;

  // Set default low-volume (0.25) to respect user preferences
  audio.volume = 0.25;
  volumeSlider.value = 0.25;
  volumeLabel.textContent = '25%';

  let isPlaying = false;

  function updatePlayUI(playing) {
    isPlaying = playing;
    if (playing) {
      playIcon.textContent = 'â¸';
      playToggle.classList.add('playing');
      waveform.classList.add('playing');
      playToggle.setAttribute('aria-label', 'Pause Campus Music');
      if (quickSerenadeBtn) {
        quickSerenadeBtn.innerHTML = '<span>Pause Quad Serenade</span> <span class="btn-music-note">â¸</span>';
      }
    } else {
      playIcon.textContent = 'â–¶';
      playToggle.classList.remove('playing');
      waveform.classList.remove('playing');
      playToggle.setAttribute('aria-label', 'Play Campus Music');
      if (quickSerenadeBtn) {
        quickSerenadeBtn.innerHTML = '<span>Play Quad Serenade</span> <span class="btn-music-note">ðŸŽµ</span>';
      }
    }
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play().then(() => {
        updatePlayUI(true);
      }).catch(err => {
        console.log('Audio autoplay prevented or error:', err);
      });
    } else {
      audio.pause();
      updatePlayUI(false);
    }
  }

  playToggle.addEventListener('click', togglePlay);
  if (quickSerenadeBtn) {
    quickSerenadeBtn.addEventListener('click', togglePlay);
  }

  // Mute / Unmute handling
  muteToggle.addEventListener('click', () => {
    audio.muted = !audio.muted;
    if (audio.muted) {
      muteIcon.textContent = 'ðŸ”‡';
      muteToggle.setAttribute('aria-label', 'Unmute Campus Music');
      volumeLabel.textContent = 'Muted';
    } else {
      muteIcon.textContent = 'ðŸ”Š';
      muteToggle.setAttribute('aria-label', 'Mute Campus Music');
      volumeLabel.textContent = `${Math.round(audio.volume * 100)}%`;
    }
  });

  // Volume slider handling
  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.volume = val;
    if (val === 0) {
      audio.muted = true;
      muteIcon.textContent = 'ðŸ”‡';
      volumeLabel.textContent = 'Muted';
    } else {
      if (audio.muted) audio.muted = false;
      muteIcon.textContent = 'ðŸ”Š';
      volumeLabel.textContent = `${Math.round(val * 100)}%`;
    }
  });

  // Handle audio events
  audio.addEventListener('play', () => updatePlayUI(true));
  audio.addEventListener('pause', () => updatePlayUI(false));
}

/* ==========================================================================
   2. Ambient Falling Woodland Leaves & Acorns Canvas (Custom SVG Particle Breeze)
   ========================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  const breezeToggle = document.getElementById('breeze-toggle');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let isBreezeActive = true;
  let dpr = 1;

  // Custom SVG Element Definitions (copied into project local assets folder)
  const ASSET_DEFINITIONS = [
    {
      id: 'sage-green-leaf',
      type: 'leaf',
      src: './assets/green-leaf.svg',
      altSrc: './assets/green leave.svg'
    },
    {
      id: 'yellow-tan-leaf',
      type: 'leaf',
      src: './assets/yellow-leaf.svg',
      altSrc: './assets/light ligth leave.svg'
    },
    {
      id: 'golden-tan-leaf',
      type: 'leaf',
      src: './assets/golden-leaf.svg',
      altSrc: './assets/light leave leave.svg'
    },
    {
      id: 'acorn',
      type: 'acorn',
      src: './assets/acorn.svg',
      altSrc: './background images/acorn.svg'
    }
  ];

  // Preload custom SVG images
  const loadedAssets = ASSET_DEFINITIONS.map(def => {
    const img = new Image();
    let hasLoaded = false;
    img.onload = () => { hasLoaded = true; };
    img.onerror = () => {
      if (def.altSrc && img.src !== def.altSrc) {
        img.src = def.altSrc;
      }
    };
    img.src = def.src;
    return {
      id: def.id,
      type: def.type,
      img,
      isLoaded: () => hasLoaded || (img.complete && img.naturalWidth > 0)
    };
  });

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resizeCanvas();

  // Density: Balanced active particle count for larger prominent elements (16 mobile, 24 desktop)
  function getTargetParticleCount() {
    const w = window.innerWidth;
    if (w < 600) return 16;
    if (w < 1024) return 20;
    return 24;
  }
  const particleCount = getTargetParticleCount();
  const particles = [];

  class WoodlandParticle {
    constructor(initial = false) {
      this.reset(initial);
    }

    reset(initial = false) {
      this.assetIndex = Math.floor(Math.random() * loadedAssets.length);
      const asset = loadedAssets[this.assetIndex];
      this.isAcorn = asset.type === 'acorn';

      // Scale & Depth: Varied miniature sizes for subtle depth
      // Acorns are 20-25% larger than leaves
      const isMobile = window.innerWidth < 768;
      const leafMinSize = isMobile ? 18 : 24;
      const leafMaxSize = isMobile ? 38 : 50;
      const acornMinSize = isMobile ? 22 : 30;
      const acornMaxSize = isMobile ? 48 : 62;
      const minSize = this.isAcorn ? acornMinSize : leafMinSize;
      const maxSize = this.isAcorn ? acornMaxSize : leafMaxSize;
      this.size = minSize + Math.random() * (maxSize - minSize);
      this.depth = (this.size - minSize) / (maxSize - minSize);

      // Opacity: Soft, atmospheric opacity (0.68 to 0.84) so they never obstruct hero text
      this.opacity = 0.68 + (this.depth * 0.12) + (Math.random() * 0.04);
      if (this.opacity > 0.84) this.opacity = 0.84;
      if (this.opacity < 0.68) this.opacity = 0.68;

      // Motion: Relaxed, gentle rain-like descent (22–32 seconds per fall)
      const baseDuration = 28.0 - (this.depth * 5.0); // 23s to 28s base
      this.duration = Math.max(22.0, Math.min(32.0, baseDuration + (Math.random() * 4.0 - 2.0)));
      const fallDistance = window.innerHeight + this.size * 2 + 70;
      this.speedY = fallDistance / this.duration; // px / second

      // Horizontal sway: smooth, gentle side-to-side sway like a slow autumn breeze
      this.swayAngle = Math.random() * Math.PI * 2;
      const swayPeriod = (this.isAcorn ? 5.5 : 6.5) + Math.random() * 3.0; // 5.5 to 9.5 seconds per sway cycle
      this.swaySpeed = (Math.PI * 2) / swayPeriod;
      this.swayAmp = (this.isAcorn ? 14 : 26) + Math.random() * 12;

      // Very subtle ambient horizontal drift
      this.driftX = 1.5 + (Math.random() - 0.3) * 3;

      // Rotation: slow continuous rotation for a natural drifting feel
      this.rotation = Math.random() * Math.PI * 2;
      const rotDir = Math.random() < 0.5 ? 1 : -1;
      this.rotSpeed = rotDir * (this.isAcorn ? (0.06 + Math.random() * 0.08) : (0.05 + Math.random() * 0.07)); // slow steady rotation
      this.flutterAmp = this.isAcorn ? 0.03 : (0.08 + Math.random() * 0.06);

      // Positions (staggered initially across entire viewport for immediate ambient beauty)
      this.x = Math.random() * window.innerWidth;
      this.y = initial ? Math.random() * window.innerHeight : -this.size - 35;
    }

    update(dt) {
      // Relaxed gentle rain-like downward drift
      this.y += this.speedY * dt;

      // Horizontal sway & drift
      this.swayAngle += this.swaySpeed * dt;
      this.x += (this.driftX * dt) + Math.cos(this.swayAngle) * (this.swayAmp * 0.35 * dt);

      // Rotation
      this.rotation += this.rotSpeed * dt;

      // Horizontal wrapping
      if (this.x < -this.size - 50) this.x = window.innerWidth + 30;
      if (this.x > window.innerWidth + this.size + 50) this.x = -30;

      // Recycle when fallen past bottom
      if (this.y > window.innerHeight + this.size + 40) {
        this.reset(false);
      }
    }

    draw(targetCtx) {
      const asset = loadedAssets[this.assetIndex];
      targetCtx.save();
      targetCtx.translate(this.x, this.y);

      // Organic fluttering/tumbling tilt synced with sway
      // Acorns rotated 90° anticlockwise so the cap sits upright at the top
      const acornBaseRotation = this.isAcorn ? (-Math.PI / 2) : 0;
      const visualRotation = acornBaseRotation + this.rotation + Math.sin(this.swayAngle) * this.flutterAmp;
      targetCtx.rotate(visualRotation);

      // Soft opacity (0.68 - 0.84)
      targetCtx.globalAlpha = this.opacity;

      const half = this.size / 2;
      if (asset && asset.isLoaded()) {
        targetCtx.drawImage(asset.img, -half, -half, this.size, this.size);
      } else {
        // High-fidelity vector fallback while SVG image initializes
        this.drawVectorFallback(targetCtx, half);
      }

      targetCtx.restore();
    }

    drawVectorFallback(targetCtx, half) {
      if (this.isAcorn) {
        // Custom teardrop brown/pink acorn design fallback
        // Body (teardrop)
        targetCtx.fillStyle = '#c6956f';
        targetCtx.beginPath();
        targetCtx.moveTo(0, half * 0.85);
        targetCtx.bezierCurveTo(half * 0.75, half * 0.45, half * 0.65, -half * 0.15, 0, -half * 0.2);
        targetCtx.bezierCurveTo(-half * 0.65, -half * 0.15, -half * 0.75, half * 0.45, 0, half * 0.85);
        targetCtx.fill();

        // Acorn Cap
        targetCtx.fillStyle = '#966a50';
        targetCtx.strokeStyle = '#603a27';
        targetCtx.lineWidth = 1;
        targetCtx.beginPath();
        targetCtx.arc(0, -half * 0.2, half * 0.68, Math.PI, 0, false);
        targetCtx.fill();
        targetCtx.stroke();

        // Tiny Stem
        targetCtx.strokeStyle = '#603a27';
        targetCtx.lineWidth = 1.5;
        targetCtx.beginPath();
        targetCtx.moveTo(0, -half * 0.2);
        targetCtx.lineTo(half * 0.15, -half * 0.6);
        targetCtx.stroke();
      } else {
        const leafColor = this.assetIndex === 0 ? '#a5b19d' : (this.assetIndex === 1 ? '#f4d695' : '#efcaa2');
        targetCtx.fillStyle = leafColor;
        targetCtx.beginPath();
        targetCtx.moveTo(0, -half);
        targetCtx.bezierCurveTo(half * 0.7, -half * 0.4, half * 0.7, half * 0.4, 0, half);
        targetCtx.bezierCurveTo(-half * 0.7, half * 0.4, -half * 0.7, -half * 0.4, 0, -half);
        targetCtx.fill();
      }
    }
  }

  // Populate initial active elements
  for (let i = 0; i < particleCount; i++) {
    particles.push(new WoodlandParticle(true));
  }

  // Resize listener
  window.addEventListener('resize', () => {
    resizeCanvas();
    const target = getTargetParticleCount();
    while (particles.length < target) {
      particles.push(new WoodlandParticle(false));
    }
    while (particles.length > target) {
      particles.pop();
    }
  });

  // Animation Loop with delta time
  let lastTime = performance.now();
  function render(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    targetCtxTransform();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (isBreezeActive) {
      for (const p of particles) {
        p.update(dt);
        p.draw(ctx);
      }
    }

    animationFrameId = requestAnimationFrame(render);
  }

  function targetCtxTransform() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  animationFrameId = requestAnimationFrame(render);

  // Breeze Toggle Button
  if (breezeToggle) {
    breezeToggle.addEventListener('click', () => {
      isBreezeActive = !isBreezeActive;
      if (isBreezeActive) {
        breezeToggle.classList.remove('off');
        breezeToggle.setAttribute('aria-pressed', 'true');
        breezeToggle.innerHTML = '<span class="chip-emoji">🍃</span> <span class="chip-text">Breeze: ON</span>';
      } else {
        breezeToggle.classList.add('off');
        breezeToggle.setAttribute('aria-pressed', 'false');
        breezeToggle.innerHTML = '<span class="chip-emoji">🍂</span> <span class="chip-text">Breeze: OFF</span>';
        targetCtxTransform();
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    });
  }
}

/* ==========================================================================
   3. Squirrel Profile Cards & Multi-Photo Showcase Switcher
   ========================================================================== */
function initSquirrelPhotoGalleries() {
  const cards = document.querySelectorAll('.squirrel-card');

  cards.forEach(card => {
    const mainImg = card.querySelector('.squirrel-main-photo');
    const thumbBtns = card.querySelectorAll('.thumb-btn');
    const captionEl = card.querySelector('.photo-caption-text');
    const zoomBtn = card.querySelector('.zoom-trigger-btn');

    thumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        thumbBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const newSrc = btn.dataset.img;
        const newCaption = btn.dataset.caption;

        if (mainImg && newSrc) {
          mainImg.style.opacity = '0.3';
          mainImg.style.transform = 'scale(0.98)';
          
          setTimeout(() => {
            mainImg.src = newSrc;
            mainImg.style.opacity = '1';
            mainImg.style.transform = 'scale(1)';
          }, 180);
        }

        if (captionEl && newCaption) {
          captionEl.textContent = newCaption;
        }
      });
    });

    if (zoomBtn && mainImg) {
      zoomBtn.addEventListener('click', () => {
        openLightbox(mainImg.src, captionEl ? captionEl.textContent : mainImg.alt);
      });
    }

    if (mainImg) {
      mainImg.addEventListener('click', () => {
        openLightbox(mainImg.src, captionEl ? captionEl.textContent : mainImg.alt);
      });
    }
  });

  // "Pinpoint on Campus Map" buttons
  const locateBtns = document.querySelectorAll('.locate-btn');
  locateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSquirrel = btn.dataset.locate;
      const targetPin = document.getElementById(`pin-${targetSquirrel}`);
      const mapSection = document.getElementById('territory-map');

      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth' });
      }

      if (targetPin) {
        setTimeout(() => {
          activateMapPin(targetPin);
        }, 600);
      }
    });
  });
}

/* ==========================================================================
   4. Interactive Campus Map & Territory Guide
   ========================================================================== */
function initInteractiveMap() {
  const pins = document.querySelectorAll('.map-pin-beacon');
  const filterBtns = document.querySelectorAll('.map-filter-btn');
  const legendItems = document.querySelectorAll('.legend-item');
  const mapImg = document.getElementById('campus-map-img');
  const campusViewBtn = document.getElementById('view-campus-map-btn');

  // Campus map view (single view - Storybook Chart removed)
  if (campusViewBtn && mapImg) {
    campusViewBtn.classList.add('active');
  }

  window.activateMapPin = function(pin) {
    pins.forEach(p => p.classList.remove('active'));
    pin.classList.add('active');

    const target = pin.dataset.targetSquirrel;
    legendItems.forEach(li => {
      if (li.dataset.focus === target) {
        li.classList.add('highlighted');
      } else {
        li.classList.remove('highlighted');
      }
    });
  };

  pins.forEach(pin => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      const isAlreadyActive = pin.classList.contains('active');
      pins.forEach(p => p.classList.remove('active'));
      legendItems.forEach(li => li.classList.remove('highlighted'));

      if (!isAlreadyActive) {
        activateMapPin(pin);
      }
    });

    pin.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateMapPin(pin);
      }
    });
  });

  document.addEventListener('click', () => {
    pins.forEach(p => p.classList.remove('active'));
    legendItems.forEach(li => li.classList.remove('highlighted'));
  });

  legendItems.forEach(item => {
    item.addEventListener('click', () => {
      const focusTarget = item.dataset.focus;
      const targetPin = document.getElementById(`pin-${focusTarget}`);
      if (targetPin) {
        activateMapPin(targetPin);
      }
    });
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      pins.forEach(pin => {
        const pinSquirrel = pin.dataset.targetSquirrel;
        if (filter === 'all' || filter === pinSquirrel) {
          pin.style.display = 'block';
          if (filter !== 'all') {
            activateMapPin(pin);
          }
        } else {
          pin.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   5. Chronicle Photo Archive Filters
   ========================================================================== */
function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const items = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.galleryFilter;

      items.forEach(item => {
        const cat = item.dataset.category;
        if (filter === 'all' || filter === cat) {
          item.style.display = 'block';
          item.style.opacity = '1';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  items.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.dataset.caption || (img ? img.alt : '');
      if (img) {
        openLightbox(img.src, caption);
      }
    });
  });
}

/* ==========================================================================
   6. Fullscreen Lightbox Modal
   ========================================================================== */
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const backdrop = document.getElementById('lightbox-backdrop');
  const closeBtn = document.getElementById('lightbox-close');
  const imgEl = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');

  window.openLightbox = function(src, caption) {
    if (!modal || !imgEl) return;
    imgEl.src = src;
    captionEl.textContent = caption || 'Oxford Brookes Headington Hill Squirrel Photo';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  function closeLightbox() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/* ==========================================================================
   7. Acorn Collector Mini-Game & Toast Notification (Cross-Page Synced & 60s Respawn)
   ========================================================================== */
function initAcornCollector() {
  const STORAGE_KEY = 'headington_total_acorns_foraged';
  const TIMESTAMPS_KEY = 'headington_acorn_collected_timestamps';
  const RESPAWN_MS = 60 * 1000; // 60 seconds

  const countBadge = document.getElementById('acorn-count-text');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');

  // Load total count
  let totalForaged = 0;
  try {
    const savedCount = localStorage.getItem(STORAGE_KEY);
    if (savedCount) totalForaged = parseInt(savedCount, 10) || 0;
  } catch (err) {}

  // Load collected timestamps map { [acornId]: timestamp }
  let collectedTimestamps = {};
  try {
    const savedTimes = localStorage.getItem(TIMESTAMPS_KEY);
    if (savedTimes) collectedTimestamps = JSON.parse(savedTimes) || {};
  } catch (err) {}

  // Update badge
  if (countBadge) {
    countBadge.textContent = totalForaged;
  }

  // General canopy lore quotes (never mentioning Barry)
  const loreQuotes = [
    "Professor Pipkin gives you a tiny polite bow with his twig glasses!",
    "Barney attempted a somersault to snag this acorn, but you caught it first!",
    "Lady Clementine poses like a fluffy statue in your honor!",
    "Secret Found: Oxford Brookes beeches make the crunchiest snacks!",
    "Guilly scribbles your acorn in his official Wildlife Society notebook!",
    "Canopy Explorer badge earned! Headington Hill loves you!",
    "Super Squirrel Whisperer! You found every single hidden acorn!"
  ];

  // Specific Barry quotes strictly for Barry's acorns:
  const barryQuotes = {
    'barry-teaser': "Barry's Special Acorn: You spotted the legendary chubby king on the canopy crew board!",
    'barry': "Barry's Golden Honorary Acorn: The chubby king happily nibbles a biscuit in your honor!"
  };

  function showToast(msg) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
  }

  function hideToast() {
    if (!toast) return;
    toast.classList.remove('show');
  }

  // Close strictly when clicking the X button on top of the popup
  const toastCloseBtn = document.getElementById('toast-close-btn');
  if (toastCloseBtn) {
    toastCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideToast();
    });
  }

  const collectibles = document.querySelectorAll('.acorn-collectible');

  // Helper to sync respawn state
  function updateRespawnStates() {
    const now = Date.now();
    collectibles.forEach(acorn => {
      const acornId = acorn.dataset.acornId || acorn.getAttribute('id') || 'generic';
      const collectedTime = collectedTimestamps[acornId];

      if (collectedTime && (now - collectedTime < RESPAWN_MS)) {
        // Still in 60s cooldown
        acorn.classList.add('collected');
        acorn.classList.remove('resprouted');
      } else {
        // Respawned! Available to be clicked again
        if (acorn.classList.contains('collected')) {
          acorn.classList.remove('collected');
          acorn.classList.add('resprouted');
          setTimeout(() => acorn.classList.remove('resprouted'), 800);
        }
      }
    });
  }

  // Initial check on load
  updateRespawnStates();

  // Periodic respawn ticker every second to check if 60 seconds have elapsed
  setInterval(updateRespawnStates, 1000);

  collectibles.forEach(acorn => {
    const acornId = acorn.dataset.acornId || acorn.getAttribute('id') || 'generic';

    acorn.addEventListener('click', (e) => {
      e.stopPropagation();
      const now = Date.now();
      const lastCollected = collectedTimestamps[acornId];

      // If clicked while still cooling down, do nothing
      if (lastCollected && (now - lastCollected < RESPAWN_MS)) return;

      // Mark collected
      acorn.classList.add('collected');
      acorn.classList.remove('resprouted');
      collectedTimestamps[acornId] = now;
      totalForaged++;

      // Save to localStorage for cross-page persistence
      try {
        localStorage.setItem(STORAGE_KEY, totalForaged.toString());
        localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(collectedTimestamps));
      } catch (err) {}

      if (countBadge) countBadge.textContent = totalForaged;

      // Only Barry's acorns mention Barry; all other acorns use general canopy lore
      let quote = '';
      if (barryQuotes[acornId]) {
        quote = barryQuotes[acornId];
      } else {
        quote = loreQuotes[(totalForaged - 1) % loreQuotes.length];
      }

      showToast(`+1 Acorn Foraged! ${quote}`);

      createAcornBurst(e.clientX, e.clientY);
    });
  });

  // Listen to cross-tab/cross-page storage events
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && countBadge) {
      countBadge.textContent = e.newValue || '0';
    }
    if (e.key === TIMESTAMPS_KEY) {
      try {
        collectedTimestamps = JSON.parse(e.newValue) || {};
        updateRespawnStates();
      } catch (err) {}
    }
  });

  function createAcornBurst(x, y) {
    for (let i = 0; i < 6; i++) {
      const burstAcorn = document.createElement('img');
      burstAcorn.src = './assets/acorn.svg';
      burstAcorn.alt = 'Acorn';
      burstAcorn.className = 'burst-acorn-icon';
      burstAcorn.style.position = 'fixed';
      burstAcorn.style.left = `${x - 10}px`;
      burstAcorn.style.top = `${y - 10}px`;
      burstAcorn.style.width = '20px';
      burstAcorn.style.height = '20px';
      burstAcorn.style.pointerEvents = 'none';
      burstAcorn.style.zIndex = '999';
      burstAcorn.style.transition = 'all 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)';
      document.body.appendChild(burstAcorn);

      const angle = (Math.PI * 2 / 6) * i + (Math.random() * 0.4 - 0.2);
      const dist = 40 + Math.random() * 30;
      const targetX = (x - 10) + Math.cos(angle) * dist;
      const targetY = (y - 10) + Math.sin(angle) * dist;
      const rot = (Math.random() - 0.5) * 360;

      requestAnimationFrame(() => {
        burstAcorn.style.transform = `translate(${targetX - (x - 10)}px, ${targetY - (y - 10)}px) scale(0.3) rotate(${rot}deg)`;
        burstAcorn.style.opacity = '0';
      });

      setTimeout(() => burstAcorn.remove(), 700);
    }
  }
}

/* ==========================================================================
   8. Header Scroll Elevation
   ========================================================================== */
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}
