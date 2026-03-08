'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { userAPI, thingSpeakAPI } from '@/lib/api';
import { authUtils } from '@/lib/auth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

function MetricCard({
  label,
  value,
  unit,
  min,
  max,
  optimalMin,
  optimalMax,
}: {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
}) {
  if (value === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isOptimal = value >= optimalMin && value <= optimalMax;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <Card className="border-l-4" style={{
      borderLeftColor: isOptimal ? '#10b981' : '#ef4444'
    }}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{label}</CardTitle>
          <Badge className={isOptimal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isOptimal ? '✓ Optimal' : '⚠ Warning'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-bold">{value.toFixed(2)} <span className="text-lg text-gray-500">{unit}</span></div>
        <div>
          <div className="text-sm text-gray-600 mb-2">
            Range: {min}-{max} {unit} | Optimal: {optimalMin}-{optimalMax}
          </div>
          <Progress value={Math.min(Math.max(percentage, 0), 100)} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'no-channel'>('disconnected');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const router = useRouter();

  // Fetch ThingSpeak data
  const fetchThingSpeakData = useCallback(async (channelID: string, readAPIKey?: string) => {
    try {
      const response = await thingSpeakAPI.getLatestData(channelID, readAPIKey);
      
      if (response.feeds && response.feeds.length > 0) {
        const latestFeed = response.feeds[0];
        const parsedMetrics = thingSpeakAPI.parseMetrics(latestFeed);
        setMetrics(parsedMetrics);
        setLastUpdated(parsedMetrics?.timestamp || null);
        setConnectionStatus('connected');
        return true;
      } else {
        // No data in channel yet
        setMetrics(null);
        setConnectionStatus('connected');
        return false;
      }
    } catch (err: any) {
      console.error('ThingSpeak fetch error:', err);
      setConnectionStatus('disconnected');
      return false;
    }
  }, []);

  // Fetch historical data for charts
  const fetchHistoricalData = useCallback(async (channelID: string, readAPIKey?: string) => {
    setChartLoading(true);
    try {
      // Number of results based on time range
      const resultsCount = timeRange === 'daily' ? 50 : timeRange === 'weekly' ? 200 : 500;
      
      const response = await thingSpeakAPI.getHistoricalData(channelID, resultsCount, readAPIKey);
      
      if (response.feeds && response.feeds.length > 0) {
        // Transform data for recharts
        const formattedData = response.feeds.map((feed: any) => {
          const date = new Date(feed.created_at);
          return {
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: date.toLocaleString(),
            temperature: parseFloat(feed.field1) || 0,
            flow: parseInt(feed.field2) || 0,
            tds: parseFloat(feed.field3) || 0,
            distance: parseFloat(feed.field4) || 0,
            ph: parseFloat(feed.field5) || 0,
          };
        }).reverse(); // Oldest first for charts
        
        setChartData(formattedData);
      }
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
    } finally {
      setChartLoading(false);
    }
  }, [timeRange]);

  // Fetch chart data when profile or timeRange changes
  useEffect(() => {
    if (profile?.channelID) {
      fetchHistoricalData(profile.channelID, profile.readAPIKey);
    }
  }, [profile, timeRange, fetchHistoricalData]);

  useEffect(() => {
    const token = authUtils.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const user = authUtils.getUser();
    if (user?.role === 'admin') {
      setIsAdmin(true);
    }

    fetchDashboardData();
  }, []);

  // Auto-refresh ThingSpeak data every 15 seconds
  useEffect(() => {
    if (!profile?.channelID) return;

    const interval = setInterval(() => {
      fetchThingSpeakData(profile.channelID, profile.readAPIKey);
    }, 15000); // 15 seconds (ThingSpeak update rate)

    return () => clearInterval(interval);
  }, [profile, fetchThingSpeakData]);

  const fetchDashboardData = async () => {
    try {
      const profileResponse = await userAPI.getProfile();
      const userProfile = profileResponse.data;
      setProfile(userProfile);

      // Fetch from ThingSpeak if channelID is configured
      if (userProfile.channelID) {
        const success = await fetchThingSpeakData(userProfile.channelID, userProfile.readAPIKey);
        if (!success) {
          // Use demo data if no ThingSpeak data available
          setMetrics({
            temperature: 26.5,
            flow: 1,
            tds: 350,
            distance: 15,
            ph: 7.2,
          });
        }
      } else {
        // No channel configured - show demo data
        setConnectionStatus('no-channel');
        setMetrics({
          temperature: 26.5,
          flow: 1,
          tds: 350,
          distance: 15,
          ph: 7.2,
        });
      }
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!profile?.channelID) return;
    setIsRefreshing(true);
    await fetchThingSpeakData(profile.channelID, profile.readAPIKey);
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-600">Aqua Monitor</h1>
          <div className="flex gap-4 items-center">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                  🛡️ Admin Dashboard
                </Button>
              </Link>
            )}
            <Link href="/feedback">
              <Button variant="ghost">Feedback</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => {
                authUtils.logout();
                router.push('/');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="border-red-300 bg-red-50 mb-6">
            <CardContent className="text-red-700 pt-6">{error}</CardContent>
          </Card>
        )}

        {/* Header with Connection Status */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Welcome, {profile?.name}!</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                connectionStatus === 'no-channel' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Live from ThingSpeak' : 
                 connectionStatus === 'no-channel' ? 'Demo Mode (No Channel)' : 'Disconnected'}
              </span>
            </div>
            {/* Refresh Button */}
            {profile?.channelID && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
              </Button>
            )}
          </div>
        </div>

        {/* Channel Info Card */}
        {connectionStatus !== 'no-channel' && (
          <Card className="mb-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">📡</div>
                  <div>
                    <p className="font-semibold text-gray-800">ThingSpeak Channel: {profile?.channelID}</p>
                    <p className="text-sm text-gray-600">
                      Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <Badge className={connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}>
                  {connectionStatus === 'connected' ? '● Connected' : '○ Disconnected'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Channel Warning */}
        {connectionStatus === 'no-channel' && (
          <Card className="mb-6 bg-yellow-50 border-yellow-300">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl">⚠️</div>
                <div>
                  <p className="font-semibold text-yellow-800">ThingSpeak Channel Not Configured</p>
                  <p className="text-sm text-yellow-700">
                    Go to <Link href="/profile" className="underline font-medium">Profile Settings</Link> to add your Channel ID and Read API Key.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Range Selector */}
        <div className="flex gap-4 mb-8">
          {(['daily', 'weekly', 'monthly'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>

        {/* Metrics Grid - Matches ThingSpeak fields from codee.py */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Field 1: Temperature */}
          <MetricCard
            label="🌡️ Temperature"
            value={metrics?.temperature}
            unit="°C"
            min={0}
            max={50}
            optimalMin={20}
            optimalMax={30}
          />
          
          {/* Field 2: Flow - Special card for binary value */}
          <Card className="border-l-4" style={{
            borderLeftColor: metrics?.flow === 1 ? '#10b981' : '#ef4444'
          }}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">💧 Water Flow</CardTitle>
                <Badge className={metrics?.flow === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {metrics?.flow === 1 ? '✓ Flowing' : '⚠ No Flow'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold">
                {metrics?.flow === 1 ? 'ON' : 'OFF'}
                <span className="text-lg text-gray-500 ml-2">
                  {metrics?.flow === 1 ? '(Detected)' : '(Not Detected)'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Flow sensor status: {metrics?.flow === 1 ? 'Water is flowing normally' : 'No water flow detected - check supply'}
              </div>
            </CardContent>
          </Card>
          
          {/* Field 3: TDS */}
          <MetricCard
            label="🧪 TDS (Total Dissolved Solids)"
            value={metrics?.tds}
            unit="ppm"
            min={0}
            max={1000}
            optimalMin={0}
            optimalMax={500}
          />
          
          {/* Field 4: Distance (Water Level) */}
          <MetricCard
            label="📏 Water Level (Distance)"
            value={metrics?.distance}
            unit="cm"
            min={0}
            max={100}
            optimalMin={10}
            optimalMax={50}
          />
          
          {/* Field 5: pH */}
          <MetricCard
            label="⚗️ pH Level"
            value={metrics?.ph}
            unit="pH"
            min={0}
            max={14}
            optimalMin={6.5}
            optimalMax={8.5}
          />
          
          {/* Overall Status Card */}
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-lg">📊 Overall Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Temperature</span>
                  <Badge className={metrics?.temperature >= 20 && metrics?.temperature <= 30 ? 'bg-green-500' : 'bg-red-500'}>
                    {metrics?.temperature >= 20 && metrics?.temperature <= 30 ? 'OK' : '!'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Flow</span>
                  <Badge className={metrics?.flow === 1 ? 'bg-green-500' : 'bg-red-500'}>
                    {metrics?.flow === 1 ? 'OK' : '!'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>TDS</span>
                  <Badge className={metrics?.tds <= 500 ? 'bg-green-500' : 'bg-red-500'}>
                    {metrics?.tds <= 500 ? 'OK' : '!'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Water Level</span>
                  <Badge className={metrics?.distance >= 10 && metrics?.distance <= 50 ? 'bg-green-500' : 'bg-red-500'}>
                    {metrics?.distance >= 10 && metrics?.distance <= 50 ? 'OK' : '!'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>pH</span>
                  <Badge className={metrics?.ph >= 6.5 && metrics?.ph <= 8.5 ? 'bg-green-500' : 'bg-red-500'}>
                    {metrics?.ph >= 6.5 && metrics?.ph <= 8.5 ? 'OK' : '!'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Analysis Charts */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">📈 Trend Analysis ({timeRange})</h3>
          
          {chartLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <div className="text-gray-500">Loading chart data...</div>
                </div>
              </CardContent>
            </Card>
          ) : chartData.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center text-gray-500">
                  No historical data available. Configure your ThingSpeak channel to see charts.
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Temperature Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🌡️ Temperature Over Time</CardTitle>
                  <CardDescription>Temperature readings in °C</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 50]} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#ef4444" 
                          fillOpacity={1} 
                          fill="url(#tempGradient)" 
                          name="Temperature (°C)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* pH Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚗️ pH Level Over Time</CardTitle>
                  <CardDescription>pH readings (optimal: 6.5-8.5)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 14]} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ph" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', r: 3 }}
                          name="pH Level"
                        />
                        {/* Optimal range reference lines */}
                        <Line 
                          type="monotone" 
                          dataKey={() => 6.5} 
                          stroke="#22c55e" 
                          strokeDasharray="5 5" 
                          dot={false}
                          name="Min Optimal (6.5)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey={() => 8.5} 
                          stroke="#22c55e" 
                          strokeDasharray="5 5" 
                          dot={false}
                          name="Max Optimal (8.5)"
                        />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* TDS Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🧪 TDS (Total Dissolved Solids) Over Time</CardTitle>
                  <CardDescription>TDS readings in ppm (optimal: below 500)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="tdsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 1000]} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tds" 
                          stroke="#06b6d4" 
                          fillOpacity={1} 
                          fill="url(#tdsGradient)" 
                          name="TDS (ppm)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Water Level (Distance) Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📏 Water Level Over Time</CardTitle>
                  <CardDescription>Distance sensor readings in cm</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="distance" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#distanceGradient)" 
                          name="Water Level (cm)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Flow Status Chart (Binary) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💧 Flow Status Over Time</CardTitle>
                  <CardDescription>Water flow detection (1 = flowing, 0 = not flowing)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                          formatter={(value: number) => [value === 1 ? 'Flowing' : 'Not Flowing', 'Status']}
                        />
                        <Line 
                          type="stepAfter" 
                          dataKey="flow" 
                          stroke="#22c55e" 
                          strokeWidth={3}
                          dot={{ fill: '#22c55e', r: 4 }}
                          name="Flow Status"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
