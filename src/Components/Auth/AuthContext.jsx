import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { app, auth } from "./firebase";
import { ROLE, isEmailVerificationRequired, normalizeRole } from "../../utils/roles.js";

const AuthContext = createContext(null);
const db = getFirestore(app);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const resetTimerRef = useRef(null);
  const inactivityLimitMs = 5 * 60 * 1000;
  const warningOffsetMs = 1 * 60 * 1000;

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Failed to clear persisted auth session on startup:", error);
      }

      if (!isMounted) {
        return;
      }

      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setShowTimeoutWarning(false);
          setLoading(false);
          return;
        }

        try {
          const [profileSnap, tokenResult] = await Promise.all([
            getDoc(doc(db, "users", currentUser.uid)),
            getIdTokenResult(currentUser),
          ]);

          const profile = profileSnap.exists() ? profileSnap.data() : {};
          const resolvedRole = normalizeRole(
            profile.role || tokenResult?.claims?.role,
          );

          console.info("[Auth] Resolved user profile", {
            uid: currentUser.uid,
            email: currentUser.email,
            profileExists: profileSnap.exists(),
            profileRole: profile.role || "",
            tokenRole: tokenResult?.claims?.role || "",
            resolvedRole,
          });

          if (!currentUser.emailVerified && isEmailVerificationRequired(resolvedRole)) {
            try {
              await signOut(auth);
            } catch (error) {
              console.error("Failed to sign out unverified user:", error);
            }
            setUser(null);
            setShowTimeoutWarning(false);
            setLoading(false);
            return;
          }

          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName:
              profile.fullName ||
              profile.name ||
              currentUser.displayName ||
              "",
            photoURL: currentUser.photoURL || "",
            emailVerified: currentUser.emailVerified,
            role: resolvedRole,
            roles: [resolvedRole],
            profile,
          });
        } catch (error) {
          console.error("Failed to resolve auth role:", error);
          console.info("[Auth] Falling back to customer role", {
            uid: currentUser.uid,
            email: currentUser.email,
            fallbackRole: ROLE.CUSTOMER,
          });
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || "",
              photoURL: currentUser.photoURL || "",
              emailVerified: currentUser.emailVerified,
              role: ROLE.CUSTOMER,
              roles: [ROLE.CUSTOMER],
              profile: {},
            });
        } finally {
          setLoading(false);
        }
      });
    };

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let timeoutId = null;
    let warningId = null;
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (warningId) {
        clearTimeout(warningId);
      }
      if (showTimeoutWarning) {
        setShowTimeoutWarning(false);
      }

      warningId = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, Math.max(0, inactivityLimitMs - warningOffsetMs));

      timeoutId = setTimeout(async () => {
        await signOut(auth);
        setUser(null);
      }, inactivityLimitMs);
    };

    resetTimerRef.current = resetTimer;
    events.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true }),
    );
    resetTimer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (warningId) {
        clearTimeout(warningId);
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user, inactivityLimitMs, warningOffsetMs, showTimeoutWarning]);

  const value = useMemo(
    () => ({
      user,
      loading,
      roles: ROLE,
      signup: async (email, password, role = ROLE.CUSTOMER, profile = {}) => {
        const normalizedEmail = email.trim().toLowerCase();
        const credential = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          password,
        );
        const normalizedRole = ROLE.CUSTOMER;
        await setDoc(doc(db, "users", credential.user.uid), {
          email: normalizedEmail,
          role: normalizedRole,
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        try {
          await sendEmailVerification(credential.user);
        } catch (verificationError) {
          console.warn("Failed to send verification email on signup:", verificationError);
        }
        return credential;
      },
      login: async (email, password) => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const profileSnap = await getDoc(doc(db, "users", credential.user.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const resolvedRole = normalizeRole(profile.role);

        if (!credential.user.emailVerified && isEmailVerificationRequired(resolvedRole)) {
          await signOut(auth);
          throw new Error("Verify your email before logging in.");
        }
        return credential;
      },
      resendVerificationEmail: async (email, password) => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(credential.user);
        await signOut(auth);
      },
      logout: () => signOut(auth),
      hasRole: (role) => normalizeRole(user?.role) === normalizeRole(role),
      isAdmin: normalizeRole(user?.role) === ROLE.ADMIN,
      isOpsManager: normalizeRole(user?.role) === ROLE.OPSMANAGER,
      isFleetManager: normalizeRole(user?.role) === ROLE.FLEETMANAGER,
      isAuditor: normalizeRole(user?.role) === ROLE.AUDITOR,
      isAccounts: normalizeRole(user?.role) === ROLE.ACCOUNTS,
      isDriver: normalizeRole(user?.role) === ROLE.DRIVER,
      isCustomer: normalizeRole(user?.role) === ROLE.CUSTOMER,
      isOpsUser: normalizeRole(user?.role) === ROLE.OPSUSER,
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {showTimeoutWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md mx-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">
              Session expiring soon
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              You will be signed out in 1 minute due to inactivity.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => resetTimerRef.current && resetTimerRef.current()}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-orange-600 hover:bg-orange-500 transition-colors"
                type="button"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
