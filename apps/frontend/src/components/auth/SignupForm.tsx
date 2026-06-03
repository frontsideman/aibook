'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SignupForm() {
  return (
    <Card className="w-full max-w-md border-border/70">
      <CardHeader className="space-y-1">
        <CardTitle>Sign up</CardTitle>
        <p className="text-sm text-muted-foreground">Create your account to start generating stories.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div className="space-y-2">
            <p className="text-sm font-medium">Name</p>
            <Input aria-label="Name" type="text" placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Email</p>
            <Input aria-label="Email" type="email" placeholder="m@example.com" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Password</p>
            <Input aria-label="Password" type="password" placeholder="******" />
          </div>
          <Button type="submit" className="w-full">Create account</Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account? <a href="/login" className="text-foreground underline">Login</a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
