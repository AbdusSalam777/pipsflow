import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '@/services/auth.service';
import { profileApi } from '@/services/trade.service';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [deletePassword, setDeletePassword] = useState('');

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const handleUpdateProfile = async () => {
    try {
      const res = await authApi.updateProfile({ username, email });
      updateUser(res.data.data);
      toast.success('Profile updated');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleChangePassword = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await authApi.changePassword(data);
      toast.success('Password changed');
      passwordForm.reset();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Password change failed');
    }
  };

  const handleUploadPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await profileApi.updatePicture(file);
      toast.success('Profile picture updated');
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { toast.error('Enter your password'); return; }
    try {
      await authApi.deleteAccount(deletePassword);
      logout();
      navigate('/login');
      toast.success('Account deleted');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <Input type="file" accept="image/*" onChange={handleUploadPicture} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Update Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={handleUpdateProfile}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" {...passwordForm.register('currentPassword')} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...passwordForm.register('newPassword')} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" {...passwordForm.register('confirmPassword')} />
            </div>
            <Button type="submit">Change Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>This action is permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Confirm with Password</Label>
            <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
          </div>
          <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
