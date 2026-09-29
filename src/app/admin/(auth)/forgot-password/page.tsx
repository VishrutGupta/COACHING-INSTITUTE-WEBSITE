"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { authService } from "@/lib/services/authService";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await authService.forgotPassword(identifier.trim());
      setMessage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your username or email and we will send a reset link.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <div className="mb-5">
            <Label htmlFor="identifier">Username or email</Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="administrator"
              required
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Send reset link
          </Button>

          <div className="mt-4 text-center text-sm">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
