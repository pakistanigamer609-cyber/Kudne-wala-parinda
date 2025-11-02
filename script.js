// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const homeScreen = document.getElementById('home-screen');
const gameOverScreen = document.getElementById('game-over');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const homeButton = document.getElementById('home-button');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const circleReveal = document.getElementById('circle-reveal');
const explosion = document.getElementById('explosion');
const countdownScreen = document.getElementById('countdown-screen');
const countdownNumber = document.getElementById('countdown-number');
const countdownText = document.getElementById('countdown-text');
const musicToggle = document.getElementById('music-toggle');
const soundToggle = document.getElementById('sound-toggle');
const leaderboardButton = document.getElementById('leaderboard-button');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const closeLeaderboard = document.getElementById('close-leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const tabButtons = document.querySelectorAll('.tab-btn');
const nameInputContainer = document.getElementById('name-input-container');
const playerNameInput = document.getElementById('player-name');
const saveScoreButton = document.getElementById('save-score-button');

// Game state
let gameRunning = false;
let score = 0;
let difficulty = 'easy';
let isAnimating = false;
let countdownTimer = null;

// Sound state
let musicEnabled = true;
let soundEnabled = true;
let backgroundMusic = null;
let audioContext = null;
let audioInitialized = false;

// Difficulty settings
const difficultySettings = {
    easy: {
        pipeGap: 180,
        pipeSpeed: 2,
        gravity: 0.4,
        lift: -9
    },
    medium: {
        pipeGap: 150,
        pipeSpeed: 3,
        gravity: 0.5,
        lift: -10
    },
    hard: {
        pipeGap: 120,
        pipeSpeed: 4,
        gravity: 0.6,
        lift: -11
    }
};

// Audio Context and Sound Functions
function initAudio() {
    if (audioInitialized) return;
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
        
        // Resume audio context on user interaction (required by browsers)
        document.addEventListener('click', function() {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
        
    } catch (e) {
        console.log('Web Audio API is not supported in this browser');
        musicToggle.style.display = 'none';
        soundToggle.style.display = 'none';
    }
}

// Background Music (simple generated melody)
function playBackgroundMusic() {
    if (!musicEnabled || !audioContext) return;
    
    // Stop existing music
    if (backgroundMusic) {
        clearTimeout(backgroundMusic);
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    // Create a simple melody pattern
    const notes = [330, 392, 440, 392, 330, 294, 330];
    let time = audioContext.currentTime;
    
    notes.forEach((note, index) => {
        oscillator.frequency.setValueAtTime(note, time);
        time += 0.5;
    });
    
    oscillator.start();
    oscillator.stop(time);
    
    // Loop the music
    backgroundMusic = setTimeout(() => {
        if (musicEnabled && audioContext) {
            playBackgroundMusic();
        }
    }, (notes.length * 500) + 100);
}

function stopBackgroundMusic() {
    if (backgroundMusic) {
        clearTimeout(backgroundMusic);
        backgroundMusic = null;
    }
}

// Sound Effects
function playFlapSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playScoreSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playExplosionSound() {
    if (!soundEnabled || !audioContext) return;
    
    // Create multiple oscillators for explosion effect
    for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        const baseFreq = 100 + Math.random() * 50;
        oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    }
}

function playCountdownSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playStartSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3); // C6
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);
}

function playButtonSound() {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Firebase Leaderboard Functions
async function saveScoreToLeaderboard(playerName, score, difficulty) {
    try {
        if (!window.firebaseDb) {
            console.error('Firebase not initialized');
            return false;
        }

        const scoresRef = window.firebaseCollection(window.firebaseDb, 'scores');
        await window.firebaseAddDoc(scoresRef, {
            name: playerName,
            score: score,
            difficulty: difficulty,
            timestamp: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error saving score:', error);
        return false;
    }
}

async function loadLeaderboard(difficulty = 'easy') {
    try {
        if (!window.firebaseDb) {
            leaderboardList.innerHTML = '<div class="loading-text">Firebase not available</div>';
            return;
        }

        leaderboardList.innerHTML = '<div class="loading-text">Loading leaderboard...</div>';

        const scoresRef = window.firebaseCollection(window.firebaseDb, 'scores');
        const q = window.firebaseQuery(
            scoresRef,
            window.firebaseOrderBy('score', 'desc'),
            window.firebaseLimit(10)
        );

        const querySnapshot = await window.firebaseGetDocs(q);
        const scores = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.difficulty === difficulty) {
                scores.push(data);
            }
        });

        displayLeaderboard(scores);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = '<div class="loading-text">Error loading leaderboard</div>';
    }
}

function displayLeaderboard(scores) {
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<div class="empty-leaderboard">No scores yet! Be the first to play!</div>';
        return;
    }

    let leaderboardHTML = '';
    scores.forEach((score, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        leaderboardHTML += `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${medal}</div>
                <div class="leaderboard-name">${score.name}</div>
                <div class="leaderboard-score">${score.score}</div>
                <div class="leaderboard-difficulty">${score.difficulty}</div>
            </div>
        `;
    });

    leaderboardList.innerHTML = leaderboardHTML;
}

function showNameInput() {
    nameInputContainer.style.display = 'flex';
    playerNameInput.value = '';
    playerNameInput.focus();
}

function hideNameInput() {
    nameInputContainer.style.display = 'none';
}

// Set canvas to full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Bird properties - Redesigned bird
const bird = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    gravity: 0,
    lift: 0,
    velocity: 0,
    
    init: function() {
        const settings = difficultySettings[difficulty];
        this.width = Math.min(canvas.width * 0.05, 50);
        this.height = this.width * 0.8;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.gravity = settings.gravity;
        this.lift = settings.lift;
        this.velocity = 0;
    },
    
    draw: function() {
        // Bird body
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add shading to body
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.ellipse(this.x - this.width/6, this.y, this.width/3, this.height/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird wing
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/4, this.y, this.width/2.5, this.height/2.5, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird head
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y - this.height/6, this.width/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 + this.width/8, this.y - this.height/6, this.width/8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 + this.width/6, this.y - this.height/6, this.width/12, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird beak
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 + this.width/3, this.y - this.height/6);
        ctx.lineTo(this.x + this.width/2 + this.width/2, this.y);
        ctx.lineTo(this.x + this.width/2 + this.width/3, this.y + this.height/6);
        ctx.closePath();
        ctx.fill();
        
        // Bird feather
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2 + this.width/2.5, this.y, this.width/4, this.width/8, 0, 0, Math.PI);
        ctx.fill();
    },
    
    update: function() {
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // Floor collision
        if (this.y + this.height/2 >= canvas.height - groundHeight) {
            this.y = canvas.height - groundHeight - this.height/2;
            if (gameRunning) gameOver();
        }
        
        // Ceiling collision
        if (this.y - this.height/2 <= 0) {
            this.y = this.height/2;
            this.velocity = 0;
        }
    },
    
    flap: function() {
        // Only flap if game is running and not in animation
        if (gameRunning && !isAnimating) {
            this.velocity = this.lift;
            playFlapSound();
        }
    }
};

// Pipes
const pipes = {
    position: [],
    gap: 0,
    minYPos: 0,
    maxYPos: 0,
    width: 0,
    speed: 0,
    
    init: function() {
        const settings = difficultySettings[difficulty];
        this.gap = settings.pipeGap;
        this.minYPos = canvas.height * 0.1;
        this.maxYPos = canvas.height * 0.6;
        this.width = Math.min(canvas.width * 0.08, 80);
        this.speed = settings.pipeSpeed;
        this.position = [];
    },
    
    draw: function() {
        ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < this.position.length; i++) {
            const pipe = this.position[i];
            
            // Top pipe
            ctx.fillRect(pipe.x, 0, this.width, pipe.topHeight);
            
            // Bottom pipe
            ctx.fillRect(pipe.x, pipe.topHeight + this.gap, this.width, canvas.height);
            
            // Pipe caps
            ctx.fillStyle = '#388E3C';
            ctx.fillRect(pipe.x - 5, pipe.topHeight - 15, this.width + 10, 15);
            ctx.fillRect(pipe.x - 5, pipe.topHeight + this.gap, this.width + 10, 15);
        }
        ctx.fillStyle = '#4CAF50';
    },
    
    update: function() {
        if (gameRunning && !isAnimating) {
            // Add new pipe every 120 frames
            if (frames % 120 === 0) {
                const topHeight = Math.floor(Math.random() * (this.maxYPos - this.minYPos)) + this.minYPos;
                this.position.push({
                    x: canvas.width,
                    topHeight: topHeight,
                    passed: false
                });
            }
            
            for (let i = 0; i < this.position.length; i++) {
                const pipe = this.position[i];
                pipe.x -= this.speed;
                
                // Check for collision
                if (
                    bird.x + bird.width/2 > pipe.x && 
                    bird.x - bird.width/2 < pipe.x + this.width && 
                    (bird.y - bird.height/2 < pipe.topHeight || 
                     bird.y + bird.height/2 > pipe.topHeight + this.gap)
                ) {
                    gameOver();
                }
                
                // Check if bird passed the pipe
                if (!pipe.passed && bird.x > pipe.x + this.width) {
                    pipe.passed = true;
                    score++;
                    scoreDisplay.textContent = score;
                    playScoreSound();
                }
                
                // Remove pipes that are off screen
                if (pipe.x + this.width < 0) {
                    this.position.shift();
                }
            }
        }
    }
};

// Ground
const groundHeight = 80;
const ground = {
    draw: function() {
        // Ground
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
        
        // Grass on top
        ctx.fillStyle = '#7CFC00';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 15);
    }
};

// Background elements
const background = {
    clouds: [],
    
    init: function() {
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height * 0.6),
                width: 80 + Math.random() * 120,
                speed: 0.5 + Math.random() * 1
            });
        }
    },
    
    draw: function() {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#70c5ce');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.width/4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width/4, cloud.y - cloud.width/8, cloud.width/4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width/2, cloud.y, cloud.width/4, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    update: function() {
        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = canvas.width + cloud.width;
                cloud.y = Math.random() * (canvas.height * 0.6);
            }
        }
    }
};

let frames = 0;

// Countdown function
function startCountdown() {
    let count = 5;
    countdownScreen.style.display = 'flex';
    countdownNumber.textContent = count;
    playCountdownSound();
    
    countdownTimer = setInterval(() => {
        count--;
        countdownNumber.textContent = count;
        playCountdownSound();
        
        if (count === 0) {
            clearInterval(countdownTimer);
            countdownScreen.style.display = 'none';
            isAnimating = false; // Animation finished, game can start
            startGameplay();
        }
    }, 1000);
}

// Animation functions
function playCircleReveal() {
    isAnimating = true;
    circleReveal.style.display = 'block';
    circleReveal.style.animation = 'none';
    void circleReveal.offsetWidth; // Trigger reflow
    circleReveal.style.animation = 'circleExpand 1s ease-in-out forwards';
    
    setTimeout(() => {
        circleReveal.style.display = 'none';
        // Start countdown after circle animation
        startCountdown();
    }, 1000);
}

function playExplosion(x, y) {
    isAnimating = true;
    explosion.style.left = (x - 50) + 'px';
    explosion.style.top = (y - 50) + 'px';
    explosion.style.display = 'block';
    explosion.style.animation = 'none';
    void explosion.offsetWidth; // Trigger reflow
    explosion.style.animation = 'explode 0.8s ease-out forwards';
    
    // Play explosion sound
    playExplosionSound();
    
    // Create particles
    createParticles(x, y);
    
    setTimeout(() => {
        explosion.style.display = 'none';
    }, 800);
}

function createParticles(x, y) {
    const particlesContainer = document.createElement('div');
    particlesContainer.style.position = 'absolute';
    particlesContainer.style.top = '0';
    particlesContainer.style.left = '0';
    particlesContainer.style.width = '100%';
    particlesContainer.style.height = '100%';
    particlesContainer.style.pointerEvents = 'none';
    particlesContainer.style.zIndex = '20';
    document.getElementById('game-container').appendChild(particlesContainer);
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const duration = 0.5 + Math.random() * 0.5;
        
        particle.style.animation = `none`;
        void particle.offsetWidth; // Trigger reflow
        
        particle.style.transition = `all ${duration}s ease-out`;
        particlesContainer.appendChild(particle);
        
        // Trigger the animation
        setTimeout(() => {
            particle.style.left = (x + Math.cos(angle) * distance) + 'px';
            particle.style.top = (y + Math.sin(angle) * distance) + 'px';
            particle.style.opacity = '0';
        }, 10);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, duration * 1000 + 100);
    }
    
    // Remove container after all particles are gone
    setTimeout(() => {
        if (particlesContainer.parentNode) {
            particlesContainer.parentNode.removeChild(particlesContainer);
        }
        isAnimating = false; // All explosion animations finished
    }, 1500);
}

// Game functions
function startGame() {
    playButtonSound();
    playStartSound();
    playCircleReveal();
    
    // Hide all screens
    homeScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    hideNameInput();
    
    scoreDisplay.style.display = 'block';
    canvas.style.display = 'block';
    
    // Initialize game elements based on difficulty
    bird.init();
    pipes.init();
    background.init();
}

function startGameplay() {
    // This is called after countdown finishes
    gameRunning = true;
    score = 0;
    scoreDisplay.textContent = score;
    
    // Start background music
    if (musicEnabled) {
        playBackgroundMusic();
    }
    
    // Start game loop
    gameLoop();
}

function gameOver() {
    // Stop background music
    stopBackgroundMusic();
    
    // Play explosion at bird position
    playExplosion(bird.x, bird.y);
    
    setTimeout(() => {
        gameRunning = false;
        finalScoreDisplay.textContent = score;
        gameOverScreen.style.display = 'flex';
        
        // Animate game over screen appearance
        gameOverScreen.style.animation = 'none';
        void gameOverScreen.offsetWidth; // Trigger reflow
        gameOverScreen.style.animation = 'fadeInScale 0.5s ease-out forwards';
        
        canvas.style.display = 'none';
        scoreDisplay.style.display = 'none';
        
        // Show name input for scores above 0
        if (score > 0) {
            showNameInput();
        } else {
            hideNameInput();
        }
    }, 500);
}

function goToHome() {
    playButtonSound();
    gameOverScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    homeScreen.style.display = 'flex';
    homeScreen.style.animation = 'none';
    void homeScreen.offsetWidth; // Trigger reflow
    homeScreen.style.animation = 'fadeIn 0.5s ease-out forwards';
    hideNameInput();
    
    // Start background music on home screen
    if (musicEnabled) {
        playBackgroundMusic();
    }
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw background
    background.update();
    background.draw();
    
    // Update and draw pipes
    pipes.update();
    pipes.draw();
    
    // Update and draw ground
    ground.draw();
    
    // Update and draw bird
    bird.update();
    bird.draw();
    
    frames++;
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Sound control functions
function toggleMusic() {
    musicEnabled = !musicEnabled;
    musicToggle.textContent = musicEnabled ? '🎵' : '🔇';
    
    if (musicEnabled) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
    
    playButtonSound();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    playButtonSound();
}

// Event listeners
difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
        difficultyButtons.forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');
        difficulty = this.getAttribute('data-difficulty');
        playButtonSound();
    });
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', function() {
    hideNameInput();
    startGame();
});
homeButton.addEventListener('click', goToHome);
musicToggle.addEventListener('click', toggleMusic);
soundToggle.addEventListener('click', toggleSound);

// Leaderboard event listeners
leaderboardButton.addEventListener('click', function() {
    playButtonSound();
    homeScreen.style.display = 'none';
    leaderboardScreen.style.display = 'flex';
    loadLeaderboard('easy');
});

closeLeaderboard.addEventListener('click', function() {
    playButtonSound();
    leaderboardScreen.style.display = 'none';
    homeScreen.style.display = 'flex';
});

tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        playButtonSound();
        const difficulty = this.getAttribute('data-difficulty');
        
        // Update active tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Load leaderboard for selected difficulty
        loadLeaderboard(difficulty);
    });
});

saveScoreButton.addEventListener('click', async function() {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    if (playerName.length > 15) {
        alert('Name must be 15 characters or less!');
        return;
    }
    
    playButtonSound();
    this.disabled = true;
    this.textContent = 'Saving...';
    
    const success = await saveScoreToLeaderboard(playerName, score, difficulty);
    
    if (success) {
        this.textContent = 'Saved!';
        setTimeout(() => {
            hideNameInput();
            this.disabled = false;
            this.textContent = 'Save Score';
        }, 1000);
    } else {
        alert('Failed to save score. Please try again.');
        this.disabled = false;
        this.textContent = 'Save Score';
    }
});

// Add Enter key support for name input
playerNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        saveScoreButton.click();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        // Only allow flapping when game is running and not animating
        if (gameRunning && !isAnimating) {
            bird.flap();
        } else if (homeScreen.style.display !== 'none' && !isAnimating) {
            startGame();
        } else if (gameOverScreen.style.display === 'flex' && !isAnimating) {
            startGame();
        }
        e.preventDefault();
    }
});

canvas.addEventListener('click', function() {
    // Only allow flapping when game is running and not animating
    if (gameRunning && !isAnimating) {
        bird.flap();
    }
});

// Initialize
window.addEventListener('load', function() {
    resizeCanvas();
    bird.init();
    background.init();
    initAudio();
    
    // Start background music on home screen
    if (musicEnabled) {
        // Small delay to ensure audio context is ready
        setTimeout(() => {
            playBackgroundMusic();
        }, 500);
    }
    
    // Pre-load easy leaderboard
    setTimeout(() => {
        loadLeaderboard('easy');
    }, 1000);
});

window.addEventListener('resize', function() {
    resizeCanvas();
    if (!gameRunning) {
        bird.init();
        background.init();
    }
});