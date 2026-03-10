'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
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
import { Zap, BarChart3, AlertCircle } from 'lucide-react';

function MetricCard({
  label,
  value,
  unit,
  min,
  max,
  optimalMin,
  optimalMax,
  emoji,
}: {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  emoji?: string;
}) {
  if (value === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            {label}
          </CardTitle>
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
    <Card className="border-l-4 hover:shadow-lg transition-shadow" style={{
      borderLeftColor: isOptimal ? '#06b6d4' : '#ef4444'
    }}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            {label}
          </CardTitle>
          <Badge variant={isOptimal ? 'default' : 'destructive'} className={isOptimal ? 'bg-cyan-100 text-cyan-800' : ''}>
            {isOptimal ? '✓ Optimal' : '⚠ Warning'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">
          {value.toFixed(2)} 
          <span className="text-sm text-gray-500 ml-2">{unit}</span>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-2">
            Safe Range: {min}-{max} {unit} | Optimal: {optimalMin}-{optimalMax}
          </div>
          <Progress value={Math.min(Math.max(percentage, 0), 100)} className="h-2" />
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
      const resultsCount = timeRange === 'daily' ? 50 : timeRange === 'weekly' ? 200 : 500;
      const response = await thingSpeakAPI.getHistoricalData(channelID, resultsCount, readAPIKey);
      
      if (response.feeds && response.feeds.length > 0) {
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
        }).reverse();
        
        setChartData(formattedData);
      }
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
    } finally {
      setChartLoading(false);
    }
  }, [timeRange]);

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

    fetchDashboardData();
  }, []);

  // Auto-refresh ThingSpeak data every 15 seconds
  useEffect(() => {
    if (!profile?.channelID) return;

    const interval = setInterval(() => {
      fetchThingSpeakData(profile.channelID, profile.readAPIKey);
    }, 15000);

    return () => clearInterval(interval);
  }, [profile, fetchThingSpeakData]);

  const fetchDashboardData = async () => {
    try {
      const profileResponse = await userAPI.getProfile();
      const userProfile = profileResponse.data;
      setProfile(userProfile);

      if (userProfile.channelID) {
        const success = await fetchThingSpeakData(userProfile.channelID, userProfile.readAPIKey);
        if (!success) {
          setMetrics({
            temperature: 26.5,
            flow: 1,
            tds: 350,
            distance: 15,
            ph: 7.2,
          });
        }
      } else {
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Water Quality Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring for {profile?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span>{connectionStatus === 'connected' ? '● CONNECTED' : '● DISCONNECTED'}</span>
          </div>
          {profile?.channelID && (
            <Button 
              variant="default"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </CardContent>
        </Card>
      )}

      {connectionStatus === 'no-channel' && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">Channel Not Configured</p>
                <p className="text-sm text-yellow-700">Add your ThingSpeak channel ID to start monitoring</p>
              </div>
            </div>
            <Link href="/profile">
              <Button size="sm" variant="outline">Configure</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Main Metrics Section */}
      <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* pH Gauge */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8">
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-4">pH Level</p>
                  <p className="text-xs text-gray-600 mb-4">Target: 6.5 - 8.5</p>
                  <div className="flex justify-center mb-4">
                    <div className="relative w-40 h-40 rounded-full border-8 border-amber-400 flex items-center justify-center bg-gradient-to-br from-amber-50 to-white">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-900">{metrics?.ph?.toFixed(1) || 'N/A'}</p>
                        <p className="text-xs text-gray-600 mt-1">pH</p>
                      </div>
                    </div>
                  </div>
                  <Badge className={metrics?.ph && metrics.ph >= 6.5 && metrics.ph <= 8.5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {metrics?.ph && metrics.ph >= 6.5 && metrics.ph <= 8.5 ? '✓ ACCEPTABLE' : '⚠ WARNING'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Temperature Gauge */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8">
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Temperature</p>
                  <p className="text-xs text-gray-600 mb-4">Optimal: 20-30 °C</p>
                  <p className="text-5xl font-bold text-cyan-600 mb-2">{metrics?.temperature?.toFixed(1) || 'N/A'}°</p>
                  <p className="text-sm text-gray-600 mb-4">°C</p>
                  <Badge className={metrics?.temperature && metrics.temperature >= 20 && metrics.temperature <= 30 ? 'bg-cyan-100 text-cyan-800' : 'bg-red-100 text-red-800'}>
                    {metrics?.temperature && metrics.temperature >= 20 && metrics.temperature <= 30 ? '✓ OPTIMAL' : '⚠ WARNING'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Water Flow Status */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8">
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Water Flow</p>
                  <p className="text-xs text-gray-600 mb-4">System Status</p>
                  <p className="text-5xl font-bold mb-4">{metrics?.flow === 1 ? '✓' : '✗'}</p>
                  <p className="text-2xl font-bold mb-4">{metrics?.flow === 1 ? 'ACTIVE' : 'STOPPED'}</p>
                  <Badge className={metrics?.flow === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {metrics?.flow === 1 ? '● FLOWING' : '● STOPPED'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TDS (Dissolved Solids) */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 uppercase">TDS (Dissolved Solids)</p>
                    <p className="text-xs text-gray-600">Total Dissolved Solids Concentration</p>
                  </div>
                  <p className="text-4xl font-bold text-purple-600">{metrics?.tds?.toFixed(0) || 'N/A'}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Safe Range: 0-1500 ppm</p>
                    <p>Optimal: 500-1000 ppm</p>
                  </div>
                  <Progress 
                    value={Math.min((metrics?.tds || 0) / 1500 * 100, 100)} 
                    className="h-2"
                  />
                  <Badge className={metrics?.tds && metrics.tds >= 500 && metrics.tds <= 1000 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {metrics?.tds && metrics.tds >= 500 && metrics.tds <= 1000 ? '✓ ACCEPTABLE' : '⚠ WARNING'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Water Distance */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 uppercase">Water Distance</p>
                    <p className="text-xs text-gray-600">Water Level Measurement</p>
                  </div>
                  <p className="text-4xl font-bold text-blue-600">{metrics?.distance?.toFixed(1) || 'N/A'}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Safe Range: 0-100 cm</p>
                    <p>Optimal: 10-80 cm</p>
                  </div>
                  <Progress 
                    value={Math.min((metrics?.distance || 0) / 100 * 100, 100)} 
                    className="h-2"
                  />
                  <Badge className={metrics?.distance && metrics.distance >= 10 && metrics.distance <= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {metrics?.distance && metrics.distance >= 10 && metrics.distance <= 80 ? '✓ ACCEPTABLE' : '⚠ WARNING'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Analytics & Historical Data Section */}
        <div className="space-y-6 pt-4">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">📊 Historical Data</h2>
            <p className="text-gray-600 text-sm mt-1">View trends and patterns over time</p>
          </div>

          {/* Time Range Selector */}
          <div>
            <div className="flex gap-2 mb-6">
              {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  onClick={() => setTimeRange(range)}
                  className="text-sm"
                >
                  {range === 'daily' ? 'Last 24h' : range === 'weekly' ? 'Last 7d' : 'Last 30d'}
                </Button>
              ))}
            </div>
          </div>

          {/* Charts */}
          {chartLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-80 pt-6">
                <div className="text-center">
                  <Spinner className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-gray-600">Loading chart data...</p>
                </div>
              </CardContent>
            </Card>
          ) : chartData.length > 0 ? (
            <>
              {/* Temperature Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🌡️</span>
                    Temperature Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value: any) => value.toFixed(2)} />
                      <Area type="monotone" dataKey="temperature" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* TDS and pH Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🧪</span>
                    Water Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="tds" stroke="#8b5cf6" strokeWidth={2} name="TDS (ppm)" />
                      <Line yAxisId="right" type="monotone" dataKey="ph" stroke="#f59e0b" strokeWidth={2} name="pH" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64 pt-6">
                <p className="text-gray-600">No data available yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
