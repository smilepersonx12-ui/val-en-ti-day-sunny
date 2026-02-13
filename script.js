/* =========================================
   Gravity of You - Core Engine (V2 Enhanced)
   ========================================= */

// --- Configuration ---
const CONFIG = {
    starCount: 200,
    connectionDistance: 150,
    mergeDistance: 40,
    friction: 0.88,  
    mouseForce: 0.05, 
    partnerSpeed: 0.03,  
    colors: {
        bg: '#050510',
        star: '#ffffff',
        player: '#4fc3f7',   // Bright Cyan
        playerHalo: 'rgba(79, 195, 247, 0.2)',
        partner: '#ff4081',  // Hot Pink
        partnerHalo: 'rgba(255, 64, 129, 0.2)',
        text: '#ffffff'
    },
    messages: [
        "I was used to the silence of my own thoughts",
        "until you brought a new rhythm into my life",
        "You are the missing piece I didn’t even know I was looking for.",
        "Without a word, your presence makes everything feel right.",
        "Thank you for being the reason behind my peace and my constant smile.",
        "Happy Valentine’s Day, My Love Sunny.",

    ]
};

// --- Audio Controller (Web Audio API) ---
class AudioController {
    constructor() {
        this.ctx = null;
        this.droneOsc = null;
        this.droneGain = null;
        this.initialized = false;
        this.isMuted = true;
    }

    init() {
        if (this.initialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            // Reverb Node (Convolver)
            this.reverb = this.ctx.createConvolver();
            this.generateReverbBuffer();
            this.reverb.connect(this.ctx.destination);

            // Master Gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.ctx.destination);
            
            this.initialized = true;
        } catch (e) {
            console.error("Audio Init Failed", e);
        }
    }

    generateReverbBuffer() {
        // Simple noise impulse for reverb
        const rate = this.ctx.sampleRate;
        const length = rate * 3.0; // 3 seconds
        const decay = 2.0;
        const buffer = this.ctx.createBuffer(2, length, rate);
        
        for (let i = 0; i < 2; i++) {
            const channel = buffer.getChannelData(i);
            for (let j = 0; j < length; j++) {
                channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
            }
        }
        this.reverb.buffer = buffer;
    }

    startDrone() {
        if (!this.initialized || !this.isMuted) return; // Wait for unmute
        
        // Deep Space Drone
        this.droneOsc = this.ctx.createOscillator();
        this.droneOsc.type = 'sine';
        this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.droneGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 4);

        // LFO for movement
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 5;
        
        lfo.connect(lfoGain);
        lfoGain.connect(this.droneOsc.frequency);
        lfo.start();

        this.droneOsc.connect(this.droneGain);
        this.droneGain.connect(this.reverb); // Add space
        this.droneOsc.start();
    }

    playChime() {
        if (!this.initialized || this.ctx.state === 'suspended' || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Pentatonic Scale (random note)
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C Major Pentatonic
        const note = notes[Math.floor(Math.random() * notes.length)];

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.0);

        osc.connect(gain);
        gain.connect(this.reverb); // Use reverb for ethereal sound
        osc.start();
        osc.stop(this.ctx.currentTime + 3.1);
    }

    playFinale() {
        if (!this.initialized || this.isMuted) return;
        
        // Simple major chord swell
        const freqs = [261.63, 329.63, 392.00, 523.25];
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.frequency.setValueAtTime(f, this.ctx.currentTime);
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 2);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 6);
            
            osc.connect(gain);
            gain.connect(this.reverb);
            osc.start();
            osc.stop(this.ctx.currentTime + 6);
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (!this.initialized) {
            this.init();
            this.startDrone();
        } else {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            
            if (!this.isMuted) {
                // Resume/Start
                if(!this.droneOsc) this.startDrone();
                this.masterGain.gain.setTargetAtTime(0.4, this.ctx.currentTime, 0.5);
            } else {
                // Mute
                this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
            }
        }
    }
}


// --- Vector Utility ---
class Vector2 {
    constructor(x, y) { this.x = x; this.y = y; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    dist(v) { return Math.sqrt((this.x - v.x)**2 + (this.y - v.y)**2); }
    normalize() {
        const m = this.mag();
        if (m !== 0) { this.mult(1 / m); }
        return this;
    }
    limit(max) {
        if (this.mag() > max) { this.normalize().mult(max); }
        return this;
    }
    clone() { return new Vector2(this.x, this.y); }
    static sub(v1, v2) { return new Vector2(v1.x - v2.x, v1.y - v2.y); }
}

// --- Visual Entities ---

class Nebula {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.clouds = [];
        this.init();
    }
    
    init() {
        for(let i=0; i<5; i++) {
            this.clouds.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 300 + 200,
                // Increased opacity from 0.03 to 0.08 for visibility
                color: Math.random() > 0.5 ? 'rgba(79, 195, 247, 0.08)' : 'rgba(255, 64, 129, 0.08)',
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2
            });
        }
    }
    
    update() {
        this.clouds.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            // Wrap
            if (c.x < -c.size) c.x = this.w + c.size;
            if (c.x > this.w + c.size) c.x = -c.size;
            if (c.y < -c.size) c.y = this.h + c.size;
            if (c.y > this.h + c.size) c.y = -c.size;
        });
    }
    
    draw(ctx) {
        this.clouds.forEach(c => {
            const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size);
            grad.addColorStop(0, c.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.w, this.h); // Optimize? Better to draw rect at pos
        });
    }
}

class Star {
    constructor(w, h) {
        this.pos = new Vector2(Math.random() * w, Math.random() * h);
        const isMobile = window.innerWidth < 768;
        this.size = isMobile ? Math.random() * 0.8 + 0.2 : Math.random() * 1.5 + 0.5;
        this.baseSize = this.size;
        this.twinkleSpeed = Math.random() * 0.05 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;
        this.depth = Math.random() * 0.8 + 0.2; 
    }
    
    update(time, playerVel, mousePos) {
        this.size = this.baseSize * (1 + 0.4 * Math.sin(time * this.twinkleSpeed + this.twinkleOffset));
        
        // Parallax / "Warp" effect
        this.pos.x -= playerVel.x * this.depth * 0.1;
        this.pos.y -= playerVel.y * this.depth * 0.1;

        // Interactive "Flee" from mouse/player
        const dx = this.pos.x - mousePos.x;
        const dy = this.pos.y - mousePos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const fleeRadius = 200;
        
        if (dist < fleeRadius) {
            const force = (fleeRadius - dist) / fleeRadius;
            this.pos.x += dx * force * 0.05 * this.depth; // Move away
            this.pos.y += dy * force * 0.05 * this.depth;
        }

        // Wrap
        if (this.pos.x < 0) this.pos.x = window.innerWidth;
        if (this.pos.x > window.innerWidth) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = window.innerHeight;
        if (this.pos.y > window.innerHeight) this.pos.y = 0;
    }
    
    draw(ctx) {
        ctx.fillStyle = CONFIG.colors.star;
        ctx.globalAlpha = Math.max(0.2, this.depth * 0.8);
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class TrailParticle {
    constructor(x, y, color) {
        this.pos = new Vector2(x, y);
        this.life = 1.0;
        this.decay = 0.04;
        this.size = Math.random() * 2 + 1;
        this.color = color;
    }
    update() {
        this.life -= this.decay;
        this.size *= 0.95;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life * 0.5;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Player {
    constructor(x, y) {
        this.pos = new Vector2(x, y);
        this.vel = new Vector2(0, 0);
        this.size = 6; // Smaller core, bigger glow
        this.color = CONFIG.colors.player;
        this.trails = [];
        this.active = false;
    }

    update(targetPos) {
        let force = Vector2.sub(targetPos, this.pos);
        force.mult(CONFIG.mouseForce);
        this.vel.add(force);
        this.vel.mult(CONFIG.friction);
        this.vel.limit(12); // Speed limit to prevent massive overshoots
        this.pos.add(this.vel);
        
        // Add trail particles
        if (this.vel.mag() > 0.5) {
            this.trails.push(new TrailParticle(
                this.pos.x + (Math.random()-0.5)*5, 
                this.pos.y + (Math.random()-0.5)*5, 
                this.color
            ));
        }
        
        // Clean trails
        for(let i=this.trails.length-1; i>=0; i--) {
            this.trails[i].update();
            if(this.trails[i].life <= 0) this.trails.splice(i,1);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        this.trails.forEach(t => t.draw(ctx));

        // Glow
        const grad = ctx.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, this.size * 6);
        grad.addColorStop(0, CONFIG.colors.playerHalo);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size * 6, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Constellation Lines (V3)
        // Draw faint lines to nearby background stars
        // We need access to the stars array. Passing it in draw() or handling in Engine might be cleaner.
        // Let's handle it in Player.draw but we need `stars`.
        // EDIT: It's better to do this in Engine.draw to keep Player class simple.
        // I will REVERT this change plan and modify Engine.draw instead.
    }
}

class Partner {
    constructor(w, h) {
        this.pos = new Vector2(Math.random() * w, Math.random() * h);
        this.vel = new Vector2(0, 0);
        this.acc = new Vector2(0, 0);
        this.size = 8;
        this.color = CONFIG.colors.partner;
        this.maxSpeed = 5;
        this.trails = [];
        this.active = false;
    }

    update(targetPos, isAttracted) {
        let force = Vector2.sub(targetPos, this.pos);
        force.normalize();

        if (isAttracted) {
            force.mult(0.25); 
        } else {
            force.mult(0.02);
            this.vel.x += (Math.random() - 0.5) * 0.8;
            this.vel.y += (Math.random() - 0.5) * 0.8;
        }

        this.acc.add(force);
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);

        // Trail
        if (this.vel.mag() > 0.5) {
             this.trails.push(new TrailParticle(
                this.pos.x + (Math.random()-0.5)*5, 
                this.pos.y + (Math.random()-0.5)*5, 
                this.color
            ));
        }
         for(let i=this.trails.length-1; i>=0; i--) {
            this.trails[i].update();
            if(this.trails[i].life <= 0) this.trails.splice(i,1);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        this.trails.forEach(t => t.draw(ctx));

        // Glow
        const grad = ctx.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, this.size * 8);
        grad.addColorStop(0, CONFIG.colors.partnerHalo);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size * 8, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class FloatingText {
    constructor(x, y, text) {
        this.pos = new Vector2(x, y);
        this.text = text;
        this.life = 1.0;
        this.vel = new Vector2(0, -0.8);
        this.scale = 0;
        this.isFloating = false; // Add flag for finale mode
    }

    update() {
        if (this.isFloating) {
             // Floating physics for finale
             this.pos.add(this.vel);
             // Bounce off walls
             if (this.pos.x < 0 || this.pos.x > window.innerWidth) this.vel.x *= -1;
             if (this.pos.y < 0 || this.pos.y > window.innerHeight) this.vel.y *= -1;
             // No life decay for finale messages
             let targetScale = this.text.length > 50 ? 0.7 : 1; 
             if (this.scale < targetScale) this.scale += 0.05;
        } else {
             // Standard rising text
            this.pos.add(this.vel);
            this.life -= 0.004;
            if (this.scale < 1) this.scale += 0.05;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.scale(this.scale, this.scale);
        
        ctx.font = "italic 24px 'Montserrat'";
        ctx.textAlign = "center";

        // Pass 1: Wide colored glow
        ctx.shadowColor = "rgba(255, 64, 129, 0.8)"; 
        ctx.shadowBlur = 20;
        ctx.fillStyle = "rgba(255, 64, 129, 0.5)";
        ctx.fillText(this.text, 0, 0);

        // Pass 2: Tight intense glow
        ctx.shadowBlur = 5;
        ctx.fillStyle = "#ff80ab"; 
        ctx.fillText(this.text, 0, 0);

        // Pass 3: White Core
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(this.text, 0, 0);
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.pos = new Vector2(x, y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = color;
        this.size = Math.random() * 3 + 1;
    }

    update() {
        this.pos.add(this.vel);
        this.vel.mult(0.95); // Drag
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// --- Main Engine ---

class Engine {
    constructor() {
        this.canvas = document.getElementById('gravity-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.mouse = new Vector2(this.width / 2, this.height / 2);
        this.isTouching = false;
        
        this.audio = new AudioController();
        this.nebula = new Nebula(this.width, this.height);
        this.stars = [];
        this.player = null;
        this.partner = null;
        this.particles = [];
        this.texts = [];
        
        this.gameStep = 0; 
        this.messageIndex = 0;
        this.lastCollisionTime = 0;
        this.startTime = Date.now();

        this.init();
        this.bindEvents();
        this.loop();
    }

    init() {
        this.resize();
        
        // Dynamic star count based on screen area to maintain density
        // Base density: 100 stars for 1920x1080 (approx 2M pixels) -> 1 star per 20000px? 
        // Actually 100 is low. Let's aim for higher density on mobile.
        // If mobile (e.g. 375x667 = 250k px), 100 stars is 1 per 2500px (very dense).
        // User said "too spread", meaning they want MORE stars (closer together) on mobile?
        // Or "too big/too spread" might mean they look sparse.
        // Let's try increasing density.
        
        const area = this.width * this.height;
        const starCount = Math.floor(area / 4000); // e.g. 1920x1080 / 4000 = ~500 stars. Mobile 375x800 / 4000 = ~75 stars.
        // Wait, if 100 was "too spread" (too few?), then 75 is fewer.
        // Maybe "too spread" means they are too large?
        // "stars spread on mobile is too big/ too spread"
        // I will increase density (more stars) and decrease size.

        this.stars = [];
        const count = Math.max(100, Math.floor(area / 3000)); // Ensure at least 100
        
        for(let i=0; i<count; i++) {
            this.stars.push(new Star(this.width, this.height));
        }

        this.player = new Player(this.width / 2, this.height / 2);
        this.partner = new Partner(this.width, this.height);
        
        this.partner.pos = new Vector2(
            Math.random() < 0.5 ? -100 : this.width + 100,
            Math.random() * this.height
        );
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        if(this.nebula) { this.nebula.w = this.width; this.nebula.h = this.height; }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('touchstart', (e) => {
            this.isTouching = true;
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
        });

        window.addEventListener('touchmove', (e) => {
            e.preventDefault(); 
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
        });

        window.addEventListener('click', () => {
             if (this.gameStep === 0) this.startGame();
        });

        const musicBtn = document.getElementById('music-btn');
        musicBtn.addEventListener('click', () => {
            this.audio.toggleMute();
            if (!this.audio.isMuted) {
                musicBtn.classList.add('playing');
            } else {
                musicBtn.classList.remove('playing');
            }
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
           location.reload(); 
        });


    }

    startGame() {
        if (this.gameStep > 0) return; // Prevent double start
        this.gameStep = 1;
        this.player.active = true;
        this.partner.active = true;
        document.getElementById('hint-text').classList.remove('visible');
        
        // Start Audio Context and Music
        this.audio.init();
        const bgMusic = document.getElementById('bg-music');
        const musicBtn = document.getElementById('music-btn');
        
        bgMusic.play().then(() => {
            this.audio.isMuted = false;
            musicBtn.classList.add('playing');
        }).catch(e => {
            console.log("Audio play failed:", e);
        });
    }

    spawnText(text, x, y) {
        this.texts.push(new FloatingText(x, y, text));
    }

    spawnExplosion(x, y, color) {
        for(let i=0; i<30; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    triggerFinale() {
        this.gameStep = 2;
        this.spawnExplosion(this.width/2, this.height/2, '#fff');
        this.audio.playFinale();
        
        // Hide partner/player
        this.player.size = 0;
        this.partner.size = 0;
        
        // Spawn all floating messages
        CONFIG.messages.forEach(msg => {
            const x = Math.random() * (this.width - 200) + 100;
            const y = Math.random() * (this.height - 100) + 50;
            const textEntity = new FloatingText(x, y, msg);
            textEntity.isFloating = true;
            textEntity.vel = new Vector2((Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1);
            textEntity.life = 1000; // Persist forever
            this.texts.push(textEntity);
        });

        setTimeout(() => {
            const finaleEl = document.getElementById('finale-container');
            if (finaleEl) finaleEl.classList.add('visible');
        }, 1000);
    }

    update() {
        const time = (Date.now() - this.startTime) * 0.001;

        this.nebula.update();
        
        // Stars react to player position if active, otherwise mouse (for intro interaction)
        const interactionPoint = (this.player.active) ? this.player.pos : this.mouse;
        this.stars.forEach(star => star.update(time, this.player.vel, interactionPoint));
        
        this.player.update(this.mouse);

        if (this.gameStep >= 1) {
            this.partner.update(this.player.pos, true);
        } else {
            this.partner.update(this.mouse, false); 
        }

        // Parallax Effect for Finale Card
        if (this.gameStep === 2) {
            const finaleEl = document.getElementById('finale-container');
            if (finaleEl && finaleEl.classList.contains('visible')) {
                const cx = this.width / 2;
                const cy = this.height / 2;
                const dx = this.mouse.x - cx;
                const dy = this.mouse.y - cy;
                
                // Tilt calculation (max 15 degrees)
                const tiltX = (dy / cy) * 15; // Mouse down -> Tilt edge towards viewer (rotateX positive?) No, rotateX positive = top away. Mouse down -> look down -> top comes closer?
                // Visual check: Mouse down (high Y) -> rotateX should be negative to tilt bottom away?
                // Let's stick to standard: moves opposite to mouse.
                // Mouse right -> rotateY positive (right edge goes back).
                
                const rotateX = -(dy / cy) * 5;
                const rotateY = (dx / cx) * 5;

                finaleEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        }

        // Logic
        if (this.gameStep === 1) {
            const dist = this.player.pos.dist(this.partner.pos);
            
            if (dist < CONFIG.mergeDistance) {
                const now = Date.now();
                if (now - this.lastCollisionTime > 1500) { 
                    this.lastCollisionTime = now;
                    
                    const midX = (this.player.pos.x + this.partner.pos.x)/2;
                    const midY = (this.player.pos.y + this.partner.pos.y)/2;
                    
                    this.spawnExplosion(midX, midY, CONFIG.colors.partner);
                    this.audio.playChime(); // Sound!

                    if (this.messageIndex < CONFIG.messages.length) {
                        this.spawnText(CONFIG.messages[this.messageIndex], midX, midY - 50);
                        this.messageIndex++;
                    } else {
                        this.triggerFinale();
                    }
                    
                    this.partner.vel.mult(-1.5);
                }
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.texts.length - 1; i >= 0; i--) {
            this.texts[i].update();
            if (this.texts[i].life <= 0) this.texts.splice(i, 1);
        }
    }

    draw() {
        this.ctx.clearRect(0,0,this.width,this.height);
        
        this.nebula.draw(this.ctx);
        this.stars.forEach(star => star.draw(this.ctx));
        this.texts.forEach(text => text.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));

        if (this.gameStep < 2) {
            
            if (this.gameStep >= 1) {
                // Only show player and partner after start
                this.player.draw(this.ctx);
                this.partner.draw(this.ctx);
                
                // Active Connection Line
                const dist = this.player.pos.dist(this.partner.pos);
                if (dist < 350) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.player.pos.x, this.player.pos.y);
                    this.ctx.lineTo(this.partner.pos.x, this.partner.pos.y);
                    
                    const grad = this.ctx.createLinearGradient(this.player.pos.x, this.player.pos.y, this.partner.pos.x, this.partner.pos.y);
                    grad.addColorStop(0, CONFIG.colors.player);
                    grad.addColorStop(1, CONFIG.colors.partner);
                    
                    this.ctx.strokeStyle = grad;
                    this.ctx.lineWidth = Math.max(0.5, (1 - dist/350) * 3);
                    this.ctx.globalAlpha = Math.max(0, 1 - dist/350);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Engine();
});
