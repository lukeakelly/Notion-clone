"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Calculator } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("estimator@estimation-tool.local");
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async () => {
    setLoading(true);
    await signIn("dev", { email, callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold">EstimateOS</h1>
          <p className="text-sm text-neutral-500">Software Project Estimation Tool</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
