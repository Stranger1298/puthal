import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3DKVOOVAVtry-MmeVgb7FY2PyEZaVHkU",
  authDomain: "puthal.firebaseapp.com",
  projectId: "puthal",
  storageBucket: "puthal.firebasestorage.app",
  messagingSenderId: "964225713222",
  appId: "1:964225713222:web:0fd6835a14d3c1c4c5b647"
};

try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    // Make Firebase auth available globally
    window.firebaseAuth = {
        auth,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        signInWithPopup,
        googleProvider,
        signOut,
        updateProfile
    };

    window.updateProfile = updateProfile;

    auth.onAuthStateChanged((user) => {
        if (user) {
            localStorage.setItem('puthal_user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL
            }));
            
            window.isUserAuthenticated = true;
            window.currentUser = user;
        } else {
            localStorage.removeItem('puthal_user');
            window.isUserAuthenticated = false;
            window.currentUser = null;
        }
    });

    // Signal that Firebase is ready
    window.firebaseReady = true;
    
} catch (error) {
    console.error('Firebase initialization error:', error);
    alert('Authentication service failed to initialize. Please refresh the page.');
}