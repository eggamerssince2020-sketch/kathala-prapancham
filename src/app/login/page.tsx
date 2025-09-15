"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { user, logIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await logIn(email, password);
      // Redirect is handled by useEffect
    } catch (_err) { // Corrected: 'err' changed to '_err' to mark it as unused
      setError("Failed to log in.");
    }
  };
  
  if(loading || (!loading && user)) return <p>Loading...</p>;

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full p-2 mb-4 border rounded"/>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full p-2 mb-4 border rounded"/>
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Login</button>
        <p className="mt-4 text-center">No account? <Link href="/signup" className="text-blue-500">Sign up</Link></p>
      </form>
    </div>
  );
}
