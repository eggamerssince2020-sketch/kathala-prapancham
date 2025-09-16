"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
// --- 1. IMPORT THE NEW ICONS AND BACKGROUND ---
import { HiEye, HiEyeOff } from "react-icons/hi";
import { WavyBackground } from "@/components/WavyBackground";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // --- 2. STATE FOR PASSWORD VISIBILITY ---
  const [showPassword, setShowPassword] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Basic password validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    try {
      await signUp(username, email, password);
      router.push("/");
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already in use.");
      } else {
        setError("Failed to create an account. Please try again.");
      }
    }
  };

  return (
    // --- 3. WRAP EVERYTHING IN THE WAVY BACKGROUND ---
    <WavyBackground 
      backgroundFill="#fefae0"
      colors={["#fa9451", "#ffc071", "#ff6b6b", "#e07a5f"]}
      waveOpacity={0.4}
      blur={15}
    >
      <div className="flex justify-center items-center min-h-screen p-4">
        {/* --- 4. FROSTED GLASS FORM CONTAINER --- */}
        <form 
          onSubmit={handleSubmit} 
          className="p-8 bg-white/30 backdrop-blur-lg shadow-2xl rounded-2xl w-full max-w-md"
        >
          <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">
            Join the World of Stories
          </h2>

          {error && <p className="bg-red-500/20 text-red-800 p-3 rounded-md mb-4 text-center">{error}</p>}
          
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Username" 
            required 
            className="w-full p-3 mb-4 bg-white/50 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
          
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            required 
            className="w-full p-3 mb-4 bg-white/50 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
          
          {/* --- 5. PASSWORD INPUT WITH VISIBILITY TOGGLE --- */}
          <div className="relative w-full mb-6">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password (min. 6 characters)" 
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

          {/* --- 6. VIBRANT, DYNAMIC BUTTON --- */}
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold p-3 rounded-lg shadow-lg hover:scale-105 transform transition-all duration-300 ease-in-out"
          >
            Create Account
          </button>
          
          <p className="mt-6 text-center text-gray-700">
            Already have an account? <Link href="/login" className="font-semibold text-orange-600 hover:text-red-600">Log in</Link>
          </p>
        </form>
      </div>
    </WavyBackground>
  );
}
