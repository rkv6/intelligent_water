'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authUtils } from '@/lib/auth';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = authUtils.getToken();
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    authUtils.removeToken();
    setIsLoggedIn(false);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-full"></div>
            <h1 className="text-2xl font-bold text-cyan-600">Aqua Monitor</h1>
          </div>
          <div className="flex gap-4">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost">Profile</Button>
                </Link>
                <Button variant="destructive" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Real-Time Water Quality Monitoring
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Monitor pH, TDS, and water levels with intelligent insights and analytics
          </p>

          {!isLoggedIn && (
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button size="lg">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>📊 Live Metrics</CardTitle>
              <CardDescription>Real-time water quality data</CardDescription>
            </CardHeader>
            <CardContent>
              Monitor pH levels, TDS concentration, and water levels with instant visual feedback and alerts.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📈 Analytics</CardTitle>
              <CardDescription>Historical trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              View daily, weekly, and monthly trends to understand water quality patterns and identify issues.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📮 Feedback Portal</CardTitle>
              <CardDescription>Report issues easily</CardDescription>
            </CardHeader>
            <CardContent>
              Submit water quality complaints with images and track their status from submission to resolution.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
