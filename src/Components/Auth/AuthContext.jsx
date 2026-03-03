import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

const AuthContext = createContext(null);
const db = getFirestore(app);

const ROLE = {
  OPSUSER: "opsuser",
  OPSMANAGER: "opsmanager",
  ACCOUNTS: "accounts",
  DRIVER: "driver",
  ADMIN: "admin",
};

const normalizeRole = (value) => {
  const role = (value || "").toString().trim().toLowerCase();
  if (role === "opsuser" || role === "customer" || role === "customers") return ROLE.OPSUSER;
  if (role === "opsmanager" || role === "staff") return ROLE.OPSMANAGER;
  if (role === "accounts" || role === "account") return ROLE.ACCOUNTS;
  if (role === "driver" || role === "drivers") return ROLE.DRIVER;
  if (role === "admin") return ROLE.ADMIN;
  return ROLE.OPSUSER;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
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
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "",
          photoURL: currentUser.photoURL || "",
          emailVerified: currentUser.emailVerified,
          role: ROLE.OPSUSER,
          roles: [ROLE.OPSUSER],
          profile: {},
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      roles: ROLE,
      signup: async (email, password, role = ROLE.OPSUSER, profile = {}) => {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const normalizedRole = normalizeRole(role);
        await setDoc(doc(db, "users", credential.user.uid), {
          email,
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
      login: (email, password) =>
        signInWithEmailAndPassword(auth, email, password),
      logout: () => signOut(auth),
      hasRole: (role) => normalizeRole(user?.role) === normalizeRole(role),
      isAdmin: normalizeRole(user?.role) === ROLE.ADMIN,
      isOpsManager: normalizeRole(user?.role) === ROLE.OPSMANAGER,
      isAccounts: normalizeRole(user?.role) === ROLE.ACCOUNTS,
      isDriver: normalizeRole(user?.role) === ROLE.DRIVER,
      isOpsUser: normalizeRole(user?.role) === ROLE.OPSUSER,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
