import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/services/trade.service';
import { PageLoader } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent, formatDate, getPnlColor, cn } from '@/lib/utils';

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get().then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your trading profile overview</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                profile.username[0]?.toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.username}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Joined {formatDate(profile.joinDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Trades</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{profile.totalTrades}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Win Rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatPercent(profile.winRate)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Lifetime PnL</CardTitle></CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', getPnlColor(profile.lifetimePnL))}>
              {formatCurrency(profile.lifetimePnL)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
