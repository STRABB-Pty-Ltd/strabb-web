import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-sm">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-subheading font-bold">STRABB</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <div className="text-muted-foreground flex gap-sm text-body">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
