"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signUp(username, email, password);
      router.push("/");
    } catch (err) {
      setError("Failed to create an account.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required className="w-full p-2 mb-4 border rounded"/>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full p-2 mb-4 border rounded"/>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full p-2 mb-4 border rounded"/>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Sign Up</button>
        <p className="mt-4 text-center">Already have an account? <Link href="/login" className="text-blue-500">Log in</Link></p>
      </form>
    </div>
  );
}
