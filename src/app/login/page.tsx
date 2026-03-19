import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">STRABB</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
