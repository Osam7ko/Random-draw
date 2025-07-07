import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Simple local authentication (for demo purposes)
const DEMO_USERS = [
  { email: "admin@raffle.com", password: "123456" },
  { email: "test@test.com", password: "password" },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function signup(email, password) {
    return new Promise((resolve, reject) => {
      // Check if user already exists
      const existingUser = DEMO_USERS.find((user) => user.email === email);
      if (existingUser) {
        reject(new Error("auth/email-already-in-use"));
        return;
      }

      // Add new user (in real app, this would be saved to database)
      DEMO_USERS.push({ email, password });

      const user = { email, uid: Date.now().toString() };
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      resolve(user);
    });
  }

  function login(email, password) {
    return new Promise((resolve, reject) => {
      // Find user
      const user = DEMO_USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (!user) {
        reject(new Error("auth/user-not-found"));
        return;
      }

      const authUser = { email, uid: Date.now().toString() };
      setCurrentUser(authUser);
      localStorage.setItem("currentUser", JSON.stringify(authUser));
      resolve(authUser);
    });
  }

  function logout() {
    return new Promise((resolve) => {
      setCurrentUser(null);
      localStorage.removeItem("currentUser");
      resolve();
    });
  }

  const value = {
    currentUser,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
