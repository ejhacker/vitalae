// Global variables
let socket;
let charts = {};
let currentUser = null;
let healthData = {
    heartRate: [],
    ecg: [],
    lactate: [],
    spo2: []
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('VITALAÉ Platform Initializing...');
    setupEventListeners();
    initializeCharts();
    connectSocket();
    
    // Check for existing token
    const token = localStorage.getItem('vitalae_token');
    if (token) {
        validateTokenAndRedirect(token);
    }
});

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Auth form switching
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Form progress tracking
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        const inputs = profileForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', updateProgress);
        });
    }
}

// Update progress bar
function updateProgress() {
    const form = document.getElementById('profileForm');
    const inputs = form.querySelectorAll('input, select');
    const filledInputs = Array.from(inputs).filter(input => input.value.trim() !== '');
    const progress = (filledInputs.length / inputs.length) * 100;
    
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    
    if (progressText) {
        progressText.textContent = `Step 1 of 2 - ${Math.round(progress)}% complete`;
    }
}

// Show authentication form
function showAuthForm(type) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.querySelector('.auth-tab:first-child');
    const signupTab = document.querySelector('.auth-tab:nth-child(2)');
    
    if (type === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    console.log('Login attempt...');
    
    showLoading(true);
    
    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    console.log('Login data:', loginData);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        console.log('Login response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Login successful:', data);
            
            localStorage.setItem('vitalae_token', data.token);
            currentUser = data.user;
            
            await animateTransition('auth-section', 'profile-section');
            showSection('profile-section');
            
            // Update user info
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userEmail').textContent = currentUser.email;
            
        } else {
            const errorData = await response.json();
            console.error('Login failed:', errorData);
            showNotification('Login failed: ' + (errorData.message || 'Invalid credentials'), 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed: Network error', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    console.log('Signup attempt...');
    
    showLoading(true);
    
    const formData = new FormData(event.target);
    const signupData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    console.log('Signup data:', signupData);
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(signupData)
        });
        
        console.log('Signup response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Signup successful:', data);
            
            localStorage.setItem('vitalae_token', data.token);
            currentUser = data.user;
            
            await animateTransition('auth-section', 'profile-section');
            showSection('profile-section');
            
            // Update user info
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userEmail').textContent = currentUser.email;
            
        } else {
            const errorData = await response.json();
            console.error('Signup failed:', errorData);
            showNotification('Signup failed: ' + (errorData.message || 'Registration failed'), 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Signup failed: Network error', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle profile submission
async function handleProfileSubmit(event) {
    event.preventDefault();
    console.log('Profile submission...');
    
    showLoading(true);
    
    const formData = new FormData(event.target);
    const profileData = {
        age: parseInt(formData.get('age')),
        gender: formData.get('gender'),
        weight: parseFloat(formData.get('weight')),
        height: parseInt(formData.get('height')),
        lifestyle: formData.get('lifestyle'),
        drinking: formData.get('drinking'),
        smoking: formData.get('smoking'),
        bpPatient: formData.get('bpPatient'),
        sugarPatient: formData.get('sugarPatient')
    };
    
    console.log('Profile data:', profileData);
    
    try {
        const token = localStorage.getItem('vitalae_token');
        const response = await fetch('/api/health/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        console.log('Profile response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Profile saved successfully:', data);
            
            showNotification('Profile completed successfully!', 'success');
            
            await animateTransition('profile-section', 'dashboard-section');
            showSection('dashboard-section');
            
        } else {
            const errorData = await response.json();
            console.error('Profile save failed:', errorData);
            showNotification('Profile save failed: ' + (errorData.message || 'Failed to save profile'), 'error');
        }
    } catch (error) {
        console.error('Profile save error:', error);
        showNotification('Profile save failed: Network error', 'error');
    } finally {
        showLoading(false);
    }
}

// Show section with animation
function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Initialize charts if showing dashboard
        if (sectionName === 'dashboard-section') {
            setTimeout(() => {
                initializeCharts();
            }, 100);
        }
    }
}

// Show monitoring section (for graph navigation)
function showMonitoringSection(sectionName) {
    console.log('Showing monitoring section:', sectionName);
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-section li');
    navItems.forEach(item => item.classList.remove('active'));
    
    const activeNavItem = document.querySelector(`.nav-section li[onclick*="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Hide all graph sections
    const graphSections = document.querySelectorAll('.graph-section');
    graphSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target graph section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update section title and description
        const titles = {
            'heart-rate': 'Heart Rate Monitoring',
            'ecg': 'Electrocardiogram (ECG)',
            'lactate': 'Lactate Monitoring',
            'spo2': 'Blood Oxygen Saturation (SpO2)'
        };
        
        const descriptions = {
            'heart-rate': 'Real-time cardiac rhythm analysis and monitoring',
            'ecg': 'Cardiac electrical activity monitoring and analysis',
            'lactate': 'Metabolic performance tracking and lactate threshold analysis',
            'spo2': 'Oxygen saturation monitoring and respiratory health tracking'
        };
        
        document.getElementById('sectionTitle').textContent = titles[sectionName] || 'Health Monitoring';
        document.getElementById('sectionDescription').textContent = descriptions[sectionName] || 'Real-time health metrics and vital signs analysis';
        
        // Force chart resize after transition
        setTimeout(() => {
            if (charts[sectionName]) {
                charts[sectionName].resize();
                charts[sectionName].render();
            }
        }, 300);
    }
}

// Animate transition between sections
async function animateTransition(fromSection, toSection) {
    return new Promise((resolve) => {
        const fromElement = document.getElementById(fromSection);
        const toElement = document.getElementById(toSection);
        
        if (fromElement && toElement) {
            fromElement.classList.add('slide-out');
            
            setTimeout(() => {
                fromElement.classList.remove('active', 'slide-out');
                toElement.classList.add('active', 'slide-in');
                
                setTimeout(() => {
                    toElement.classList.remove('slide-in');
                    resolve();
                }, 500);
            }, 500);
        } else {
            resolve();
        }
    });
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#667eea'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Initialize charts
function initializeCharts() {
    console.log('Initializing charts...');
    
    // Heart Rate Chart
    const hrCtx = document.getElementById('hrChart');
    if (hrCtx && !charts['heart-rate']) {
        charts['heart-rate'] = new Chart(hrCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Heart Rate (BPM)',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 40,
                        max: 200,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#718096',
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#718096',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                animation: {
                    duration: 750
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    // ECG Chart
    const ecgCtx = document.getElementById('ecgChart');
    if (ecgCtx && !charts['ecg']) {
        charts['ecg'] = new Chart(ecgCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'ECG (mV)',
                    data: [],
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: -2,
                        max: 2,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#718096',
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#718096',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                animation: {
                    duration: 750
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    // Lactate Chart
    const lactateCtx = document.getElementById('lactateChart');
    if (lactateCtx && !charts['lactate']) {
        charts['lactate'] = new Chart(lactateCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Lactate (mmol/L)',
                    data: [],
                    borderColor: '#45b7d1',
                    backgroundColor: 'rgba(69, 183, 209, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0,
                        max: 20,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#718096',
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#718096',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                animation: {
                    duration: 750
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    // SpO2 Chart
    const spo2Ctx = document.getElementById('spo2Chart');
    if (spo2Ctx && !charts['spo2']) {
        charts['spo2'] = new Chart(spo2Ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'SpO2 (%)',
                    data: [],
                    borderColor: '#96ceb4',
                    backgroundColor: 'rgba(150, 206, 180, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#718096',
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#718096',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                animation: {
                    duration: 750
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    // Force chart resize after initialization
    setTimeout(() => {
        resizeCharts();
    }, 50);
}

// Resize all charts
function resizeCharts() {
    Object.values(charts).forEach(chart => {
        if (chart && chart.resize) {
            chart.resize();
        }
    });
}

// Refresh data function
function refreshData() {
    console.log('Refreshing health data...');
    
    // Clear existing data
    healthData = { heartRate: [], ecg: [], lactate: [], spo2: [] };
    
    // Reset charts
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.update('none');
        }
    });
    
    // Reset current values
    document.getElementById('hrCurrentValue').textContent = '--';
    document.getElementById('ecgCurrentValue').textContent = '--';
    document.getElementById('lactateCurrentValue').textContent = '--';
    document.getElementById('spo2CurrentValue').textContent = '--';
    
    showNotification('Data refreshed successfully', 'success');
}

// Connect to Socket.IO
function connectSocket() {
    console.log('Connecting to Socket.IO...');
    
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        showNotification('Connected to VITALAÉ monitoring system', 'success');
    });
    
    socket.on('healthData', (data) => {
        console.log('Received health data:', data);
        updateHealthData(data);
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showNotification('Connection lost. Attempting to reconnect...', 'error');
    });
}

// Update health data and charts
function updateHealthData(data) {
    const now = new Date().toLocaleTimeString();
    
    // Update heart rate
    if (data.heartRate !== undefined) {
        healthData.heartRate.push({ time: now, value: data.heartRate });
        if (healthData.heartRate.length > 50) healthData.heartRate.shift();
        
        if (charts['heart-rate']) {
            charts['heart-rate'].data.labels = healthData.heartRate.map(d => d.time);
            charts['heart-rate'].data.datasets[0].data = healthData.heartRate.map(d => d.value);
            charts['heart-rate'].update('none');
        }
        
        document.getElementById('hrCurrentValue').textContent = data.heartRate;
    }
    
    // Update ECG
    if (data.ecg !== undefined) {
        healthData.ecg.push({ time: now, value: data.ecg });
        if (healthData.ecg.length > 100) healthData.ecg.shift();
        
        if (charts['ecg']) {
            charts['ecg'].data.labels = healthData.ecg.map(d => d.time);
            charts['ecg'].data.datasets[0].data = healthData.ecg.map(d => d.value);
            charts['ecg'].update('none');
        }
        
        document.getElementById('ecgCurrentValue').textContent = data.ecg.toFixed(2);
    }
    
    // Update lactate
    if (data.lactate !== undefined) {
        healthData.lactate.push({ time: now, value: data.lactate });
        if (healthData.lactate.length > 50) healthData.lactate.shift();
        
        if (charts['lactate']) {
            charts['lactate'].data.labels = healthData.lactate.map(d => d.time);
            charts['lactate'].data.datasets[0].data = healthData.lactate.map(d => d.value);
            charts['lactate'].update('none');
        }
        
        document.getElementById('lactateCurrentValue').textContent = data.lactate.toFixed(1);
    }
    
    // Update SpO2
    if (data.spo2 !== undefined) {
        healthData.spo2.push({ time: now, value: data.spo2 });
        if (healthData.spo2.length > 50) healthData.spo2.shift();
        
        if (charts['spo2']) {
            charts['spo2'].data.labels = healthData.spo2.map(d => d.time);
            charts['spo2'].data.datasets[0].data = healthData.spo2.map(d => d.value);
            charts['spo2'].update('none');
        }
        
        document.getElementById('spo2CurrentValue').textContent = data.spo2;
    }
}

// Validate token and redirect
async function validateTokenAndRedirect(token) {
    try {
        const response = await fetch('/api/auth/validate', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            // Check if user has profile
            const profileResponse = await fetch('/api/health/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (profileResponse.ok) {
                await animateTransition('auth-section', 'dashboard-section');
                showSection('dashboard-section');
            } else {
                await animateTransition('auth-section', 'profile-section');
                showSection('profile-section');
            }
            
            // Update user info
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userEmail').textContent = currentUser.email;
        }
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('vitalae_token');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('vitalae_token');
    currentUser = null;
    
    // Reset charts
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    charts = {};
    healthData = { heartRate: [], ecg: [], lactate: [], spo2: [] };
    
    // Reset forms
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    document.getElementById('profileForm').reset();
    
    // Show auth section
    showSection('auth-section');
    
    // Reset navigation
    const navItems = document.querySelectorAll('.nav-section li');
    navItems.forEach(item => item.classList.remove('active'));
    if (navItems[0]) navItems[0].classList.add('active');
    
    // Reset auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach((tab, index) => {
        tab.classList.toggle('active', index === 0);
    });
    
    // Show login form
    showAuthForm('login');
    
    showNotification('Successfully signed out', 'success');
}

// Test authentication functions (for debugging)
function testAuth() {
    console.log('Testing authentication...');
    
    // Test login
    const testLoginData = {
        email: 'test@vitalae.com',
        password: 'test123'
    };
    
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testLoginData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Test login result:', data);
        showNotification('Test login result: ' + JSON.stringify(data, null, 2), 'info');
    })
    .catch(error => {
        console.error('Test login error:', error);
        showNotification('Test login error: ' + error.message, 'error');
    });
}

// Global functions for manual testing
window.testLogin = function() {
    document.getElementById('loginEmail').value = 'test@vitalae.com';
    document.getElementById('loginPassword').value = 'test123';
    handleLogin({ preventDefault: () => {} });
};

window.testRegister = function() {
    document.getElementById('signupName').value = 'Test User';
    document.getElementById('signupEmail').value = 'test2@vitalae.com';
    document.getElementById('signupPassword').value = 'test123';
    handleSignup({ preventDefault: () => {} });
};

window.testAuth = testAuth;
window.refreshData = refreshData;
