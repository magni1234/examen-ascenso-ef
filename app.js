/**
 * Plataforma de Ascenso Docente 2026 - Educación Física
 * Lógica de Aplicación (app.js)
 */

// -------------------------------------------------------------
// 1. CONFIGURACIÓN DEL ESTADO GLOBAL
// -------------------------------------------------------------
const state = {
    // Modo de conexión
    supabaseClient: null,
    isLocalDemo: true, // Default if Supabase isn't configured
    
    // Sesión de Usuario
    currentUser: null, // { id, nombre, username }
    
    // Datos cargados
    simulacros: [],
    preguntas: {}, // Map of examId -> array of questions
    intentos: [],  // User attempts
    
    // Estado del examen activo
    activeExam: null,
    activeQuestions: [],
    currentQuestionIndex: 0,
    userAnswers: {}, // Map of questionNumber -> selectedOption ('A','B','C')
    userScores: {},  // Map of questionNumber -> score (0 or 2.0)
    currentScore: 0.0,
    timerInterval: null,
    
    // Datos locales estáticos (Fallback de preguntas)
    localExams: [
        {
            id: 1,
            titulo: 'Examen de Ascenso Docente 2025 - Educación Física',
            descripcion: 'Recopilación de casuísticas pedagógicas y disciplinares reales de la evaluación del año 2025. Enfocado en corporeidad y evaluación formativa.'
        },
        {
            id: 2,
            titulo: 'Examen de Ascenso Docente 2023 - Educación Física',
            descripcion: 'Casuísticas y situaciones prácticas de la evaluación de ascenso 2023. Énfasis en el desarrollo psicomotor, hidratación y estilos de aprendizaje.'
        },
        {
            id: 3,
            titulo: 'Examen de Ascenso Docente 2022 - Educación Física',
            descripcion: 'Preguntas oficiales de ascenso docente 2022. Cubre habilidades sociomotrices, inclusión (DUA), activación corporal y prevención de lesiones.'
        }
    ],
    
    localQuestions: (typeof localQuestions !== 'undefined') ? localQuestions : {}
};

// -------------------------------------------------------------
// AUDIO ENGINE (Web Audio API Programmatic Synthesized Sounds)
// -------------------------------------------------------------
const playCorrectSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.25);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
        gain2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.13);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
        console.error("Audio error:", e);
    }
};

const playIncorrectSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.35);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
        console.error("Audio error:", e);
    }
};

const playCheerSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        const playNote = (freq, startTime, duration, type = 'triangle', volume = 0.15) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // Happy arpeggio
        playNote(392.00, now, 0.15);        // G4
        playNote(523.25, now + 0.08, 0.15); // C5
        playNote(659.25, now + 0.16, 0.15); // E5
        playNote(783.99, now + 0.24, 0.4, 'sine', 0.18); // G5
        playNote(1046.50, now + 0.32, 0.6, 'sine', 0.18); // C6
        
        // Cheering rising sweep ("Yeee!")
        const sweepOsc = ctx.createOscillator();
        const sweepGain = ctx.createGain();
        sweepOsc.connect(sweepGain);
        sweepGain.connect(ctx.destination);
        
        sweepOsc.type = 'triangle';
        sweepOsc.frequency.setValueAtTime(320, now + 0.2);
        sweepOsc.frequency.exponentialRampToValueAtTime(1100, now + 0.65);
        
        sweepGain.gain.setValueAtTime(0, now + 0.2);
        sweepGain.gain.linearRampToValueAtTime(0.12, now + 0.25);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        
        sweepOsc.start(now + 0.2);
        sweepOsc.stop(now + 0.75);
        
        // Detuned oscillator for fullness
        const sweepOsc2 = ctx.createOscillator();
        const sweepGain2 = ctx.createGain();
        sweepOsc2.connect(sweepGain2);
        sweepGain2.connect(ctx.destination);
        
        sweepOsc2.type = 'sine';
        sweepOsc2.frequency.setValueAtTime(330, now + 0.22);
        sweepOsc2.frequency.exponentialRampToValueAtTime(1120, now + 0.63);
        
        sweepGain2.gain.setValueAtTime(0, now + 0.22);
        sweepGain2.gain.linearRampToValueAtTime(0.10, now + 0.27);
        sweepGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        
        sweepOsc2.start(now + 0.22);
        sweepOsc2.stop(now + 0.7);
        
        // Filtered noise for applause
        const bufferSize = ctx.sampleRate * 0.9;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 950;
        filter.Q.value = 1.2;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now + 0.15);
        noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.25);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        
        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noiseSource.start(now + 0.15);
        noiseSource.stop(now + 0.9);
        
    } catch (e) {
        console.error("Audio error:", e);
    }
};

// -------------------------------------------------------------
// 2. GENERADOR DETERMINÍSTICO DE 150 USUARIOS
// -------------------------------------------------------------
const generate150Users = () => {
    const users = [];
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 1; i <= 150; i++) {
        const name = 'Maestro de Educación Física';
        const username = `COD-${String(i).padStart(3, '0')}`;
        
        // Generar contraseña determinística (letras y números) sin desbordamiento
        let password = '';
        for (let j = 0; j < 8; j++) {
            const hash = (i * 1234567 + j * 9876543) % 1000003;
            const idx = hash % chars.length;
            password += chars.charAt(idx);
        }
        
        users.push({ id: i, nombre: name, username, password });
    }
    return users;
};

// Generate test users list
const testUsers = generate150Users();

// -------------------------------------------------------------
// 3. CONTROL DE PERSISTENCIA (SUPABASE VS LOCALSTORAGE)
// -------------------------------------------------------------
const initSupabase = () => {
    // CONFIGURACIÓN POR DEFECTO (Para producción/compartir con otros docentes):
    // Pega aquí tu Project URL y tu Anon Key si deseas que se conecte automáticamente para todos
    const defaultUrl = 'https://cwbzfmzjwkwnnhtuxfra.supabase.co'; 
    const defaultKey = 'sb_publishable_1boYvcBYJFrMr-nrEgekMw_zBc417tI'; 
    
    const savedUrl = localStorage.getItem('supabase_url') || defaultUrl;
    const savedKey = localStorage.getItem('supabase_key') || defaultKey;
    
    if (savedUrl && savedKey) {
        try {
            state.supabaseClient = supabase.createClient(savedUrl, savedKey);
            state.isLocalDemo = false;
            console.log("Supabase Client initialized successfully.");
        } catch (e) {
            console.error("Error creating Supabase client:", e);
            state.isLocalDemo = true;
        }
    } else {
        state.isLocalDemo = true;
        console.log("Running in LOCAL DEMO MODE (No Supabase config found).");
    }
    updateConnectionIndicator();
};

const updateConnectionIndicator = () => {
    const trigger = document.getElementById('btn-open-config');
    if (!trigger) return;
    
    if (state.isLocalDemo) {
        trigger.innerHTML = `<i data-lucide="database"></i> Modo Demo Local (Configurar Supabase)`;
        trigger.style.color = 'var(--slate-600)';
    } else {
        trigger.innerHTML = `<i data-lucide="database"></i> Conectado a Supabase (Cambiar)`;
        trigger.style.color = 'var(--primary)';
    }
    lucide.createIcons();
};

// -------------------------------------------------------------
// 4. OPERACIONES DE DATOS (ABSTRACCIÓN DE APIS)
// -------------------------------------------------------------

// Autenticación de Usuario
const apiLogin = async (username, password) => {
    username = username.trim().toUpperCase();
    password = password.trim();
    
    if (state.isLocalDemo) {
        // Local validation against generated array
        const user = testUsers.find(u => u.username === username && u.password === password);
        if (user) {
            return { data: user, error: null };
        }
        return { data: null, error: 'Usuario o contraseña incorrectos en Modo Demo.' };
    } else {
        // Supabase database validation query
        try {
            const { data, error } = await state.supabaseClient
                .from('docentes')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .maybeSingle();
            
            if (error) throw error;
            if (!data) return { data: null, error: 'Usuario o contraseña incorrectos.' };
            return { data: data, error: null };
        } catch (e) {
            console.error("Supabase Login Error, falling back to Local Validation:", e);
            // In case tables aren't set up yet but credentials match local arrays
            const user = testUsers.find(u => u.username === username && u.password === password);
            if (user) {
                return { data: user, error: null };
            }
            return { data: null, error: `Error de BD: ${e.message}` };
        }
    }
};

// Cargar Exámenes y Preguntas
const apiLoadExams = async () => {
    if (state.isLocalDemo) {
        state.simulacros = state.localExams;
        state.preguntas = state.localQuestions;
        return;
    }
    
    try {
        // Load simulated exams from DB
        const { data: exams, error: examsErr } = await state.supabaseClient
            .from('simulacros')
            .select('*')
            .order('id', { ascending: true });
        
        if (examsErr) throw examsErr;
        state.simulacros = exams && exams.length ? exams : state.localExams;
        
        // Load questions
        const { data: questions, error: questErr } = await state.supabaseClient
            .from('preguntas')
            .select('*')
            .order('numero', { ascending: true });
        
        if (questErr) throw questErr;
        
        if (questions && questions.length) {
            // Group by simulacro_id
            const grouped = {};
            questions.forEach(q => {
                if (!grouped[q.simulacro_id]) grouped[q.simulacro_id] = [];
                grouped[q.simulacro_id].push(q);
            });
            state.preguntas = grouped;
        } else {
            state.preguntas = state.localQuestions;
        }
    } catch (e) {
        console.error("Error loading data from Supabase, loading local copy:", e);
        state.simulacros = state.localExams;
        state.preguntas = state.localQuestions;
    }
};

// Cargar Intentos Completados por el Docente
const apiLoadAttempts = async () => {
    if (!state.currentUser) return;
    
    if (state.isLocalDemo) {
        // Load from LocalStorage
        const key = `intentos_${state.currentUser.username}`;
        const saved = localStorage.getItem(key);
        state.intentos = saved ? JSON.parse(saved) : [];
        return;
    }
    
    try {
        const { data, error } = await state.supabaseClient
            .from('intentos')
            .select('*')
            .eq('docente_id', state.currentUser.id);
        
        if (error) throw error;
        state.intentos = data || [];
        
        // Sync to localstorage just in case
        localStorage.setItem(`intentos_${state.currentUser.username}`, JSON.stringify(state.intentos));
    } catch (e) {
        console.error("Error loading attempts from Supabase, loading localStorage fallback:", e);
        const key = `intentos_${state.currentUser.username}`;
        const saved = localStorage.getItem(key);
        state.intentos = saved ? JSON.parse(saved) : [];
    }
};

// Guardar Intento Realizado
const apiSaveAttempt = async (examId, score, answers) => {
    if (!state.currentUser) return { error: "No user logged in." };
    
    const newAttempt = {
        docente_id: state.currentUser.id,
        simulacro_id: parseInt(examId),
        puntaje_obtenido: parseFloat(score),
        respuestas_usuario: answers,
        completado_at: new Date().toISOString()
    };
    
    // Check if attempt already exists locally to avoid duplication
    const localKey = `intentos_${state.currentUser.username}`;
    let localAttempts = [];
    const saved = localStorage.getItem(localKey);
    if (saved) {
        localAttempts = JSON.parse(saved);
    }
    
    // Prevent duplicated attempts
    const exists = localAttempts.some(att => parseInt(att.simulacro_id) === parseInt(examId));
    if (exists) {
        return { data: null, error: "Ya has completado tu único intento para este examen." };
    }
    
    // Push local copy
    localAttempts.push(newAttempt);
    localStorage.setItem(localKey, JSON.stringify(localAttempts));
    state.intentos = localAttempts;
    
    if (state.isLocalDemo) {
        return { data: newAttempt, error: null };
    }
    
    try {
        const { data, error } = await state.supabaseClient
            .from('intentos')
            .insert([newAttempt])
            .select();
        
        if (error) {
            // Check for unique constraint violation in database
            if (error.code === '23505') {
                return { data: null, error: "Ya has completado tu único intento para este examen." };
            }
            throw error;
        }
        return { data: data[0], error: null };
    } catch (e) {
        console.error("Error saving attempt in Supabase, successfully saved locally:", e);
        // It's saved locally, so we return success on local fallback
        return { data: newAttempt, error: null };
    }
};

// Guardar Progreso Temporal (Pausa)
const savePausedProgress = () => {
    if (!state.currentUser || !state.activeExam) return;
    const progressKey = `progreso_${state.currentUser.username}_${state.activeExam.id}`;
    const progressData = {
        currentQuestionIndex: state.currentQuestionIndex,
        userAnswers: state.userAnswers,
        userScores: state.userScores,
        currentScore: state.currentScore,
        timeRemaining: state.timeRemaining
    };
    localStorage.setItem(progressKey, JSON.stringify(progressData));
};

// Eliminar Progreso Temporal (Al enviar)
const deletePausedProgress = (examId) => {
    if (!state.currentUser) return;
    const progressKey = `progreso_${state.currentUser.username}_${examId}`;
    localStorage.removeItem(progressKey);
};

// -------------------------------------------------------------
// 5. CONTROLADOR DE VISTAS (SPA NAVIGATION)
// -------------------------------------------------------------
const showView = (viewId) => {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    const activeView = document.getElementById(viewId);
    if (activeView) activeView.classList.remove('hidden');
    
    // Toggle header display
    const header = document.getElementById('app-header');
    if (viewId === 'view-login') {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// -------------------------------------------------------------
// 6. CONTROLADORES DE PANTALLA Y LÓGICA DE INTERFAZ
// -------------------------------------------------------------

// Lógica de Login
const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const errorAlert = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Visual loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Ingresando...</span> <div class="spinner"></div>`;
    errorAlert.classList.add('hidden');
    
    const { data: user, error } = await apiLogin(usernameInput.value, passwordInput.value);
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Ingresar a la Plataforma</span> <i data-lucide="chevron-right"></i>`;
    lucide.createIcons();
    
    if (error) {
        errorText.innerText = error;
        errorAlert.classList.remove('hidden');
        return;
    }
    
    // Success Login
    state.currentUser = user;
    document.getElementById('user-display-name').innerText = user.nombre;
    document.getElementById('dashboard-user-name').innerText = user.nombre.split(' ')[0];
    
    // Clear credentials
    usernameInput.value = '';
    passwordInput.value = '';
    
    // Load courses, stats, and dashboard
    await apiLoadExams();
    await apiLoadAttempts();
    renderDashboard();
    showView('view-dashboard');
};

// Renderizar Dashboard
const renderDashboard = () => {
    const container = document.getElementById('exams-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Quotes arrays for physical education teachers
    const quotes = [
        '"El movimiento es una medicina para crear el cambio físico, emocional y mental."',
        '"La educación física no es solo mover el cuerpo; es entrenar la mente para el juego de la vida."',
        '"Un gran docente de educación física no enseña deportes, enseña valores a través del movimiento."',
        '"El cuerpo humano es el carruaje de la mente; mantenlo en movimiento y saludable."',
        '"Fomentar hábitos saludables hoy es construir el bienestar de las generaciones de mañana."'
    ];
    // Dynamic quote
    document.getElementById('motivational-quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];
    
    let completedCount = 0;
    let totalScoreObtained = 0.0;
    
    state.simulacros.forEach(exam => {
        // Check if there is a completed attempt
        const attempt = state.intentos.find(att => parseInt(att.simulacro_id) === parseInt(exam.id));
        const isCompleted = !!attempt;
        const examQuestions = state.preguntas[exam.id] || state.preguntas[String(exam.id)] || state.preguntas[Number(exam.id)] || [];
        const maxScore = examQuestions.length * 2.0;
        
        if (isCompleted) {
            completedCount++;
            totalScoreObtained += parseFloat(attempt.puntaje_obtenido);
        }
        
        const progressKey = `progreso_${state.currentUser.username}_${exam.id}`;
        const hasProgress = !isCompleted && !!localStorage.getItem(progressKey);
        
        let cardClass = 'available';
        let badgeHtml = '<i data-lucide="book-open"></i> Disponible';
        let badgeClass = 'available';
        let buttonText = 'Iniciar Examen';
        let buttonClass = 'btn-primary';
        let buttonIcon = 'play';
        
        if (isCompleted) {
            cardClass = 'completed';
            badgeHtml = '<i data-lucide="check-check"></i> Completado';
            badgeClass = 'completed';
            buttonText = 'Ver Resultados';
            buttonClass = 'btn-outline';
            buttonIcon = 'eye';
        } else if (hasProgress) {
            cardClass = 'in-progress';
            badgeHtml = '<i data-lucide="pause-circle"></i> En Curso';
            badgeClass = 'in-progress';
            buttonText = 'Continuar Examen';
            buttonClass = 'btn-warning';
            buttonIcon = 'arrow-right';
        }
        
        let yearClass = '';
        if (exam.titulo.includes('2022')) yearClass = 'exam-card-2022';
        else if (exam.titulo.includes('2023')) yearClass = 'exam-card-2023';
        else if (exam.titulo.includes('2025')) yearClass = 'exam-card-2025';
        
        const card = document.createElement('div');
        card.className = `exam-card ${cardClass} ${yearClass}`;
        card.innerHTML = `
            <div class="exam-card-header">
                <span class="exam-badge ${badgeClass}">
                    ${badgeHtml}
                </span>
                <span class="question-value-badge">${examQuestions.length} Preguntas</span>
            </div>
            <h4 class="exam-card-title">${exam.titulo}</h4>
            <p class="exam-card-desc">${exam.descripcion}</p>
            <div class="exam-card-meta">
                <div class="exam-meta-item">
                    <i data-lucide="award"></i>
                    <span>Puntaje: <strong>${isCompleted ? parseFloat(attempt.puntaje_obtenido).toFixed(2) : '0.00'}</strong> / ${maxScore.toFixed(2)} pts</span>
                </div>
                <div class="exam-meta-item">
                    <i data-lucide="shield"></i>
                    <span>Intento: <strong>${isCompleted ? '1/1' : '0/1'}</strong></span>
                </div>
            </div>
            <button class="btn ${buttonClass} btn-block" onclick="handleExamClick(${exam.id})">
                ${buttonText}
                <i data-lucide="${buttonIcon}"></i>
            </button>
        `;
        container.appendChild(card);
    });
    
    // Update dashboard statistics
    const totalExams = state.simulacros.length;
    const progressPercent = totalExams > 0 ? Math.round((completedCount / totalExams) * 100) : 0;
    const avgScore = completedCount > 0 ? (totalScoreObtained / completedCount) : 0.0;
    
    document.getElementById('stats-progress-percent').innerText = progressPercent;
    document.getElementById('stats-progress-fill').style.width = `${progressPercent}%`;
    document.getElementById('stats-progress-desc').innerText = `${completedCount} de ${totalExams} exámenes completados`;
    
    document.getElementById('stats-avg-score').innerText = avgScore.toFixed(2);
    // Fill calculated out of 120 points max
    const avgFillPercent = Math.min(Math.round((avgScore / 120.0) * 100), 100);
    document.getElementById('stats-avg-fill').style.width = `${avgFillPercent}%`;
    
    const attemptsLeft = totalExams - completedCount;
    document.getElementById('stats-attempts-left').innerText = attemptsLeft;
    
    lucide.createIcons();
};

// Click en un Examen
window.handleExamClick = (examId) => {
    playCheerSound();
    const exam = state.simulacros.find(e => e.id === examId);
    if (!exam) return;
    
    const attempt = state.intentos.find(att => parseInt(att.simulacro_id) === parseInt(examId));
    if (attempt) {
        // User already took it, show results immediately
        showExamResults(exam, attempt);
    } else {
        // Open exam player
        startExam(exam);
    }
};

// Lógica de Temporizador de Examen (3 horas)
const startCountdownTimer = () => {
    stopCountdownTimer();
    
    if (state.timeRemaining === undefined || state.timeRemaining === null) {
        state.timeRemaining = 3 * 60 * 60; // 3 horas en segundos
    }
    
    const updateTimerDisplay = () => {
        const hours = Math.floor(state.timeRemaining / 3600);
        const minutes = Math.floor((state.timeRemaining % 3600) / 60);
        const seconds = state.timeRemaining % 60;
        
        const pad = (num) => String(num).padStart(2, '0');
        const timerVal = document.getElementById('player-timer-value');
        if (timerVal) {
            timerVal.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
    };
    
    updateTimerDisplay();
    
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        if (state.timeRemaining <= 0) {
            stopCountdownTimer();
            alert("El tiempo de 3 horas ha concluido. Se registrarán tus respuestas de forma automática.");
            submitFinishedExam();
        } else {
            updateTimerDisplay();
            // Guardar progreso periódicamente
            savePausedProgress();
        }
    }, 1000);
};

const stopCountdownTimer = () => {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
};

// Iniciar Examen
const startExam = (exam) => {
    state.activeExam = exam;
    state.activeQuestions = state.preguntas[exam.id] || state.preguntas[String(exam.id)] || state.preguntas[Number(exam.id)] || [];
    
    // Verificar si hay progreso pausado
    const progressKey = `progreso_${state.currentUser.username}_${exam.id}`;
    const savedProgress = localStorage.getItem(progressKey);
    
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        state.currentQuestionIndex = progress.currentQuestionIndex;
        state.userAnswers = progress.userAnswers || {};
        state.userScores = progress.userScores || {};
        state.currentScore = parseFloat(progress.currentScore) || 0.0;
        state.timeRemaining = parseInt(progress.timeRemaining) || (3 * 60 * 60);
    } else {
        state.currentQuestionIndex = 0;
        state.userAnswers = {};
        state.userScores = {};
        state.currentScore = 0.0;
        state.timeRemaining = 3 * 60 * 60;
    }
    
    document.getElementById('player-exam-title').innerText = exam.titulo;
    document.getElementById('player-current-score').innerText = state.currentScore.toFixed(2);
    
    loadQuestion(state.currentQuestionIndex);
    startCountdownTimer();
    showView('view-exam-player');
};

// Cargar Pregunta en Reproductor
const loadQuestion = (index) => {
    if (index < 0 || index >= state.activeQuestions.length) return;
    state.currentQuestionIndex = index;
    
    // Guardar progreso cada vez que cambia el índice de la pregunta
    savePausedProgress();
    
    const question = state.activeQuestions[index];
    const totalQuestions = state.activeQuestions.length;
    
    // Update progress tracker
    document.getElementById('player-question-counter').innerText = `Pregunta ${index + 1} de ${totalQuestions}`;
    document.getElementById('player-question-value').innerText = `Valor: ${parseFloat(question.puntaje).toFixed(2)} puntos`;
    
    const progressPercent = Math.round(((index + 1) / totalQuestions) * 100);
    document.getElementById('player-progress-bar-fill').style.width = `${progressPercent}%`;
    
    // Set text
    document.getElementById('player-question-text').innerText = question.enunciado;
    
    // Render options
    const optionsContainer = document.getElementById('player-options-container');
    optionsContainer.innerHTML = '';
    
    const options = [
        { key: 'A', text: question.opcion_a },
        { key: 'B', text: question.opcion_b },
        { key: 'C', text: question.opcion_c }
    ];
    
    // Verificar si el usuario ya contestó esta pregunta
    const answeredOption = state.userAnswers[question.numero];
    const isAnswered = answeredOption !== undefined && answeredOption !== null;
    
    options.forEach(opt => {
        const optionId = `opt-${opt.key}`;
        const wrapper = document.createElement('div');
        wrapper.className = 'option-wrapper';
        
        let checkedAttr = '';
        let disabledAttr = '';
        let labelClass = '';
        
        if (isAnswered) {
            disabledAttr = 'disabled';
            if (opt.key === answeredOption) {
                checkedAttr = 'checked';
            }
            if (opt.key === question.respuesta_correcta) {
                labelClass = 'correct';
            } else if (opt.key === answeredOption) {
                labelClass = 'incorrect';
            } else {
                labelClass = 'disabled';
            }
        }
        
        wrapper.innerHTML = `
            <input type="radio" name="exam-option" id="${optionId}" value="${opt.key}" class="option-input" ${checkedAttr} ${disabledAttr}>
            <label for="${optionId}" class="option-label ${labelClass}" id="label-${optionId}">
                <div class="option-marker">${opt.key}</div>
                <div class="option-text">${opt.text}</div>
            </label>
        `;
        optionsContainer.appendChild(wrapper);
        
        // Add click listener if not answered
        if (!isAnswered) {
            const input = wrapper.querySelector('input');
            input.addEventListener('change', () => {
                // Enable evaluation button once something is chosen
                document.getElementById('btn-submit-answer').disabled = false;
            });
        }
    });
    
    // Reset buttons and feedback panels
    const feedbackPanel = document.getElementById('player-feedback-panel');
    const statusText = document.getElementById('feedback-status-text');
    const feedbackIconCorrect = document.getElementById('feedback-icon-correct');
    const feedbackIconIncorrect = document.getElementById('feedback-icon-incorrect');
    const feedbackText = document.getElementById('player-feedback-text');
    
    if (isAnswered) {
        feedbackPanel.className = 'feedback-panel';
        const isCorrect = answeredOption === question.respuesta_correcta;
        if (isCorrect) {
            feedbackPanel.classList.add('correct-feedback');
            statusText.innerText = '¡Respuesta Correcta!';
            feedbackIconCorrect.classList.remove('hidden');
            feedbackIconIncorrect.classList.add('hidden');
        } else {
            feedbackPanel.classList.add('incorrect-feedback');
            statusText.innerText = 'Respuesta Incorrecta';
            feedbackIconCorrect.classList.add('hidden');
            feedbackIconIncorrect.classList.remove('hidden');
        }
        feedbackText.innerText = question.retroalimentacion;
        feedbackPanel.classList.remove('hidden');
        
        document.getElementById('btn-submit-answer').classList.add('hidden');
        document.getElementById('btn-next-question').classList.remove('hidden');
    } else {
        feedbackPanel.classList.add('hidden');
        document.getElementById('btn-submit-answer').classList.remove('hidden');
        document.getElementById('btn-submit-answer').disabled = true;
        document.getElementById('btn-next-question').classList.add('hidden');
    }
    
    lucide.createIcons();
};

// Enviar Respuesta (Evaluación Inmediata con Retroalimentación)
const evaluateAnswer = () => {
    const selectedInput = document.querySelector('input[name="exam-option"]:checked');
    if (!selectedInput) return;
    
    const selectedVal = selectedInput.value;
    const question = state.activeQuestions[state.currentQuestionIndex];
    const isCorrect = selectedVal === question.respuesta_correcta;
    
    // Save state
    state.userAnswers[question.numero] = selectedVal;
    const scoreVal = isCorrect ? parseFloat(question.puntaje) : 0.0;
    state.userScores[question.numero] = scoreVal;
    state.currentScore += scoreVal;
    
    // Guardar progreso temporal inmediatamente
    savePausedProgress();
    
    // Play sound effects
    if (isCorrect) {
        playCorrectSound();
    } else {
        playIncorrectSound();
    }
    
    // Update UI Score
    document.getElementById('player-current-score').innerText = state.currentScore.toFixed(2);
    
    // Disable inputs and style option cards
    const options = ['A', 'B', 'C'];
    options.forEach(key => {
        const input = document.getElementById(`opt-${key}`);
        const label = document.getElementById(`label-opt-${key}`);
        input.disabled = true;
        label.classList.add('disabled');
        
        if (key === question.respuesta_correcta) {
            // Correct option is highlighted in Green
            label.classList.add('correct');
        } else if (key === selectedVal) {
            // If user selected this wrong option, highlight in Red
            label.classList.add('incorrect');
        }
    });
    
    // Configure and reveal Feedback Panel
    const feedbackPanel = document.getElementById('player-feedback-panel');
    const statusText = document.getElementById('feedback-status-text');
    const feedbackIconCorrect = document.getElementById('feedback-icon-correct');
    const feedbackIconIncorrect = document.getElementById('feedback-icon-incorrect');
    const feedbackText = document.getElementById('player-feedback-text');
    
    feedbackPanel.className = 'feedback-panel'; // Reset classes
    
    if (isCorrect) {
        feedbackPanel.classList.add('correct-feedback');
        statusText.innerText = '¡Respuesta Correcta!';
        feedbackIconCorrect.classList.remove('hidden');
        feedbackIconIncorrect.classList.add('hidden');
    } else {
        feedbackPanel.classList.add('incorrect-feedback');
        statusText.innerText = 'Respuesta Incorrecta';
        feedbackIconCorrect.classList.add('hidden');
        feedbackIconIncorrect.classList.remove('hidden');
    }
    
    // Insert text and reveal panel
    feedbackText.innerText = question.retroalimentacion;
    feedbackPanel.classList.remove('hidden');
    
    // Toggle actions buttons
    document.getElementById('btn-submit-answer').classList.add('hidden');
    document.getElementById('btn-next-question').classList.remove('hidden');
    
    // Scroll feedback into view on small devices
    feedbackPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    lucide.createIcons();
};

// Siguiente Pregunta o Finalizar Examen
const handleNextQuestion = async () => {
    const totalQuestions = state.activeQuestions.length;
    if (state.currentQuestionIndex + 1 < totalQuestions) {
        // Move to next question
        loadQuestion(state.currentQuestionIndex + 1);
    } else {
        // End of the exam, save and submit
        await submitFinishedExam();
    }
};

// Guardar y Finalizar el Intento de Examen
const submitFinishedExam = async () => {
    stopCountdownTimer();
    if (!state.activeExam) return;
    const examId = state.activeExam.id;
    const finalScore = state.currentScore;
    
    // Eliminar progreso temporal ya que se completó el examen
    deletePausedProgress(examId);
    
    // Visual wait block
    const nextBtn = document.getElementById('btn-next-question');
    nextBtn.disabled = true;
    nextBtn.innerHTML = `<span>Registrando...</span> <div class="spinner"></div>`;
    
    const { data: attempt, error } = await apiSaveAttempt(examId, finalScore, state.userAnswers);
    
    nextBtn.disabled = false;
    nextBtn.innerHTML = `<span>Siguiente Pregunta</span> <i data-lucide="arrow-right"></i>`;
    lucide.createIcons();
    
    if (error) {
        alert("Error al guardar el intento: " + error);
        // Direct to dashboard if conflict or major DB crash, reload attempts
        await apiLoadAttempts();
        renderDashboard();
        showView('view-dashboard');
        return;
    }
    
    // Clear active states
    const finishedExam = state.activeExam;
    state.activeExam = null;
    state.activeQuestions = [];
    
    // Ensure attempt is defined for showExamResults
    const finalAttempt = attempt || {
        docente_id: state.currentUser ? state.currentUser.id : 0,
        simulacro_id: parseInt(examId),
        puntaje_obtenido: parseFloat(finalScore),
        respuestas_usuario: state.userAnswers || {},
        completado_at: new Date().toISOString()
    };
    
    // Show results screen
    showExamResults(finishedExam, finalAttempt);
};

// Ver Resultados del Examen
const showExamResults = (exam, attempt) => {
    document.getElementById('results-exam-title').innerText = exam.titulo;
    
    // Fallback if attempt is undefined/null
    const safeAttempt = attempt || {
        puntaje_obtenido: 0.0,
        respuestas_usuario: {}
    };
    
    const score = parseFloat(safeAttempt.puntaje_obtenido || 0.0);
    const examQuestions = state.preguntas[exam.id] || state.preguntas[String(exam.id)] || state.preguntas[Number(exam.id)] || [];
    const maxScore = examQuestions.length * 2.0;
    
    document.getElementById('results-score-value').innerText = score.toFixed(2);
    const scoreMaxEl = document.querySelector('.score-max');
    if (scoreMaxEl) {
        scoreMaxEl.innerText = `Máximo: ${maxScore.toFixed(2)} pts`;
    }
    
    // Evaluate correctness counts
    let correctCount = 0;
    let incorrectCount = 0;
    
    const userAnswers = safeAttempt.respuestas_usuario || {};
    
    examQuestions.forEach(q => {
        const ans = userAnswers[q.numero];
        if (ans === q.respuesta_correcta) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    });
    
    document.getElementById('results-correct-count').innerText = correctCount;
    document.getElementById('results-incorrect-count').innerText = incorrectCount;
    
    const accuracy = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    document.getElementById('results-accuracy-percent').innerText = accuracy;
    
    // Achievement badges logic (based on Peruvian score metrics)
    const badge = document.getElementById('results-achievement-badge');
    
    // Clean and set achievement badge HTML (safe against Lucide replacing <i> with <svg>)
    let iconName = 'alert-circle';
    let badgeClass = 'error';
    let text = 'Nivel de Inicio';
    
    if (accuracy >= 90) {
        badgeClass = 'success';
        text = 'Logro Destacado';
        iconName = 'award';
    } else if (accuracy >= 70) {
        badgeClass = 'success';
        text = 'Nivel Logrado';
        iconName = 'check-circle';
    } else if (accuracy >= 50) {
        badgeClass = 'info';
        text = 'En Proceso';
        iconName = 'help-circle';
    }
    
    badge.className = `achievement-badge ${badgeClass}`;
    badge.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span id="results-achievement-text">${text}</span>
    `;
    
    // -------------------------------------------------------------
    // DIAGNOSTIC COMPETENCIES ANALYSIS
    // -------------------------------------------------------------
    const topics = {};
    
    examQuestions.forEach(q => {
        let topic = 'Enfoque de Educación Física';
        if (q.retroalimentacion && typeof q.retroalimentacion === 'string') {
            const match = q.retroalimentacion.match(/Justificación:\s*([^.]+)/);
            if (match && match[1]) {
                topic = match[1].trim();
            }
        }
        
        if (!topics[topic]) {
            topics[topic] = {
                total: 0,
                correct: 0
            };
        }
        
        topics[topic].total++;
        
        const ans = userAnswers[q.numero];
        if (ans === q.respuesta_correcta) {
            topics[topic].correct++;
        }
    });

    const strengthsList = document.getElementById('diagnostic-strengths-list');
    const weaknessesList = document.getElementById('diagnostic-weaknesses-list');
    
    if (strengthsList && weaknessesList) {
        strengthsList.innerHTML = '';
        weaknessesList.innerHTML = '';
        
        let hasStrengths = false;
        let hasWeaknesses = false;
        
        for (const [topicName, data] of Object.entries(topics)) {
            const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            const isStrength = percent >= 75;
            
            const itemHtml = `
                <div class="diagnostic-item">
                    <div class="diagnostic-item-header">
                        <span class="diagnostic-item-name">${topicName}</span>
                        <span class="diagnostic-item-badge ${isStrength ? 'strength' : 'weakness'}">
                            ${data.correct}/${data.total} aciertos
                        </span>
                    </div>
                    <div class="diagnostic-progress-container">
                        <div class="diagnostic-progress-bar">
                            <div class="diagnostic-progress-fill ${isStrength ? 'strength' : 'weakness'}" style="width: ${percent}%"></div>
                        </div>
                        <span class="diagnostic-progress-percent">${percent}%</span>
                    </div>
                </div>
            `;
            
            if (isStrength) {
                strengthsList.innerHTML += itemHtml;
                hasStrengths = true;
            } else {
                weaknessesList.innerHTML += itemHtml;
                hasWeaknesses = true;
            }
        }
        
        if (!hasStrengths) {
            strengthsList.innerHTML = `
                <div class="diagnostic-empty-state">
                    <i data-lucide="info" style="width: 24px; height: 24px; color: var(--slate-400);"></i>
                    <span>No se identificaron fortalezas destacadas en este intento. ¡Sigue preparándote!</span>
                </div>
            `;
        }
        
        if (!hasWeaknesses) {
            weaknessesList.innerHTML = `
                <div class="diagnostic-empty-state">
                    <i data-lucide="smile" style="width: 24px; height: 24px; color: var(--primary);"></i>
                    <span>¡Felicidades! No presentas puntos débiles significativos en esta prueba.</span>
                </div>
            `;
        }
    }

    // Generate Personalized Recommendations
    const recommendationText = document.getElementById('diagnostic-recommendation-text');
    if (recommendationText) {
        let recHtml = '';
        
        // Find weaknesses (accuracy < 75%)
        const weakTopics = [];
        for (const [topicName, data] of Object.entries(topics)) {
            const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            if (percent < 75) {
                weakTopics.push(topicName);
            }
        }
        
        // Topic recommendation dictionary
        const topicRecs = {
            'Metacognición y Autonomía': 'Refuerza las técnicas de metacognición: diseña preguntas reflexivas que guíen al alumno a evaluar sus movimientos sin que el docente les dé la respuesta directamente.',
            'Juegos Predeportivos': 'Estudia la didáctica de los juegos predeportivos: cómo adaptar reglas en fútsal, vóleibol y balonmano escolar para priorizar el desarrollo motor lúdico ante la técnica formal.',
            'Expresión Corporal': 'Repasa dinámicas de expresión corporal: el uso del cuerpo como herramienta de comunicación de sensaciones, ritmos y representaciones dramáticas.',
            'Control Postural y Tónico': 'Familiarízate con el ajuste postural y control tónico: cómo diseñar desafíos motrices de equilibrio estático y dinámico considerando la gravedad y tensión muscular.',
            'Juego Cooperativo': 'Estudia juegos cooperativos: técnicas para eliminar la rivalidad y fomentar dinámicas donde la meta solo se alcance colaborando en equipo de forma solidaria.',
            'Orientación Espacial': 'Repasa la noción de orientación espacial: ejercicios prácticos de estructuración espacial (arriba/abajo, adentro/afuera, distancias y trayectorias).',
            'Estilos de Enseñanza - Asignación de Tareas': 'Diferencia claramente los estilos de Mosston: la transición entre el Mando Directo tradicional, la Asignación de Tareas y el Descubrimiento Guiado reflexivo.',
            'Resolución de Conflictos': 'Repasa la mediación pedagógica: técnicas de diálogo asertivo y preguntas reflexivas que lleven a los alumnos a proponer soluciones pacíficas tras un incidente.',
            'Tácticas Deportivas': 'Estudia el pensamiento táctico: cómo resolver problemas situacionales de espacio, tiempo, ataque y defensa en juegos modificados con oposición.',
            'Primeros Auxilios (Epistaxis y Contusiones)': 'Memoriza el protocolo de epistaxis (inclinar cabeza adelante, presionar fosas nasales) y contusiones (frío directo local en zona afectada, nunca calor ni masajes).',
            'Estructuras Perceptivas': 'Repasa los planos anatómicos (sagital, frontal, transversal) y cómo interactúan con los ejes de movimiento durante la práctica deportiva.',
            'Sincinesias y Maduración': 'Estudia sincinesias: comprende que los movimientos parásitos involuntarios son normales en la maduración psicomotriz infantil hasta los 12 años.',
            'Enfoque Inclusivo y DUA': 'Domina el Diseño Universal para el Aprendizaje: cómo diversificar los canales de presentación, expresión y compromiso para asegurar la inclusión de alumnos con NEE.'
        };
        
        if (accuracy >= 90) {
            recHtml += `<p><strong>¡Excelente rendimiento! (Nivel Logrado Destacado)</strong>. Felicitaciones, tienes un dominio sobresaliente del currículo oficial de Educación Física. Tu preparación va por muy buen camino.</p>`;
            if (weakTopics.length > 0) {
                recHtml += `<p>Para asegurar tu puntaje máximo en la evaluación oficial de ascenso, te sugerimos repasar estos puntos específicos:</p><ul>`;
                weakTopics.forEach(t => {
                    const rec = topicRecs[t] || `Repasa a detalle los casos prácticos sobre el tema pedagógico "${t}".`;
                    recHtml += `<li><strong>${t}</strong>: ${rec}</li>`;
                });
                recHtml += `</ul>`;
            } else {
                recHtml += `<p>¡Has contestado todos los temas a la perfección! Continúa rindiendo simulacros controlados por tiempo para consolidar tu velocidad y agilidad de análisis ante los casos complejos del MINEDU.</p>`;
            }
        } else if (accuracy >= 70) {
            recHtml += `<p><strong>¡Buen nivel logrado!</strong>. Tienes bases curriculares sólidas, pero aún quedan pequeños vacíos conceptuales que podrían restarte puntos en el examen oficial de ascenso.</p>`;
            recHtml += `<p>Te recomendamos priorizar el estudio de las siguientes áreas pedagógicas identificadas en esta prueba:</p><ul>`;
            weakTopics.forEach(t => {
                const rec = topicRecs[t] || `Refuerza los criterios curriculares del MINEDU referentes a "${t}".`;
                recHtml += `<li><strong>${t}</strong>: ${rec}</li>`;
            });
            recHtml += `</ul>`;
        } else {
            recHtml += `<p><strong>Rendimiento en proceso de consolidación</strong>. Se identifican dificultades para aplicar el enfoque formativo y los procesos del Currículo Nacional en situaciones prácticas de Educación Física.</p>`;
            recHtml += `<p><strong>Tu plan de acción inmediato:</strong></p><ul>`;
            weakTopics.forEach(t => {
                const rec = topicRecs[t] || `Estudia detenidamente la teoría y los casos resueltos asociados a "${t}".`;
                recHtml += `<li><strong>${t}</strong>: ${rec}</li>`;
            });
            if (weakTopics.length === 0) {
                recHtml += `<li>Realiza lecturas minuciosas de las orientaciones para la evaluación formativa del MINEDU y contrasta tus respuestas con las justificaciones teóricas del curso.</li>`;
            }
            recHtml += `</ul>`;
        }
        
        recommendationText.innerHTML = recHtml;
    }

    // Render Review questions
    const reviewList = document.getElementById('results-review-list');
    reviewList.innerHTML = '';
    
    examQuestions.forEach(q => {
        const userAns = userAnswers[q.numero] || 'Sin responder';
        const isCorrect = userAns === q.respuesta_correcta;
        
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-question-card';
        reviewCard.innerHTML = `
            <div class="review-question-header">
                <span class="review-q-num">Pregunta ${q.numero} (Valor: ${parseFloat(q.puntaje).toFixed(2)} pts)</span>
                <span class="review-q-status ${isCorrect ? 'correct' : 'incorrect'}">
                    <i data-lucide="${isCorrect ? 'check' : 'x'}"></i>
                    ${isCorrect ? 'Correcta' : 'Incorrecta'}
                </span>
            </div>
            
            <p class="case-text" style="font-size: 0.98rem; margin-bottom: 12px;">${q.enunciado}</p>
            
            <div class="review-options-review">
                <div class="review-option-item ${q.respuesta_correcta === 'A' ? 'correct' : (userAns === 'A' ? 'user-selected-incorrect' : '')}">
                    <span class="review-opt-marker">A</span>
                    <span>${q.opcion_a}</span>
                    <span class="review-opt-status-icon">${q.respuesta_correcta === 'A' ? '✓ Correcta' : (userAns === 'A' ? '✗ Tu respuesta' : '')}</span>
                </div>
                <div class="review-option-item ${q.respuesta_correcta === 'B' ? 'correct' : (userAns === 'B' ? 'user-selected-incorrect' : '')}">
                    <span class="review-opt-marker">B</span>
                    <span>${q.opcion_b}</span>
                    <span class="review-opt-status-icon">${q.respuesta_correcta === 'B' ? '✓ Correcta' : (userAns === 'B' ? '✗ Tu respuesta' : '')}</span>
                </div>
                <div class="review-option-item ${q.respuesta_correcta === 'C' ? 'correct' : (userAns === 'C' ? 'user-selected-incorrect' : '')}">
                    <span class="review-opt-marker">C</span>
                    <span>${q.opcion_c}</span>
                    <span class="review-opt-status-icon">${q.respuesta_correcta === 'C' ? '✓ Correcta' : (userAns === 'C' ? '✗ Tu respuesta' : '')}</span>
                </div>
            </div>
            
            <div class="review-feedback-box ${isCorrect ? 'correct' : 'incorrect'}">
                <div style="font-weight: 700; margin-bottom: 6px; font-size: 0.82rem; text-transform: uppercase;">
                    Retroalimentación Pedagógica
                </div>
                <div>${q.retroalimentacion}</div>
            </div>
        `;
        reviewList.appendChild(reviewCard);
    });
    
    lucide.createIcons();
    showView('view-results');
};

// Salida del Examen Activo (Warning Modal)
const handleExitAttempt = () => {
    const exitModal = document.getElementById('modal-exit-warning');
    exitModal.classList.remove('hidden');
};

const cancelExitAttempt = () => {
    const exitModal = document.getElementById('modal-exit-warning');
    exitModal.classList.add('hidden');
};

const confirmExitAttempt = async () => {
    const exitModal = document.getElementById('modal-exit-warning');
    exitModal.classList.add('hidden');
    
    // Detener temporizador y guardar progreso
    stopCountdownTimer();
    savePausedProgress();
    
    // Limpiar examen activo
    state.activeExam = null;
    state.activeQuestions = [];
    
    // Volver al panel de control
    renderDashboard();
    showView('view-dashboard');
};

// Lógica de Finalización Anticipada
const handleFinishExamEarly = () => {
    const scoreSpan = document.getElementById('modal-finish-current-score');
    if (scoreSpan) scoreSpan.innerText = state.currentScore.toFixed(2);
    
    const modal = document.getElementById('modal-finish-warning');
    if (modal) modal.classList.remove('hidden');
};

const cancelFinishExamEarly = () => {
    const modal = document.getElementById('modal-finish-warning');
    if (modal) modal.classList.add('hidden');
};

const confirmFinishExamEarly = async () => {
    const modal = document.getElementById('modal-finish-warning');
    if (modal) modal.classList.add('hidden');
    
    await submitFinishedExam();
};



// -------------------------------------------------------------
// 7. DIÁLOGO DE CONFIGURACIÓN DE SUPABASE
// -------------------------------------------------------------
const openConfigModal = () => {
    const modal = document.getElementById('modal-config');
    const urlInput = document.getElementById('config-url');
    const keyInput = document.getElementById('config-key');
    
    urlInput.value = localStorage.getItem('supabase_url') || '';
    keyInput.value = localStorage.getItem('supabase_key') || '';
    
    modal.classList.remove('hidden');
};

const closeConfigModal = () => {
    document.getElementById('modal-config').classList.add('hidden');
};

const handleConfigSubmit = (e) => {
    e.preventDefault();
    const url = document.getElementById('config-url').value.trim();
    const key = document.getElementById('config-key').value.trim();
    
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    
    closeConfigModal();
    initSupabase();
    
    // Reload dashboard if logged in
    if (state.currentUser) {
        apiLoadExams().then(() => {
            apiLoadAttempts().then(() => {
                renderDashboard();
            });
        });
    }
};

const handleClearConfig = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    
    document.getElementById('config-url').value = '';
    document.getElementById('config-key').value = '';
    
    closeConfigModal();
    initSupabase();
    
    // Reload dashboard if logged in
    if (state.currentUser) {
        apiLoadExams().then(() => {
            apiLoadAttempts().then(() => {
                renderDashboard();
            });
        });
    }
};

// Toggle Password Visibility
const togglePasswordVisibility = () => {
    const passwordInput = document.getElementById('login-password');
    const btn = document.getElementById('btn-toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        btn.innerHTML = `<i data-lucide="eye-off"></i>`;
    } else {
        passwordInput.type = 'password';
        btn.innerHTML = `<i data-lucide="eye"></i>`;
    }
    lucide.createIcons();
};

// -------------------------------------------------------------
// 8. EVENT BINDING & INICIALIZACIÓN
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Supabase Connection
    initSupabase();
    
    // 2. Bind Auth Forms & UI Elements
    document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);
    document.getElementById('btn-logout').addEventListener('click', () => {
        stopCountdownTimer();
        state.currentUser = null;
        state.simulacros = [];
        state.preguntas = {};
        state.intentos = [];
        showView('view-login');
    });
    
    // Password toggles
    document.getElementById('btn-toggle-password').addEventListener('click', togglePasswordVisibility);
    
    // 3. Bind Exam Player Actions
    document.getElementById('btn-submit-answer').addEventListener('click', evaluateAnswer);
    document.getElementById('btn-next-question').addEventListener('click', handleNextQuestion);
    document.getElementById('btn-exit-exam').addEventListener('click', handleExitAttempt);
    document.getElementById('btn-finish-exam-early').addEventListener('click', handleFinishExamEarly);
    
    // Exit modal triggers
    document.getElementById('btn-exit-cancel').addEventListener('click', cancelExitAttempt);
    document.getElementById('btn-close-exit-warning').addEventListener('click', cancelExitAttempt);
    document.getElementById('btn-exit-confirm').addEventListener('click', confirmExitAttempt);
    
    // Finish modal triggers
    document.getElementById('btn-close-finish-warning').addEventListener('click', cancelFinishExamEarly);
    document.getElementById('btn-finish-cancel').addEventListener('click', cancelFinishExamEarly);
    document.getElementById('btn-finish-confirm').addEventListener('click', confirmFinishExamEarly);
    
    // 4. Bind Results page actions
    document.getElementById('btn-results-back').addEventListener('click', () => {
        renderDashboard();
        showView('view-dashboard');
    });
    

    
    // 6. Bind Config Modal events
    document.getElementById('btn-open-config').addEventListener('click', openConfigModal);
    document.getElementById('btn-close-config').addEventListener('click', closeConfigModal);
    document.getElementById('config-supabase-form').addEventListener('submit', handleConfigSubmit);
    document.getElementById('btn-clear-config').addEventListener('click', handleClearConfig);
    
    // 7. Atajos ocultos para abrir la configuración de Supabase
    let logoClicks = 0;
    let logoTimeout = null;
    const logoEl = document.querySelector('.logo-circle');
    if (logoEl) {
        logoEl.addEventListener('click', () => {
            logoClicks++;
            if (logoTimeout) clearTimeout(logoTimeout);
            if (logoClicks >= 5) {
                logoClicks = 0;
                openConfigModal();
            } else {
                logoTimeout = setTimeout(() => { logoClicks = 0; }, 2000);
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            openConfigModal();
        }
    });
    
    // Initialize Lucide Icons initially
    lucide.createIcons();
});
