"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
// --- 1. IMPORT THE NEW ICONS AND BACKGROUND ---
import { HiEye, HiEyeOff } from "react-icons/hi";
import { WavyBackground } from "@/components/WavyBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // For success messages (like password reset)
  // --- 2. STATE FOR PASSWORD VISIBILITY ---
  const [showPassword, setShowPassword] = useState(false);

  const { user, logIn, sendPasswordReset, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await logIn(email, password);
      // Redirect is handled by useEffect
    } catch (_err) {
      setError("Failed to log in. Please check your email and password.");
    }
  };

  // --- 3. FORGOT PASSWORD HANDLER ---
  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await sendPasswordReset(email);
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  if (loading || (!loading && user)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    // --- 4. WRAP EVERYTHING IN THE WAVY BACKGROUND ---
    <WavyBackground 
      backgroundFill="#fefae0"
      colors={["#fa9451", "#ffc071", "#ff6b6b", "#e07a5f"]}
      waveOpacity={0.4}
      blur={15}
    >
      <div className="flex justify-center items-center min-h-screen p-4">
        {/* --- 5. FROSTED GLASS FORM CONTAINER --- */}
        <form 
          onSubmit={handleSubmit} 
          className="p-8 bg-white/30 backdrop-blur-lg shadow-2xl rounded-2xl w-full max-w-md"
        >
          <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">
            Welcome Back
          </h2>

          {error && <p className="bg-red-500/20 text-red-800 p-3 rounded-md mb-4 text-center">{error}</p>}
          {message && <p className="bg-green-500/20 text-green-800 p-3 rounded-md mb-4 text-center">{message}</p>}
          
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            required 
            className="w-full p-3 mb-4 bg-white/50 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
          
          {/* --- 6. PASSWORD INPUT WITH VISIBILITY TOGGLE --- */}
          <div className="relative w-full mb-4">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password" 
              required 
              className="w-full p-3 bg-white/50 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <HiEyeOff className="h-5 w-5"/> : <HiEye className="h-5 w-5"/>}
            </button>
          </div>

          <div className="text-right mb-6">
            <button 
              type="button"
              onClick={handlePasswordReset}
              className="text-sm text-orange-700 hover:text-orange-900 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* --- 7. VIBRANT, DYNAMIC BUTTON --- */}
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold p-3 rounded-lg shadow-lg hover:scale-105 transform transition-all duration-300 ease-in-out"
          >
            Login
          </button>
          
          <p className="mt-6 text-center text-gray-700">
            No account? <Link href="/signup" className="font-semibold text-orange-600 hover:text-red-600">Sign up</Link>
          </p>
        </form>
      </div>
    </WavyBackground>
  );
}
