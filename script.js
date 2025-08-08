document.addEventListener('DOMContentLoaded', function() {
    checkLoginState();
    checkAuthAndRedirect(); // Add route protection check
    
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

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            if (!href || href === '#' || href.length <= 1) {
                return;
            }
            
            if (this.hasAttribute('onclick')) {
                return;
            }
            
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
            
            hideMessage();
        }
    });
});

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
        showMessage(`Searching for: "${searchTerm}"`, 'info');
        toggleSearch();
        document.getElementById('search-input').value = '';
    }
}

function searchFor(term) {
    document.getElementById('search-input').value = term;
    performSearch({ preventDefault: () => {} });
}

function toggleLogin() {
    const overlay = document.getElementById('login-overlay');
    const isVisible = overlay.classList.contains('active');
    
    if (isVisible) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    } else {
        overlay.style.display = 'flex';
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

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    if (!email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    waitForFirebase()
        .then(() => {
            return window.firebaseAuth.signInWithEmailAndPassword(window.firebaseAuth.auth, email, password);
        })
        .then((result) => {
            const user = result.user;
            const displayName = user.displayName || user.email.split('@')[0];
            
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
            
            updateAuthUI(true, displayName, user.photoURL || 'https://via.placeholder.com/40');
            
            showWelcomeMessage(displayName);
            toggleLogin();
            
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            document.getElementById('remember-me').checked = false;
            
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
    
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address (e.g., name@gmail.com).', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password should be at least 6 characters long.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return;
    }

    waitForFirebase()
        .then(() => {
            return window.firebaseAuth.createUserWithEmailAndPassword(window.firebaseAuth.auth, email, password);
        })
        .then((result) => {
            const user = result.user;
            const displayName = name;
            
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL || 'https://via.placeholder.com/40'
            };
            
            localStorage.setItem('puthal_user', JSON.stringify(userData));
            
            updateAuthUI(true, displayName, user.photoURL || 'https://via.placeholder.com/40');
            
            return window.updateProfile(result.user, { displayName: displayName });
        })
        .then(() => {
            showMessage('Account created successfully! Welcome to Puthal!', 'success');
            toggleLogin();
            
            document.getElementById('signup-name').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-confirm').value = '';
            
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
            
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL || 'https://via.placeholder.com/40'
            };
            
            localStorage.setItem('puthal_user', JSON.stringify(userData));
            
            updateAuthUI(true, displayName, user.photoURL || 'https://via.placeholder.com/40');
            
            showWelcomeMessage(displayName);
            
            toggleLogin();
        })
        .catch((error) => {
            if (error.code === 'auth/popup-blocked') {
                showMessage('Popup was blocked by your browser. Please enable popups for this site and try again.', 'error');
            } else if (error.code === 'auth/popup-closed-by-user') {
                return;
            } else if (error.code === 'auth/cancelled-popup-request') {
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

function waitForFirebase() {
    return new Promise((resolve, reject) => {
        if (window.firebaseAuth && window.firebaseAuth.auth) {
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 50;
        
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type = 'info') {
    const overlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');
    
    if (!overlay || !messageText) {
        alert(message);
        return;
    }
    
    messageText.textContent = message;
    overlay.className = `message-overlay ${type}`;
    overlay.style.display = 'flex';
    
    // Auto-hide messages based on type
    if (type === 'success') {
        setTimeout(() => {
            hideMessage();
        }, 3000);
    } else if (type === 'welcome') {
        setTimeout(() => {
            hideMessage();
        }, 5000); // Show welcome messages longer
    } else if (type === 'info') {
        setTimeout(() => {
            hideMessage();
        }, 4000);
    }
}

function hideMessage() {
    const overlay = document.getElementById('message-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function updateAuthUI(isLoggedIn, displayName = '', photoURL = '') {
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const navbarGreeting = document.getElementById('navbar-greeting');
    const dashboardNav = document.getElementById('dashboard-nav');
    const dashboardSection = document.getElementById('dashboard');
    
    if (isLoggedIn) {
        if (authBtn) authBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (navbarGreeting) navbarGreeting.style.display = 'block';
        if (dashboardNav) {
            dashboardNav.style.display = 'block';
        }
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
        
        const userDisplays = document.querySelectorAll('.user-name-display');
        userDisplays.forEach(el => el.textContent = displayName);
    } else {
        if (authBtn) authBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (navbarGreeting) navbarGreeting.style.display = 'none';
        if (dashboardNav) {
            dashboardNav.style.display = 'none';
        }
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
        }
        
        const userDisplays = document.querySelectorAll('.user-name-display');
        userDisplays.forEach(el => el.textContent = 'User');
    }
}

function logout() {
    enhancedLogout();
}

function checkLoginState() {
    let userData = localStorage.getItem('puthal_user');
    
    if (!userData) {
        userData = sessionStorage.getItem('puthal_user');
    }
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            updateAuthUI(true, user.displayName, user.photoURL);
            checkDashboardAccess(); 
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('puthal_user');
            sessionStorage.removeItem('puthal_user');
        }
    }
    
    checkDashboardAccess(); 
    return false;
}

function requireLogin(callback) {
    if (!checkLoginState()) {
        showMessage('Please login to access this feature.', 'error');
        toggleLogin();
        return false;
    }
    if (callback) callback();
    return true;
}

function redirectToDashboard() {
    const dashboardSection = document.getElementById('dashboard');
    const dashboardNav = document.getElementById('dashboard-nav');
    
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
    }
    
    if (dashboardNav) {
        dashboardNav.style.display = 'block';
    }
    
    // Update dashboard welcome message
    updateDashboardWelcome();
    
    setTimeout(() => {
        if (dashboardSection) {
            dashboardSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 500);
    
    initializeDashboard();
}

function updateDashboardWelcome() {
    let userData = localStorage.getItem('puthal_user');
    if (!userData) {
        userData = sessionStorage.getItem('puthal_user');
    }
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const dashboardWelcome = document.getElementById('dashboard-welcome');
            if (dashboardWelcome) {
                const currentHour = new Date().getHours();
                let timeGreeting = '';
                
                if (currentHour < 12) {
                    timeGreeting = 'Good morning';
                } else if (currentHour < 17) {
                    timeGreeting = 'Good afternoon';
                } else {
                    timeGreeting = 'Good evening';
                }
                
                dashboardWelcome.textContent = `${timeGreeting}, ${user.displayName}!`;
            }
        } catch (error) {
            console.error('Error updating dashboard welcome:', error);
        }
    }
}

function initializeDashboard() {
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
    const currentHash = window.location.hash;
    
    let userData = localStorage.getItem('puthal_user');
    if (!userData) {
        userData = sessionStorage.getItem('puthal_user');
    }
    
    const isLoggedIn = !!userData;
    
    if (isLoggedIn) {
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
        if (dashboardNav) {
            dashboardNav.style.display = 'block';
        }
    } else {
        // If user is not logged in and trying to access dashboard
        if (currentHash === '#dashboard') {
            window.location.hash = '#home';
            showMessage('Please login to access your dashboard.', 'error');
            setTimeout(() => {
                toggleLogin();
            }, 1000);
        }
        
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
        }
        if (dashboardNav) {
            dashboardNav.style.display = 'none';
        }
    }
}

function enhancedLogout() {
    if (confirm('Are you sure you want to logout?')) {
        const dashboardSection = document.getElementById('dashboard');
        const dashboardNav = document.getElementById('dashboard-nav');
        
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
        }
        if (dashboardNav) {
            dashboardNav.style.display = 'none';
        }
        localStorage.removeItem('puthal_user');
        sessionStorage.removeItem('puthal_user');
        if (window.firebaseAuth && window.firebaseAuth.auth) {
            window.firebaseAuth.signOut(window.firebaseAuth.auth);
        }
        
        updateAuthUI(false);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        showMessage('You have been logged out successfully.', 'success');
    }
}

// Forgot Password Functions
function showForgotPassword() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-password-form');
    const tabs = document.querySelectorAll('.tab-btn');
    
    // Hide login and signup forms
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    forgotForm.classList.add('active');
    
    // Hide tabs
    tabs.forEach(tab => tab.style.display = 'none');
    
    // Update header
    const loginHeader = document.querySelector('.login-header h2');
    loginHeader.textContent = 'Reset Password';
}

function backToLogin() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-password-form');
    const tabs = document.querySelectorAll('.tab-btn');
    
    // Show login form
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    forgotForm.classList.remove('active');
    
    // Show tabs
    tabs.forEach(tab => tab.style.display = 'block');
    
    // Reset tab states
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[onclick="switchTab(\'login\')"]').classList.add('active');
    
    // Reset header
    const loginHeader = document.querySelector('.login-header h2');
    loginHeader.textContent = 'Welcome to Puthal';
    
    // Clear forgot password form
    document.getElementById('forgot-email').value = '';
}

function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgot-email').value.trim();
    
    if (!email) {
        showMessage('Please enter your email address.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    waitForFirebase()
        .then(() => {
            return window.firebaseAuth.sendPasswordResetEmail(window.firebaseAuth.auth, email);
        })
        .then(() => {
            showMessage('Password reset link sent! Please check your email.', 'success');
            document.getElementById('forgot-email').value = '';
            
            // Automatically go back to login after successful send
            setTimeout(() => {
                backToLogin();
            }, 2000);
        })
        .catch((error) => {
            let message = 'Failed to send reset email. Please try again.';
            
            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email address.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many requests. Please try again later.';
            }
            
            showMessage(message, 'error');
        });
}

// Enhanced Welcome Message Function
function showWelcomeMessage(displayName) {
    const currentHour = new Date().getHours();
    let greeting;
    
    if (currentHour < 12) {
        greeting = 'Good morning';
    } else if (currentHour < 17) {
        greeting = 'Good afternoon';
    } else {
        greeting = 'Good evening';
    }
    
    const motivationalQuotes = [
        'Today is a new day to care for your mind.',
        'Your mental wellness journey continues.',
        'Take a moment to breathe and reflect.',
        'Every step forward is progress.',
        'You are stronger than you think.',
        'Self-care is not selfish, it\'s essential.',
        'Your mental health matters.'
    ];
    
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    
    const welcomeMessage = `${greeting}, ${displayName}! 🌟 ${randomQuote}`;
    
    // Show welcome message with enhanced styling
    setTimeout(() => {
        showMessage(welcomeMessage, 'welcome');
    }, 1000);
}

// Enhanced Auth State Check with Route Protection
function checkAuthAndRedirect() {
    const currentPath = window.location.hash || '#home';
    const protectedRoutes = ['#dashboard'];
    
    if (protectedRoutes.includes(currentPath)) {
        if (!checkLoginState()) {
            showMessage('Please login to access this page.', 'error');
            window.location.hash = '#home';
            toggleLogin();
            return false;
        }
    }
    
    return true;
}

// Monitor hash changes for route protection
window.addEventListener('hashchange', () => {
    checkAuthAndRedirect();
});

// Enhanced Login State Check with Session Persistence
function checkLoginState() {
    let userData = localStorage.getItem('puthal_user');
    
    if (!userData) {
        userData = sessionStorage.getItem('puthal_user');
    }
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            updateAuthUI(true, user.displayName, user.photoURL);
            checkDashboardAccess();
            
            // Show personalized greeting in navbar
            updateNavbarGreeting(user.displayName);
            
            // Update dashboard welcome if on dashboard
            if (window.location.hash === '#dashboard') {
                updateDashboardWelcome();
            }
            
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('puthal_user');
            sessionStorage.removeItem('puthal_user');
        }
    }
    
    checkDashboardAccess();
    return false;
}

// Update navbar greeting with time-based message
function updateNavbarGreeting(displayName) {
    const navbarGreeting = document.getElementById('navbar-greeting');
    const userNameDisplay = document.querySelector('.user-name-display');
    
    if (navbarGreeting && userNameDisplay) {
        const currentHour = new Date().getHours();
        let timeGreeting = '';
        
        if (currentHour < 12) {
            timeGreeting = 'Good morning';
        } else if (currentHour < 17) {
            timeGreeting = 'Good afternoon';
        } else {
            timeGreeting = 'Good evening';
        }
        
        userNameDisplay.textContent = displayName;
        navbarGreeting.innerHTML = `${timeGreeting}, <span class="user-name-display">${displayName}</span>! 👋`;
        navbarGreeting.style.display = 'block';
    }
}
