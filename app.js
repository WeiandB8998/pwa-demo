// ==========================================
// PWA DEMO APP - Application Logic
// ==========================================

// Store install prompt event for later use
let deferredPrompt = null;
const STORAGE_KEY = 'pwaDemo_counter';

// ==========================================
// 1. INITIALIZE APP
// ==========================================
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    console.log('🚀 Initializing PWA Demo App...');
    
    // Register Service Worker
    registerServiceWorker();
    
    // Load saved counter value
    loadCounterFromStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Display device info
    displayDeviceInfo();
    
    // Check install prompt support
    checkInstallPromptSupport();
    
    console.log('✅ App initialized successfully!');
}

// ==========================================
// 2. SERVICE WORKER REGISTRATION
// ==========================================
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('✅ Service Worker registered successfully:', registration);
            updateServiceWorkerStatus(true);
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            updateServiceWorkerStatus(false);
        }
    } else {
        console.warn('⚠️ Service Workers not supported in this browser');
        updateServiceWorkerStatus(false);
    }
}

function updateServiceWorkerStatus(isActive) {
    const statusElement = document.getElementById('swStatus');
    if (isActive) {
        statusElement.textContent = '✅ Active (app works offline)';
        statusElement.style.color = '#27AE60';
    } else {
        statusElement.textContent = '⚠️ Not available';
        statusElement.style.color = '#E74C3C';
    }
}

// ==========================================
// 3. COUNTER FUNCTIONALITY
// ==========================================
function incrementCounter() {
    let count = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    count++;
    localStorage.setItem(STORAGE_KEY, count);
    updateCounterDisplay(count);
    
    // Add visual feedback
    const counterElement = document.getElementById('counterDisplay');
    counterElement.style.transform = 'scale(1.1)';
    setTimeout(() => {
        counterElement.style.transform = 'scale(1)';
    }, 200);
}

function resetCounter() {
    localStorage.setItem(STORAGE_KEY, '0');
    updateCounterDisplay(0);
}

function loadCounterFromStorage() {
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    updateCounterDisplay(count);
}

function updateCounterDisplay(count) {
    document.getElementById('counterDisplay').textContent = count;
}

// ==========================================
// 4. CONNECTION STATUS MONITORING
// ==========================================
function setupEventListeners() {
    // Online/Offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    updateConnectionStatus();
}

function handleOnline() {
    console.log('📡 App is online');
    updateConnectionStatus();
}

function handleOffline() {
    console.log('📡 App is offline');
    updateConnectionStatus();
}

function updateConnectionStatus() {
    const isOnline = navigator.onLine;
    const statusElement = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const statusDot = statusElement.querySelector('.status-dot');
    
    if (isOnline) {
        statusText.textContent = 'Online';
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
    } else {
        statusText.textContent = 'Offline (Airplane Mode)';
        statusDot.classList.remove('online');
        statusDot.classList.add('offline');
    }
}

// ==========================================
// 5. NOTIFICATION FUNCTIONALITY
// ==========================================
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('This browser does not support notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        alert('Notifications already enabled!');
        enableNotificationButton();
        return;
    }
    
    if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Please enable them in settings.');
        return;
    }
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('✅ Notification permission granted');
            enableNotificationButton();
            sendTestNotification();
        }
    } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
    }
}

function enableNotificationButton() {
    const notificationBtn = document.getElementById('notificationBtn');
    notificationBtn.disabled = false;
}

function sendTestNotification() {
    if (Notification.permission !== 'granted') {
        alert('Please enable notifications first');
        return;
    }
    
    const title = '🎉 PWA Demo App';
    const options = {
        body: 'This notification works even when the app is closed!',
        icon: 'images/icon-192.png',
        badge: 'images/icon-192.png',
        tag: 'pwa-demo',
        requireInteraction: false,
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'close', title: 'Close' }
        ]
    };
    
    // Show notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            options: options
        });
    } else {
        new Notification(title, options);
    }
    
    console.log('📲 Notification sent!');
}

// ==========================================
// 6. INSTALL PROMPT FUNCTIONALITY
// ==========================================
function checkInstallPromptSupport() {
    window.addEventListener('beforeinstallprompt', (event) => {
        console.log('📲 Install prompt available');
        event.preventDefault();
        deferredPrompt = event;
        
        // Show install button on Android
        const installBtn = document.getElementById('installBtn');
        installBtn.style.display = 'block';
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('✅ App installed successfully!');
        deferredPrompt = null;
        const installBtn = document.getElementById('installBtn');
        installBtn.style.display = 'none';
    });
}

function promptInstall() {
    if (!deferredPrompt) {
        alert('App is already installable or install is not supported');
        return;
    }
    
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted install prompt');
        } else {
            console.log('❌ User declined install prompt');
        }
        deferredPrompt = null;
    });
}

// ==========================================
// 7. DEVICE INFORMATION
// ==========================================
function displayDeviceInfo() {
    const userAgent = navigator.userAgent;
    document.getElementById('userAgent').textContent = userAgent;
    
    // Detect device type
    const isIPhone = /iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isIPad = /iPad/.test(userAgent);
    
    let deviceType = 'Unknown Device';
    if (isIPhone) deviceType = '📱 iPhone';
    if (isIPad) deviceType = '📱 iPad';
    if (isAndroid) deviceType = '📱 Android Device';
    
    console.log(`🔍 Detected device: ${deviceType}`);
}

// ==========================================
// 8. UTILITY FUNCTIONS
// ==========================================

// Add smooth transitions to counter display
const counterDisplay = document.getElementById('counterDisplay');
if (counterDisplay) {
    counterDisplay.style.transition = 'transform 0.2s ease-out';
}

// Log PWA features support
window.addEventListener('load', () => {
    console.log('%c🎉 PWA DEMO APP READY 🎉', 'font-size: 16px; color: #4A90E2; font-weight: bold;');
    console.log('%cSupported Features:', 'font-weight: bold;');
    console.log('✅ Service Workers:', 'serviceWorker' in navigator);
    console.log('✅ LocalStorage:', typeof(Storage) !== 'undefined');
    console.log('✅ Notifications API:', 'Notification' in window);
    console.log('✅ Install Prompt:', 'beforeinstallprompt' in window ? 'Supported' : 'Not supported');
    console.log('✅ Online/Offline Detection:', 'onLine' in navigator);
});

// ==========================================
// 9. HANDLE VISIBILITY CHANGE (for PWA lifecycle)
// ==========================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('🔇 App minimized');
    } else {
        console.log('📱 App is visible');
        updateConnectionStatus();
    }
});
