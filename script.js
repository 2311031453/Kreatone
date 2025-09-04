// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const editorSection = document.getElementById('editor-section');
const originalImage = document.getElementById('original-image');
const previewCanvas = document.getElementById('preview-canvas');
const color1Input = document.getElementById('color1');
const color2Input = document.getElementById('color2');
const grainSlider = document.getElementById('grain-slider');
const grainValue = document.getElementById('grain-value');
const invertBtn = document.getElementById('invert-btn');
const convertBtn = document.getElementById('convert-btn');
const downloadBtn = document.getElementById('download-btn');
const themeToggle = document.getElementById('theme-toggle');

// Canvas context
const ctx = previewCanvas.getContext('2d');

// State variables
let originalImageData = null;
let isInverted = false;
let grainAmount = 0;

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
color1Input.addEventListener('input', applyDuotoneEffect);
color2Input.addEventListener('input', applyDuotoneEffect);
grainSlider.addEventListener('input', updateGrainValue);
invertBtn.addEventListener('click', toggleInvert);
convertBtn.addEventListener('click', applyDuotoneEffect);
downloadBtn.addEventListener('click', downloadImage);
themeToggle.addEventListener('click', toggleTheme);

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = '#4361ee';
}

// Handle file drop
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = '#dee2e6';
    
    const files = e.dataTransfer.files;
    if (files.length) {
        processImage(files[0]);
    }
}

// Handle file selection
function handleFileSelect(e) {
    if (e.target.files.length) {
        processImage(e.target.files[0]);
    }
}

// Process the uploaded image
function processImage(file) {
    if (!file.type.match('image.*')) {
        alert('Please upload an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        originalImage.onload = function() {
            // Set canvas dimensions to match image
            previewCanvas.width = originalImage.width;
            previewCanvas.height = originalImage.height;
            
            // Store original image data
            ctx.drawImage(originalImage, 0, 0);
            originalImageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
            
            // Switch to editor view
            uploadSection.classList.add('hidden');
            editorSection.classList.remove('hidden');
            
            // Apply initial effect
            applyDuotoneEffect();
        };
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Update grain value display
function updateGrainValue() {
    grainAmount = parseInt(grainSlider.value);
    grainValue.textContent = `${grainAmount}%`;
    applyDuotoneEffect();
}

// Toggle invert
function toggleInvert() {
    isInverted = !isInverted;
    applyDuotoneEffect();
}

// Apply duotone effect
function applyDuotoneEffect() {
    if (!originalImageData) return;
    
    // Get color values
    const color1 = hexToRgb(color1Input.value);
    const color2 = hexToRgb(color2Input.value);
    
    // Create image data copy
    const imageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
    );
    const data = imageData.data;
    
    // Apply duotone effect
    for (let i = 0; i < data.length; i += 4) {
        // Calculate grayscale value (weighted average)
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.3 * r + 0.59 * g + 0.11 * b;
        
        // Normalize to 0-1
        const t = gray / 255;
        
        // Apply duotone colors
        data[i] = Math.round(color1.r * (1 - t) + color2.r * t);     // R
        data[i + 1] = Math.round(color1.g * (1 - t) + color2.g * t); // G
        data[i + 2] = Math.round(color1.b * (1 - t) + color2.b * t); // B
        
        // Apply inversion if needed
        if (isInverted) {
            data[i] = 255 - data[i];         // R
            data[i + 1] = 255 - data[i + 1]; // G
            data[i + 2] = 255 - data[i + 2]; // B
        }
    }
    
    // Put the processed image data to canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Apply grain effect if needed
    if (grainAmount > 0) {
        applyGrainEffect(grainAmount);
    }
}

// Apply grain effect
function applyGrainEffect(amount) {
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    const grainImageData = ctx.getImageData(0, 0, width, height);
    const data = grainImageData.data;
    
    const intensity = amount / 100 * 50; // Scale to 0-50
    
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity;
        
        data[i] = clamp(data[i] + noise, 0, 255);         // R
        data[i + 1] = clamp(data[i + 1] + noise, 0, 255); // G
        data[i + 2] = clamp(data[i + 2] + noise, 0, 255); // B
    }
    
    ctx.putImageData(grainImageData, 0, 0);
}

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Download the processed image
function downloadImage() {
    const link = document.createElement('a');
    link.download = 'duotone-image.png';
    link.href = previewCanvas.toDataURL('image/png');
    link.click();
}

// Initialize the application
function init() {
    initTheme();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);