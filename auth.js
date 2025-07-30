import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, updateProfile } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC3DKVOOVAVtry-MmeVgb7FY2PyEZaVHkU",
  authDomain: "puthal.firebaseapp.com",
  projectId: "puthal",
  storageBucket: "puthal.firebasestorage.app",
  messagingSenderId: "964225713222",
  appId: "1:964225713222:web:0fd6835a14d3c1c4c5b647",
  measurementId: "G-705JWZVJJV"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

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

        console.log('User is signed in:', user);

        localStorage.setItem('puthal_user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0]
        }));

        if (typeof updateNavigationForLoggedInUser === 'function') {
            updateNavigationForLoggedInUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0]
            });
        }
    } else {
        console.log('User is signed out');
        localStorage.removeItem('puthal_user');
    }
});