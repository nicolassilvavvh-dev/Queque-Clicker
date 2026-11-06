// Estado General del Juego
const state = {
    score: 0,
    clickPower: 1,
    cps: 0,
    multiplier: 1.0,
    multiplierTimer: null
};

// Datos de Mejoras: Queques (Ingreso Pasivo Q/s)
const cakeUpgrades = [
    { id: 'vayanilla', name: 'Queque de Vainilla', cost: 15, cps: 0.5, count: 0 },
    { id: 'chocolate', name: 'Queque Fudge Chocolate', cost: 100, cps: 4, count: 0 },
    { id: 'marmolado', name: 'Queque Marmolado', cost: 1100, cps: 32, count: 0 },
    { id: 'limon', name: 'Queque Limón Merengue', cost: 12000, cps: 260, count: 0 },
    { id: 'zanahoria', name: 'Queque Zanahoria', cost: 130000, cps: 1400, count: 0 },
    { id: 'redvelvet', name: 'Queque Red Velvet', cost: 1400000, cps: 7800, count: 0 }
];

// Datos de Mejoras: Clics (Poder de Clic)
const clickUpgrades = [
    { id: 'espatula', name: 'Espátula de Vainilla', cost: 10, power: 1, count: 0 },
    { id: 'batidora', name: 'Batidora de Chocolate', cost: 50, power: 5, count: 0 },
    { id: 'inyector', name: 'Inyector de Mermelada', cost: 500, power: 25, count: 0 },
    { id: 'rodillo', name: 'Rodillo de Azúcar', cost: 5000, power: 150, count: 0 }
];

// Generador de Sonidos Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

// Elementos del DOM
const scoreEl = document.getElementById('score');
const cpsEl = document.getElementById('cps');
const multEl = document.getElementById('multiplier');
const clickerArea = document.getElementById('clickerArea');
const cakeWrapper = document.getElementById('cakeWrapper');
const cakesList = document.getElementById('cakesList');
const clickersList = document.getElementById('clickersList');

// Evento de Clic en el Queque
clickerArea.addEventListener('click', (e) => {
    const gained = state.clickPower * state.multiplier;
    state.score += gained;

    playClickSound();

    // 1. Animación de Rebote/Compresión
    cakeWrapper.classList.remove('squish');
    void cakeWrapper.offsetWidth;
    cakeWrapper.classList.add('squish');

    // 2. Efecto de Onda (Ripple)
    const rect = clickerArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'ripple-wave';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    clickerArea.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    // 3. Texto Flotante
    const floatText = document.createElement('div');
    floatText.className = 'float-text';
    floatText.textContent = `+${gained.toFixed(0)}`;
    floatText.style.left = `${x}px`;
    floatText.style.top = `${y}px`;
    clickerArea.appendChild(floatText);
    setTimeout(() => floatText.remove(), 800);

    updateUI();
});

// Pestañas de la Tienda
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tabName === 'cakes') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('cakesTab').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('clickersTab').classList.add('active');
    }
}

// Renderizar la Tienda
function renderShop() {
    cakesList.innerHTML = '';
    cakeUpgrades.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'shop-item';
        el.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name} (${item.count})</span>
        <span class="item-effect">+${item.cps} Q/s | Costo: ${Math.floor(item.cost)}</span>
      </div>
      <button class="buy-btn" id="buy-cake-${index}" onclick="buyCake(${index})">Comprar</button>
    `;
        cakesList.appendChild(el);
    });

    clickersList.innerHTML = '';
    clickUpgrades.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'shop-item';
        el.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name} (${item.count})</span>
        <span class="item-effect">+${item.power} Clic | Costo: ${Math.floor(item.cost)}</span>
      </div>
      <button class="buy-btn" id="buy-click-${index}" onclick="buyClicker(${index})">Comprar</button>
    `;
        clickersList.appendChild(el);
    });
}

function buyCake(index) {
    const item = cakeUpgrades[index];
    if (state.score >= item.cost) {
        state.score -= item.cost;
        item.count++;
        item.cost *= 1.15;
        recalculateCPS();
        renderShop();
        updateUI();
    }
}

function buyClicker(index) {
    const item = clickUpgrades[index];
    if (state.score >= item.cost) {
        state.score -= item.cost;
        item.count++;
        state.clickPower += item.power;
        item.cost *= 1.20;
        renderShop();
        updateUI();
    }
}

function recalculateCPS() {
    state.cps = cakeUpgrades.reduce((sum, item) => sum + (item.cps * item.count), 0);
}

// Minijuego: Horno Perfecto
let indicatorPos = 0;
let direction = 1;
const indicatorEl = document.getElementById('ovenIndicator');
const ovenBtn = document.getElementById('ovenBtn');
const ovenStatus = document.getElementById('ovenStatus');

function animateOven() {
    indicatorPos += direction * 1.5;
    if (indicatorPos >= 100) { indicatorPos = 100; direction = -1; }
    if (indicatorPos <= 0) { indicatorPos = 0; direction = 1; }
    indicatorEl.style.left = `${indicatorPos}%`;
    requestAnimationFrame(animateOven);
}

ovenBtn.addEventListener('click', () => {
    if (indicatorPos >= 40 && indicatorPos <= 60) {
        state.multiplier = 5.0;
        ovenStatus.textContent = '¡ÉXITO PERFECTO! Multiplicador x5 por 15 segundos 🔥';
        ovenStatus.style.color = '#52b788';

        if (state.multiplierTimer) clearTimeout(state.multiplierTimer);
        state.multiplierTimer = setTimeout(() => {
            state.multiplier = 1.0;
            ovenStatus.textContent = 'El bono de temperatura ha finalizado.';
            ovenStatus.style.color = '#e76f51';
            updateUI();
        }, 15000);
    } else {
        ovenStatus.textContent = '¡Se te quemó el queque! Inténtalo de nuevo.';
        ovenStatus.style.color = '#e76f51';
    }
    updateUI();
});

// Evento: Queque Dorado Sorpresa
function spawnGoldenCake() {
    const golden = document.createElement('div');
    golden.className = 'golden-cake';
    golden.textContent = '🧁';
    golden.style.left = `${Math.random() * 80 + 10}vw`;
    golden.style.top = `${Math.random() * 70 + 10}vh`;

    golden.addEventListener('click', (e) => {
        e.stopPropagation();
        const bonus = Math.max(50, state.cps * 30 + 20);
        state.score += bonus;
        ovenStatus.textContent = `¡Capturaste un Queque Dorado! +${Math.floor(bonus)} Queques! ✨`;
        ovenStatus.style.color = '#e9c46a';
        golden.remove();
        updateUI();
    });

    document.body.appendChild(golden);
    setTimeout(() => { if (golden.parentNode) golden.remove(); }, 6000);
}
setInterval(spawnGoldenCake, 35000);

// Bucle de Generación Pasiva
setInterval(() => {
    state.score += (state.cps * state.multiplier) / 10;
    updateUI();
}, 100);

// Actualizar Interfaz
function updateUI() {
    scoreEl.textContent = Math.floor(state.score).toLocaleString();
    cpsEl.textContent = (state.cps * state.multiplier).toFixed(1);
    multEl.textContent = `x${state.multiplier.toFixed(1)}`;

    cakeUpgrades.forEach((item, index) => {
        const btn = document.getElementById(`buy-cake-${index}`);
        if (btn) btn.disabled = state.score < item.cost;
    });
    clickUpgrades.forEach((item, index) => {
        const btn = document.getElementById(`buy-click-${index}`);
        if (btn) btn.disabled = state.score < item.cost;
    });
}

// Inicialización
renderShop();
animateOven();