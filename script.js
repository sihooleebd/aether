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
    loadThemeData();
});

// Scroll Animation Data


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
    const counter = {
        value: 0
    };

    groups.forEach(group => {
        if (data[group]) traverseAndRender(data[group], group, fragment, counter);
    });

    grid.appendChild(fragment);
}

function traverseAndRender(obj, prefix, container, counter) {
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
            traverseAndRender(value, `${prefix}.${key}`, container, counter);
        } else if (typeof value === 'string' && value.startsWith('#')) {
            createSwatch(container, value, `${prefix}.${key}`, counter);
        }
    }
}

function createSwatch(container, color, name, counter) {
    const displayName = name.split('.')
        .slice(1)
        .map(segment => segment.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '))
        .join(' ');

    const card = document.createElement('div');
    card.className = 'swatch-card';

    // Static "S" Shape (Sine Wave)
    const index = counter.value++;
    const isMobile = window.innerWidth < 768;
    const amplitude = isMobile ? 30 : 120; // Horizontal offset
    const frequency = 0.6; // How tight the waves are

    const x = amplitude * Math.sin(index * frequency);

    // Random Tilt for "Falling Leaves" effect
    // Range: -20deg to 20deg
    const randomRotate = (Math.random() * 40) - 20;

    // Consistent spacing for clean list
    const gap = isMobile ? 50 : 80;

    card.style.setProperty('--rotate', `${randomRotate}deg`);
    card.style.setProperty('--tx', `${x}px`);
    card.style.marginBottom = `${gap}px`;

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
