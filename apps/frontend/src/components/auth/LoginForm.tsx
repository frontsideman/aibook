'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  return (
    <Card className="w-full max-w-md border-border/70">
      <CardHeader className="space-y-1">
        <CardTitle>Login</CardTitle>
        <p className="text-sm text-muted-foreground">Enter your email below to login to your account.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div className="space-y-2">
            <p className="text-sm font-medium">Email</p>
            <Input aria-label="Email" type="email" placeholder="m@example.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Password</p>
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</button>
            </div>
            <Input aria-label="Password" type="password" placeholder="******" />
          </div>
          <Button type="submit" className="w-full">Continue</Button>
          <Button type="button" variant="outline" className="w-full">Continue with Google</Button>
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account? <a href="/signup" className="text-foreground underline">Sign up</a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
