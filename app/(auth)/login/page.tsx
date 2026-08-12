"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, fieldError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<ApiError | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await api.post("/api/auth/login", { email, password });
            router.push("/documents");
            router.refresh();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err);
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Log in</CardTitle>
                    <CardDescription>Welcome back — enter your details to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                            {fieldError(error, "email") && (
                                <p className="text-sm text-destructive">{fieldError(error, "email")}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            {fieldError(error, "password") && (
                                <p className="text-sm text-destructive">{fieldError(error, "password")}</p>
                            )}
                        </div>
                        {error && !error.details.length && (
                            <p className="text-sm text-destructive">{error.message}</p>
                        )}
                        <Button type="submit" disabled={submitting} className="mt-2 w-full">
                            {submitting ? "Logging in…" : "Log in"}
                        </Button>
                    </form>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
