import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="gap-sm flex flex-col items-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-subheading font-bold">STRABB</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <div className="text-muted-foreground gap-sm text-body flex">
        <Link href="/privacy" className="hover:underline" data-no-elevate>
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:underline" data-no-elevate>
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
