document.addEventListener('DOMContentLoaded', function() {
    checkLoginState();
    
    const dashboardNav = document.getElementById('dashboard-nav');
    if (dashboardNav) {
        dashboardNav.addEventListener('click', function(e) {
            if (!checkLoginState()) {
                e.preventDefault();
                showMessage('Please login to access your dashboard.', 'error');
                toggleLogin();
                return false;
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('dashboard-btn')) {
            if (!checkLoginState()) {
                e.preventDefault();
                showMessage('Please login to access this feature.', 'error');
                toggleLogin();
                return false;
            }
            showMessage('This feature is coming soon!', 'info');
        }
    });
    
    document.querySelector('.newsletter-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.querySelector('.newsletter-input').value;
        if (email) {
            showMessage('Thank you for subscribing!', 'success');
            document.querySelector('.newsletter-input').value = '';
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Skip if href is just '#' or empty
            if (!href || href === '#' || href.length <= 1) {
                return;
            }
            
            // Skip if the element has an onclick handler (like login button)
            if (this.hasAttribute('onclick')) {
                return;
            }
            
            // Skip if the element has specific classes that shouldn't use smooth scrolling
            if (this.classList.contains('login-btn') || 
                this.classList.contains('forgot-link') || 
                this.classList.contains('app-btn')) {
                return;
            }
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const searchOverlay = document.getElementById('search-overlay');
            const loginOverlay = document.getElementById('login-overlay');
            
            if (searchOverlay && searchOverlay.style.display === 'flex') {
                toggleSearch();
            }
            if (loginOverlay && loginOverlay.classList.contains('active')) {
                toggleLogin();
            }
            
            // Also hide message overlay
            hideMessage();
        }
    });
});

// Protected action functions that require login
function showJournal() {
    requireLogin(() => {
        showMessage('Journal feature coming soon!', 'info');
    });
}

function startQuickMeditation() {
    requireLogin(() => {
        showMessage('Starting 5-minute meditation...', 'success');
    });
}

function showResources() {
    requireLogin(() => {
        showMessage('Support resources loading...', 'info');
    });
}

function viewProgress() {
    requireLogin(() => {
        showMessage('Progress tracking coming soon!', 'info');
    });
}

function recordMood(mood) {
    requireLogin(() => {
        showMessage(`Mood "${mood}" recorded successfully!`, 'success');
    });
}

// Search functionality
function toggleSearch() {
    const overlay = document.getElementById('search-overlay');
    const isVisible = overlay.style.display === 'flex';
    
    if (isVisible) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    } else {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('search-input').focus();
    }
}

function performSearch(event) {
    event.preventDefault();
    const searchTerm = document.getElementById('search-input').value.trim();
    
    if (searchTerm) {
        alert(`Searching for: "${searchTerm}"`);
        toggleSearch();
        document.getElementById('search-input').value = '';
    }
}

function searchFor(term) {
    document.getElementById('search-input').value = term;
    performSearch({ preventDefault: () => {} });
}

// Login modal functionality
function toggleLogin() {
    const overlay = document.getElementById('login-overlay');
    const isVisible = overlay.classList.contains('active');
    
    if (isVisible) {
        // Hide the modal
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        // Wait for animation to finish before hiding
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    } else {
        // Show the modal
        overlay.style.display = 'flex';
        // Force reflow to ensure display change takes effect
        overlay.offsetHeight;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    }
}

// Enhanced Authentication functions with proper validation
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Validate empty fields
    if (!email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Wait for Firebase to be ready
    waitForFirebase()
        .then(() => {
            return window.firebaseAuth.signInWithEmailAndPassword(window.firebaseAuth.auth, email, password);
        })
        .then((result) => {
            const user = result.user;
            const displayName = user.displayName || user.email.split('@')[0];
            
            // Store user info with remember me option
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL || 'https://via.placeholder.com/40',
                rememberMe: rememberMe
            };
            
            if (rememberMe) {
                localStorage.setItem('puthal_user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('puthal_user', JSON.stringify(userData));
            }
            
            // Update UI for logged in state
            updateAuthUI(true, displayName, user.photoURL || 'https://via.placeholder.com/40');
            
            // Show success message
            showMessage(`Welcome back, ${displayName}!`, 'success');
            toggleLogin();
            
            // Clear form
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            document.getElementById('remember-me').checked = false;
            
            // Redirect to dashboard after successful login
            setTimeout(() => {
                redirectToDashboard();
            }, 800);
        })
        .catch((error) => {
            let message = 'Invalid Credentials';
            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Invalid Credentials';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many failed attempts. Please try again later.';
            } else if (error.message.includes('Firebase')) {
                message = 'Authentication service is loading. Please try again in a moment.';
            }
            showMessage(message, 'error');
        });
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    // Validate all fields are filled
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address (e.g., name@gmail.com).', 'error');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        showMessage('Password should be at least 6 characters long.', 'error');
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return;
    }

    // Wait for Firebase to be ready
    waitForFirebase()
        .then(() => {
            return window.firebaseAuth.createUserWithEmailAndPassword(window.firebaseAuth.auth, email, password);
        })
        .then((result) => {
            const user = result.user;
            const displayName = name;
            
            // Store user info
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL || 'https://via.placeholder.com/40'
            };
            
            localStorage.setItem('puthal_user', JSON.stringify(userData));
            
            // Update UI for logged in state
            updateAuthUI(true, displayName, user.photoURL || 'https://via.placeholder.com/40');
            
            return window.updateProfile(result.user, { displayName: displayName });
        })
        .then(() => {
            showMessage('Signup Successful! Welcome to Puthal!', 'success');
            toggleLogin();
            
            // Clear form
            document.getElementById('signup-name').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-confirm').value = '';
            
            // Redirect to dashboard after successful signup
            setTimeout(() => {
                redirectToDashboard();
            }, 800);
        })
        .catch((error) => {
            let message = 'Signup failed. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'An account with this email already exists.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password too short';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.message.includes('Firebase')) {
                message = 'Authentication service is loading. Please try again in a moment.';
            }
            showMessage(message, 'error');
        });
}

function loginWithGoogle() {
    waitForFirebase()
        .then(() => {
            return window.firebaseAuth.signInWithPopup(window.firebaseAuth.auth, window.firebaseAuth.googleProvider);
        })
        .then((result) => {
            const user = result.user;
            const displayName = user.displayName || user.email.split('@')[0];
            
            // Store user info
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL || 'https://via.placeholder.com/40'
            };
            
            localStorage.setItem('puthal_user', JSON.stringify(userData));
            
            // Update UI for logged in state
            updateAuthUI(true, displayName, user.photoURL || 'https://via.placeholder.com/40');
            
            // Show success message and redirect to dashboard
            showMessage(`Welcome, ${displayName}! You're now signed in.`, 'success');
            
            // Close modal
            toggleLogin();
        })
        .catch((error) => {
            // Handle specific Google login errors gracefully
            if (error.code === 'auth/popup-blocked') {
                showMessage('Popup was blocked by your browser. Please enable popups for this site and try again.', 'error');
            } else if (error.code === 'auth/popup-closed-by-user') {
                // User closed popup - no need to show error
                return;
            } else if (error.code === 'auth/cancelled-popup-request') {
                // User cancelled - no need to show error
                return;
            } else if (error.code === 'auth/unauthorized-domain') {
                showMessage('Google login is not configured for this domain. Please use email/password login.', 'error');
            } else if (error.code === 'auth/operation-not-allowed') {
                showMessage('Google login is not enabled. Please use email/password login.', 'error');
            } else if (error.message.includes('Firebase')) {
                showMessage('Google login service is loading. Please try again in a moment.', 'error');
            } else {
                showMessage('Google login failed. Please try email/password login or try again.', 'error');
            }
        });
}

// Helper function to wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        if (window.firebaseAuth && window.firebaseAuth.auth) {
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkFirebase = () => {
            attempts++;
            if (window.firebaseAuth && window.firebaseAuth.auth) {
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('Firebase authentication service failed to load'));
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        
        setTimeout(checkFirebase, 100);
    });
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Enhanced message display system
function showMessage(message, type = 'info') {
    const overlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');
    
    if (!overlay || !messageText) {
        // Fallback to alert if message system not available
        alert(message);
        return;
    }
    
    messageText.textContent = message;
    overlay.className = `message-overlay ${type}`;
    overlay.style.display = 'flex';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideMessage();
        }, 3000);
    }
}

function hideMessage() {
    const overlay = document.getElementById('message-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Enhanced Authentication UI Management with session persistence
function updateAuthUI(isLoggedIn, displayName = '', photoURL = '') {
    console.log('updateAuthUI called with isLoggedIn:', isLoggedIn);
    
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const navbarGreeting = document.getElementById('navbar-greeting');
    const dashboardNav = document.getElementById('dashboard-nav');
    const dashboardSection = document.getElementById('dashboard');
    
    console.log('Elements found:', {
        authBtn: !!authBtn,
        logoutBtn: !!logoutBtn,
        navbarGreeting: !!navbarGreeting,
        dashboardNav: !!dashboardNav,
        dashboardSection: !!dashboardSection
    });
    
    if (isLoggedIn) {
        if (authBtn) authBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (navbarGreeting) navbarGreeting.style.display = 'block';
        if (dashboardNav) {
            dashboardNav.style.display = 'block';
            console.log('Dashboard nav shown');
        }
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
            console.log('Dashboard section shown');
        }
        
        // Update any user display elements if they exist
        const userDisplays = document.querySelectorAll('.user-name-display');
        userDisplays.forEach(el => el.textContent = displayName);
        
        // Update user display name in dashboard
        const userDisplayName = document.getElementById('user-display-name');
        if (userDisplayName) {
            userDisplayName.textContent = displayName;
        }
    } else {
        if (authBtn) authBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (navbarGreeting) navbarGreeting.style.display = 'none';
        if (dashboardNav) {
            dashboardNav.style.display = 'none';
            console.log('Dashboard nav hidden');
        }
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
            console.log('Dashboard section hidden');
        }
        
        // Reset user display elements
        const userDisplays = document.querySelectorAll('.user-name-display');
        userDisplays.forEach(el => el.textContent = 'User');
    }
}

function logout() {
    enhancedLogout();
}

// Enhanced login state check with session support
function checkLoginState() {
    // Check localStorage first (remember me)
    let userData = localStorage.getItem('puthal_user');
    
    // If not in localStorage, check sessionStorage
    if (!userData) {
        userData = sessionStorage.getItem('puthal_user');
    }
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            updateAuthUI(true, user.displayName, user.photoURL);
            checkDashboardAccess(); // Update dashboard visibility
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            // Clear corrupted data
            localStorage.removeItem('puthal_user');
            sessionStorage.removeItem('puthal_user');
        }
    }
    
    checkDashboardAccess(); // Ensure dashboard is hidden if not logged in
    return false;
}

// Prevent access to protected content without login
function requireLogin(callback) {
    if (!checkLoginState()) {
        showMessage('Please login to access this feature.', 'error');
        toggleLogin();
        return false;
    }
    if (callback) callback();
    return true;
}

// Dashboard Functions
function redirectToDashboard() {
    console.log('redirectToDashboard called');
    
    // Show dashboard section
    const dashboardSection = document.getElementById('dashboard');
    const dashboardNav = document.getElementById('dashboard-nav');
    
    console.log('Dashboard section found:', !!dashboardSection);
    console.log('Dashboard nav found:', !!dashboardNav);
    
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
        console.log('Dashboard section display set to block');
    }
    
    if (dashboardNav) {
        dashboardNav.style.display = 'block';
        console.log('Dashboard nav display set to block');
    }
    
    // Scroll to dashboard
    setTimeout(() => {
        if (dashboardSection) {
            dashboardSection.scrollIntoView({ behavior: 'smooth' });
            console.log('Scrolling to dashboard');
        }
    }, 500);
    
    // Initialize dashboard data
    initializeDashboard();
}

function initializeDashboard() {
    // Set some sample stats for the dashboard
    const streakElement = document.getElementById('days-streak');
    const sessionsElement = document.getElementById('sessions-completed');
    const moodElement = document.getElementById('mood-average');
    
    if (streakElement) streakElement.textContent = '7';
    if (sessionsElement) sessionsElement.textContent = '12';
    if (moodElement) moodElement.textContent = '8.2';
}

function checkDashboardAccess() {
    const dashboardSection = document.getElementById('dashboard');
    const dashboardNav = document.getElementById('dashboard-nav');
    
    if (checkLoginState()) {
        // User is logged in - show dashboard elements
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
        if (dashboardNav) {
            dashboardNav.style.display = 'block';
        }
    } else {
        // User is not logged in - hide dashboard elements
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
        }
        if (dashboardNav) {
            dashboardNav.style.display = 'none';
        }
    }
}

// Enhanced logout function
function enhancedLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Hide dashboard
        const dashboardSection = document.getElementById('dashboard');
        const dashboardNav = document.getElementById('dashboard-nav');
        
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
        }
        if (dashboardNav) {
            dashboardNav.style.display = 'none';
        }
        
        // Clear both localStorage and sessionStorage
        localStorage.removeItem('puthal_user');
        sessionStorage.removeItem('puthal_user');
        
        // Sign out from Firebase
        if (window.firebaseAuth && window.firebaseAuth.auth) {
            window.firebaseAuth.signOut(window.firebaseAuth.auth);
        }
        
        // Update UI
        updateAuthUI(false);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        showMessage('You have been logged out successfully.', 'success');
    }
}

// Test function to manually show dashboard (for debugging)
function testShowDashboard() {
    console.log('Testing dashboard visibility...');
    const dashboardSection = document.getElementById('dashboard');
    const dashboardNav = document.getElementById('dashboard-nav');
    
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
        console.log('Dashboard section manually shown');
    } else {
        console.log('Dashboard section not found!');
    }
    
    if (dashboardNav) {
        dashboardNav.style.display = 'block';
        console.log('Dashboard nav manually shown');
    } else {
        console.log('Dashboard nav not found!');
    }
    
    // Scroll to dashboard
    setTimeout(() => {
        if (dashboardSection) {
            dashboardSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 500);
}

// Make it available globally for testing
window.testShowDashboard = testShowDashboard;
