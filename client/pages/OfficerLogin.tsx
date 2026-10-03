import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import { useI18n } from '@/i18n';

export default function OfficerLogin() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error(t('fill_all_fields'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/officer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('[Officer Login] Login error:', res.status, data);
        toast.error(data.error || t('login_failed'));
        return;
      }

      if (!data.token) {
        console.error('[Officer Login] No token in response:', data);
        toast.error(t('login_failed'));
        return;
      }

      localStorage.setItem('officer_token', data.token);
      toast.success(t('login'));
      navigate('/officer-dashboard');
    } catch (error) {
      console.error('[Officer Login] Connection error:', error);
      toast.error(t('failed_to_connect'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-blue-600" />
            <CardTitle>{t('officer_login')}</CardTitle>
          </div>
          <CardDescription>{t('access_dashboard')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">{t('email_address')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@municipality.gov"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? t('logging_in') : t('login')}
          </Button>
          <div className="text-xs text-muted-foreground text-center pt-2">
            {t('demo_credentials')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
