import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<{ identifier: string }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: { identifier: string }) => {
    setLoading(true);
    try {
      const payload = data.identifier.includes('@')
        ? { email: data.identifier }
        : { username: data.identifier };
      await authApi.forgotPassword(payload);
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your username or email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Check your email for the reset link.</p>
              <Link to="/login"><Button variant="outline" className="w-full">Back to Login</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Username or Email</Label>
                <Input placeholder="username or email@example.com" {...register('identifier')} />
                {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Link to="/login" className="block text-center text-sm text-primary hover:underline">Back to Login</Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
