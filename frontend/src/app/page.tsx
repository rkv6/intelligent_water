'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Waves, TrendingUp, MessageSquare, Zap } from 'lucide-react';
import { authUtils } from '@/lib/auth';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = authUtils.getToken();
    setIsLoggedIn(!!token);
  }, []);

  if (isLoggedIn) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-600">
              <Waves className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Aqua Monitor
            </h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-cyan-600 hover:bg-cyan-700">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <Badge className="mb-4 bg-cyan-100 text-cyan-700 hover:bg-cyan-200">
            🚀 Now in Beta
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Intelligent Water Quality Monitoring
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Real-time monitoring of pH, TDS, and water levels with AI-powered insights and analytics
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-cyan-600" />
                </div>
              </div>
              <CardTitle>Live Metrics</CardTitle>
              <CardDescription>Real-time water quality data</CardDescription>
            </CardHeader>
            <CardContent>
              Monitor pH levels, TDS concentration, and water levels with instant visual feedback and automated alerts.
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>Historical trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              View daily, weekly, and monthly trends to understand water quality patterns and identify issues early.
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <CardTitle>Issue Tracking</CardTitle>
              <CardDescription>Report and track problems</CardDescription>
            </CardHeader>
            <CardContent>
              Submit water quality complaints with details and track their status from submission to resolution in real-time.
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to monitor your water quality?</h3>
          <p className="text-lg mb-6 opacity-90">Join hundreds of users tracking water metrics in real-time</p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Start Monitoring Now
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
