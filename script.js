document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    let isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) body.classList.add('dark-mode');
    updateToggleIcon(isDark);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isDark = !isDark;
            body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateToggleIcon(isDark);
        });
    }

    function updateToggleIcon(dark) {
        const icon = toggleBtn?.querySelector('i');
        if (!icon) return;
        icon.setAttribute('data-lucide', dark ? 'sun' : 'moon');
        if (window.lucide) lucide.createIcons({ nodes: [icon] });
    }

    // Load Palette then setup scroll
    loadThemeData().then(() => {
        setupScrollAnimation();
    });
});

// Scroll Animation Data
let cardsData = [];
let ticking = false;

function setupScrollAnimation() {
    const cards = document.querySelectorAll('.swatch-card');

    cards.forEach(card => {
        const baseX = parseFloat(card.style.getPropertyValue('--tx')) || 0;
        cardsData.push({
            el: card,
            baseX,
            phase: Math.random() * Math.PI * 2,
            speed: 0.002 + Math.random() * 0.001, // Smoother speed
            amplitude: 35 + Math.random() * 25    // More noticeable sway
        });
    });

    // Passive listener for better scroll performance
    window.addEventListener('scroll', onScroll, { passive: true });
    updateCardPositions();
}

function onScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            updateCardPositions();
            ticking = false;
        });
        ticking = true;
    }
}

function updateCardPositions() {
    const scrollY = window.scrollY;

    // Batch read/write to avoid layout thrashing
    const updates = cardsData.map(item => {
        const sway = Math.sin(scrollY * item.speed + item.phase) * item.amplitude;
        return { el: item.el, newX: item.baseX + sway };
    });

    updates.forEach(({ el, newX }) => {
        el.style.setProperty('--tx', `${newX}px`);
    });
}

// Toast System
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    const iconName = type === 'success' ? 'check-circle' : 'info';

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}" size="20"></i>
        </div>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    const newIcon = toast.querySelector('i');
    if (window.lucide && newIcon) lucide.createIcons({ nodes: [newIcon] });

    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

async function loadThemeData() {
    try {
        const response = await fetch('theme.json');
        const data = await response.json();
        renderPalette(data);
    } catch (error) {
        console.error("Failed to load theme.json", error);
    }
}

function renderPalette(data) {
    const grid = document.getElementById('palette-grid');
    if (!grid) return;

    const fragment = document.createDocumentFragment();
    const groups = ['brand', 'functional'];

    groups.forEach(group => {
        if (data[group]) traverseAndRender(data[group], group, fragment);
    });

    grid.appendChild(fragment);
}

function traverseAndRender(obj, prefix, container) {
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
            traverseAndRender(value, `${prefix}.${key}`, container);
        } else if (typeof value === 'string' && value.startsWith('#')) {
            createSwatch(container, value, `${prefix}.${key}`);
        }
    }
}

function createSwatch(container, color, name) {
    const displayName = name.split('.')
        .slice(1)
        .map(segment => segment.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '))
        .join(' ');

    const card = document.createElement('div');
    card.className = 'swatch-card';

    const isMobile = window.innerWidth < 768;
    const xRange = isMobile ? 50 : 150;
    const randomRotate = (Math.random() * 40) - 20;
    const randomX = (Math.random() * (xRange * 2)) - xRange;
    const randomGap = Math.floor(Math.random() * 80) + 60;

    card.style.setProperty('--rotate', `${randomRotate}deg`);
    card.style.setProperty('--tx', `${randomX}px`);
    card.style.marginBottom = `${randomGap}px`;

    card.innerHTML = `
        <div class="swatch-color" style="background-color: ${color}"></div>
        <div class="swatch-info">
            <div class="swatch-name">${displayName}</div>
            <div class="swatch-hex">${color.toUpperCase()}</div>
        </div>
    `;

    card.addEventListener('click', () => {
        navigator.clipboard.writeText(color);
        showToast(`Copied ${color} to clipboard`);
    });

    container.appendChild(card);
}
