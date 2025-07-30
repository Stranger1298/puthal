
        document.querySelector('.newsletter-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.querySelector('.newsletter-input').value;
            if (email) {
                alert('Thank you for subscribing! We\'ll keep you updated on our mental health resources.');
                document.querySelector('.newsletter-input').value = '';
            }
        });

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        function toggleSearch() {
            const overlay = document.getElementById('search-overlay');
            if (!overlay) {
                console.error('Search overlay not found');
                return;
            }
            
            const isVisible = overlay.style.display === 'flex';
            
            if (isVisible) {
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            } else {
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        }

        function performSearch(event) {
            event.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (!searchInput) return;
            
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm) {
                // Simulate search functionality
                alert(`Searching for: "${searchTerm}"\n\nThis would typically connect to a search API or database to find relevant mental health resources, articles, or features.`);
                toggleSearch();
                searchInput.value = '';
            }
        }

        function searchFor(term) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = term;
                performSearch(new Event('submit'));
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            const overlay = document.getElementById('search-overlay');
            if (overlay) {
                overlay.addEventListener('click', function(e) {
                    if (e.target === this) {
                        toggleSearch();
                    }
                });
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('search-overlay');
                if (overlay && overlay.style.display === 'flex') {
                    toggleSearch();
                }
                const loginOverlay = document.getElementById('login-overlay');
                if (loginOverlay && loginOverlay.style.display === 'flex') {
                    toggleLogin();
                }
            }
        });

        // Login Modal Functions
        function toggleLogin() {
            const overlay = document.getElementById('login-overlay');
            if (!overlay) {
                console.error('Login overlay not found');
                return;
            }
            
            const isVisible = overlay.style.display === 'flex';
            
            if (isVisible) {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 300);
            } else {
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    overlay.classList.add('active');
                }, 10);
            }
        }

        function switchTab(tabName) {
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const tabBtns = document.querySelectorAll('.tab-btn');
            
            // Remove active class from all tabs and forms
            tabBtns.forEach(btn => btn.classList.remove('active'));
            loginForm.classList.remove('active');
            signupForm.classList.remove('active');
            
            // Add active class to selected tab and form
            if (tabName === 'login') {
                document.querySelector('.tab-btn:first-child').classList.add('active');
                loginForm.classList.add('active');
            } else {
                document.querySelector('.tab-btn:last-child').classList.add('active');
                signupForm.classList.add('active');
            }
        }

        function handleLogin(event) {
            event.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me')?.checked || false;
            
            // Clear any existing error messages
            clearErrorMessages();
            
            // Validation
            if (!email || !password) {
                showError('Please fill in all fields');
                return;
            }
            
            if (!validateEmail(email)) {
                showError('Please enter a valid email address (e.g., name@gmail.com)');
                return;
            }
            
            // Show loading state
            const submitBtn = event.target.querySelector('.auth-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;
            
            // Firebase Authentication
            if (window.firebaseAuth) {
                window.firebaseAuth.signInWithEmailAndPassword(window.firebaseAuth.auth, email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        
                        // Handle remember me
                        if (rememberMe) {
                            localStorage.setItem('puthal_user', JSON.stringify({
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName || user.email.split('@')[0]
                            }));
                        }
                        
                        showSuccess(`Welcome back, ${user.displayName || user.email.split('@')[0]}!`);
                        
                        // Reset form and close modal
                        event.target.reset();
                        setTimeout(() => {
                            toggleLogin();
                            redirectToDashboard();
                        }, 1500);
                    })
                    .catch((error) => {
                        console.error('Login error:', error);
                        let errorMessage = 'Invalid Credentials';
                        
                        switch (error.code) {
                            case 'auth/user-not-found':
                                errorMessage = 'No account found with this email';
                                break;
                            case 'auth/wrong-password':
                                errorMessage = 'Invalid Credentials';
                                break;
                            case 'auth/invalid-email':
                                errorMessage = 'Invalid email address';
                                break;
                            case 'auth/too-many-requests':
                                errorMessage = 'Too many failed attempts. Please try again later';
                                break;
                        }
                        
                        showError(errorMessage);
                    })
                    .finally(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    });
            } else {
                // Fallback for when Firebase is not loaded
                showError('Authentication service is not available. Please try again later.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }

        function handleSignup(event) {
            event.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm').value;
            
            // Clear any existing error messages
            clearErrorMessages();
            
            // Comprehensive validation
            if (!name || !email || !password || !confirmPassword) {
                showError('Please fill in all fields');
                return;
            }
            
            if (name.length < 2) {
                showError('Name must be at least 2 characters long');
                return;
            }
            
            if (!validateEmail(email)) {
                showError('Please enter a valid email address (e.g., name@gmail.com)');
                return;
            }
            
            if (password.length < 6) {
                showError('Password must be at least 6 characters long');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('Password and Confirm Password do not match');
                return;
            }
            
            // Show loading state
            const submitBtn = event.target.querySelector('.auth-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;
            
            // Firebase Authentication
            if (window.firebaseAuth) {
                window.firebaseAuth.createUserWithEmailAndPassword(window.firebaseAuth.auth, email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        
                        // Update user profile with display name
                        return updateProfile(user, {
                            displayName: name
                        }).then(() => {
                            // Store user session
                            localStorage.setItem('puthal_user', JSON.stringify({
                                uid: user.uid,
                                email: user.email,
                                displayName: name
                            }));
                            
                            showSuccess('Signup Successful! Welcome to Puthal!');
                            
                            // Reset form and close modal
                            event.target.reset();
                            setTimeout(() => {
                                toggleLogin();
                                redirectToDashboard();
                            }, 1500);
                        });
                    })
                    .catch((error) => {
                        console.error('Signup error:', error);
                        let errorMessage = 'Account creation failed. Please try again.';
                        
                        switch (error.code) {
                            case 'auth/email-already-in-use':
                                errorMessage = 'An account with this email already exists';
                                break;
                            case 'auth/invalid-email':
                                errorMessage = 'Invalid email address';
                                break;
                            case 'auth/weak-password':
                                errorMessage = 'Password is too weak. Please choose a stronger password';
                                break;
                        }
                        
                        showError(errorMessage);
                    })
                    .finally(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    });
            } else {
                // Fallback for when Firebase is not loaded
                showError('Authentication service is not available. Please try again later.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }

        function loginWithGoogle() {
            if (window.firebaseAuth) {
                window.firebaseAuth.signInWithPopup(window.firebaseAuth.auth, window.firebaseAuth.googleProvider)
                    .then((result) => {
                        const user = result.user;
                        
                        // Store user session
                        localStorage.setItem('puthal_user', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName || user.email.split('@')[0]
                        }));
                        
                        showSuccess(`Welcome, ${user.displayName || user.email.split('@')[0]}!`);
                        
                        setTimeout(() => {
                            toggleLogin();
                            redirectToDashboard();
                        }, 1500);
                    })
                    .catch((error) => {
                        console.error('Google login error:', error);
                        showError('Google sign-in failed. Please try again.');
                    });
            } else {
                showError('Google sign-in is not available. Please try again later.');
            }
        }

        // Helper functions
        function validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'auth-error';
            errorDiv.textContent = message;
            
            const activeForm = document.querySelector('.auth-form.active');
            if (activeForm) {
                // Remove existing error messages
                const existingError = activeForm.querySelector('.auth-error');
                if (existingError) existingError.remove();
                
                // Add new error message at the top of the form
                activeForm.insertBefore(errorDiv, activeForm.firstChild);
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    if (errorDiv.parentNode) errorDiv.remove();
                }, 5000);
            }
        }

        function showSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'auth-success';
            successDiv.textContent = message;
            
            const activeForm = document.querySelector('.auth-form.active');
            if (activeForm) {
                // Remove existing messages
                clearErrorMessages();
                
                // Add success message at the top of the form
                activeForm.insertBefore(successDiv, activeForm.firstChild);
            }
        }

        function clearErrorMessages() {
            const messages = document.querySelectorAll('.auth-error, .auth-success');
            messages.forEach(msg => msg.remove());
        }

        function redirectToDashboard() {
            // Check if user is logged in
            const user = getCurrentUser();
            if (user) {
                // Update navigation to show user info
                updateNavigationForLoggedInUser(user);
                // Here you would typically redirect to a dashboard page
                // For now, we'll just update the page state
                console.log('User logged in:', user);
            }
        }

        function getCurrentUser() {
            const storedUser = localStorage.getItem('puthal_user');
            if (storedUser) {
                return JSON.parse(storedUser);
            }
            return null;
        }

        function updateNavigationForLoggedInUser(user) {
            const loginBtn = document.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.textContent = `Hi, ${user.displayName}`;
                loginBtn.onclick = showUserMenu;
            }
        }

        function showUserMenu() {
            const confirmed = confirm('Would you like to logout?');
            if (confirmed) {
                logout();
            }
        }

        function logout() {
            if (window.firebaseAuth) {
                window.firebaseAuth.signOut(window.firebaseAuth.auth).then(() => {
                    localStorage.removeItem('puthal_user');
                    
                    // Reset navigation
                    const loginBtn = document.querySelector('.login-btn');
                    if (loginBtn) {
                        loginBtn.textContent = 'Login';
                        loginBtn.onclick = toggleLogin;
                    }
                    
                    showSuccess('Logged out successfully!');
                    setTimeout(() => clearErrorMessages(), 2000);
                }).catch((error) => {
                    console.error('Logout error:', error);
                });
            } else {
                localStorage.removeItem('puthal_user');
                location.reload();
            }
        }

        function checkUserSession() {
            const user = getCurrentUser();
            if (user) {
                updateNavigationForLoggedInUser(user);
            }
        }

        // Check authentication status on page load
        document.addEventListener('DOMContentLoaded', function() {
            checkUserSession();
            
            const overlay = document.getElementById('search-overlay');
            if (overlay) {
                overlay.addEventListener('click', function(e) {
                    if (e.target === this) {
                        toggleSearch();
                    }
                });
            }
            
            const loginOverlay = document.getElementById('login-overlay');
            if (loginOverlay) {
                loginOverlay.addEventListener('click', function(e) {
                    if (e.target === this) {
                        toggleLogin();
                    }
                });
            }
        });