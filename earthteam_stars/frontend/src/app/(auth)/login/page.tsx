"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({ email, password });
      setUser(res.user);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle variant="icon" />
      </div>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <span className="brand-star text-4xl">★</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            EarthTeam Stars
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and reward planetary health actions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email or username"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@organization.org or username"
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <p className="mb-1.5 font-semibold text-gray-700">Test accounts</p>
          <ul className="space-y-1 font-mono">
            <li>
              <button
                type="button"
                onClick={() => {
                  setEmail("reporter_test");
                  setPassword("Test2024!");
                }}
                className="text-left hover:text-emerald-700 hover:underline"
              >
                reporter_test · Test2024!
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setEmail("verifier_test");
                  setPassword("Test2024!");
                }}
                className="text-left hover:text-emerald-700 hover:underline"
              >
                verifier_test · Test2024!
              </button>
            </li>
          </ul>
        </div>

        <p className="text-center text-xs text-gray-400">
          MVP — Solana Devnet
        </p>
      </div>
    </div>
  );
}
