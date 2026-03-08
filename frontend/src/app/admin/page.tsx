'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { adminAPI, thingSpeakAPI } from '@/lib/api';
import { authUtils } from '@/lib/auth';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  channelID?: string;
  readAPIKey?: string;
  lastLogin?: string;
  createdAt: string;
}

interface Feedback {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  type: string;
  message: string;
  status: 'pending' | 'under-review' | 'resolved';
  adminResponse?: string;
  createdAt: string;
}

interface UserMetrics {
  temperature: number;
  flow: number;
  tds: number;
  distance: number;
  ph: number;
}

// MetricCard component for displaying water quality data
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

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboards' | 'feedback' | 'users'>('dashboards');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = users.filter(u => 
    u.role !== 'admin' && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const user = authUtils.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, feedbackRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAllFeedback(),
      ]);
      setUsers(usersRes.data);
      setFeedbacks(feedbackRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMetrics = async (user: User) => {
    setMetricsLoading(true);
    try {
      // Try to fetch from ThingSpeak if user has channelID configured
      if (user.channelID) {
        try {
          const response = await thingSpeakAPI.getLatestData(user.channelID, user.readAPIKey);
          
          if (response.feeds && response.feeds.length > 0) {
            const latestFeed = response.feeds[0];
            const parsedMetrics = thingSpeakAPI.parseMetrics(latestFeed);
            if (parsedMetrics) {
              setUserMetrics({
                temperature: parsedMetrics.temperature,
                flow: parsedMetrics.flow,
                tds: parsedMetrics.tds,
                distance: parsedMetrics.distance,
                ph: parsedMetrics.ph,
              });
              setMetricsLoading(false);
              return;
            }
          }
        } catch (thingSpeakErr) {
          console.log('ThingSpeak fetch failed, using demo data:', thingSpeakErr);
        }
      }
      
      // Fallback: Generate demo data based on user ID hash for consistent values
      const hashCode = user._id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const seed = Math.abs(hashCode) / 2147483647;
      
      // Demo data matching ThingSpeak fields from codee.py
      const mockData: UserMetrics = {
        temperature: 20 + (seed * 15),    // 20-35°C range
        flow: Math.round(seed) as 0 | 1,   // 0 or 1
        tds: 100 + (seed * 500),           // 100-600 ppm range
        distance: 5 + (seed * 40),         // 5-45 cm range
        ph: 6.0 + (seed * 2.5),            // 6.0-8.5 pH range
      };
      setUserMetrics(mockData);
    } catch (err) {
      setError('Failed to load user metrics');
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    fetchUserMetrics(user);
  };

  const handleRespond = async (feedbackId: string) => {
    if (!adminResponse.trim()) return;
    
    try {
      setSubmitting(true);
      await adminAPI.respondToFeedback(feedbackId, adminResponse);
      setRespondingTo(null);
      setAdminResponse('');
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    try {
      await adminAPI.updateFeedbackStatus(feedbackId, newStatus);
      // Update local state to reflect the change immediately
      setFeedbacks(prev => 
        prev.map(f => 
          f._id === feedbackId ? { ...f, status: newStatus as 'pending' | 'under-review' | 'resolved' } : f
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteResponse = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    
    try {
      await adminAPI.deleteAdminResponse(feedbackId);
      // Update local state to reflect the change immediately
      setFeedbacks(prev => 
        prev.map(f => 
          f._id === feedbackId ? { ...f, adminResponse: undefined } : f
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete response');
    }
  };

  const handleLogout = () => {
    authUtils.logout();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'under-review':
        return 'bg-blue-500';
      case 'resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quality-issue':
        return 'Water Quality Issue';
      case 'leak':
        return 'Leak Report';
      case 'billing':
        return 'Billing Question';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-600">🛡️ Admin Dashboard</h1>
            <Badge className="bg-purple-500">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{users.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Feedback</CardDescription>
              <CardTitle className="text-3xl">{feedbacks.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {feedbacks.filter(f => f.status === 'pending').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {feedbacks.filter(f => f.status === 'resolved').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'dashboards' ? 'default' : 'outline'}
            onClick={() => setActiveTab('dashboards')}
          >
            📊 Dashboards
          </Button>
          <Button
            variant={activeTab === 'feedback' ? 'default' : 'outline'}
            onClick={() => setActiveTab('feedback')}
          >
            📝 Feedback ({feedbacks.length})
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({users.length})
          </Button>
        </div>

        {/* Dashboards Tab */}
        {activeTab === 'dashboards' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">User Dashboards</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* User Search Panel */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Search Users</CardTitle>
                    <CardDescription>Type to search by name or email</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4 text-center">
                          {searchQuery ? 'No users match your search' : 'No users found'}
                        </p>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => handleSelectUser(user)}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              selectedUser?._id === user._id
                                ? 'bg-blue-100 border-2 border-blue-500'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <span className="text-blue-600 font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-medium text-gray-900 truncate">{user.name}</div>
                                <div className="text-sm text-gray-500 truncate">{user.email}</div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User Dashboard Display */}
              <div className="lg:col-span-3">
                {!selectedUser ? (
                  <Card className="h-full">
                    <CardContent className="flex items-center justify-center h-96 text-gray-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">👈</div>
                        <p className="text-lg">Select a user to view their dashboard</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : metricsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-48" />
                      <Skeleton className="h-48" />
                      <Skeleton className="h-48" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* User Info Header */}
                    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-2xl">
                                {selectedUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                              <p className="text-gray-600">{selectedUser.email}</p>
                              <p className="text-sm text-gray-500">
                                Channel ID: {selectedUser.channelID || 'Not configured'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-500 mb-2">Active</Badge>
                            <p className="text-sm text-gray-500">
                              Last login: {selectedUser.lastLogin 
                                ? new Date(selectedUser.lastLogin).toLocaleString() 
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* User Metrics - Matches ThingSpeak fields from codee.py */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Field 1: Temperature */}
                      <MetricCard
                        label="🌡️ Temperature"
                        value={userMetrics?.temperature || null}
                        unit="°C"
                        min={0}
                        max={50}
                        optimalMin={20}
                        optimalMax={30}
                      />
                      
                      {/* Field 2: Flow - Special display */}
                      <Card className="border-l-4" style={{
                        borderLeftColor: userMetrics?.flow === 1 ? '#10b981' : '#ef4444'
                      }}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">💧 Water Flow</CardTitle>
                            <Badge className={userMetrics?.flow === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {userMetrics?.flow === 1 ? '✓ Flowing' : '⚠ No Flow'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {userMetrics?.flow === 1 ? 'ON' : 'OFF'}
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            {userMetrics?.flow === 1 ? 'Water flowing normally' : 'No flow detected'}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Field 3: TDS */}
                      <MetricCard
                        label="🧪 TDS"
                        value={userMetrics?.tds || null}
                        unit="ppm"
                        min={0}
                        max={1000}
                        optimalMin={0}
                        optimalMax={500}
                      />
                      
                      {/* Field 4: Distance (Water Level) */}
                      <MetricCard
                        label="📏 Water Level"
                        value={userMetrics?.distance || null}
                        unit="cm"
                        min={0}
                        max={100}
                        optimalMin={10}
                        optimalMax={50}
                      />
                      
                      {/* Field 5: pH */}
                      <MetricCard
                        label="⚗️ pH Level"
                        value={userMetrics?.ph || null}
                        unit="pH"
                        min={0}
                        max={14}
                        optimalMin={6.5}
                        optimalMax={8.5}
                      />
                      
                      {/* Overall Status */}
                      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <CardHeader>
                          <CardTitle className="text-lg">📊 Status Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Temp</span>
                              <Badge className={(userMetrics?.temperature ?? 0) >= 20 && (userMetrics?.temperature ?? 0) <= 30 ? 'bg-green-500' : 'bg-red-500'}>●</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Flow</span>
                              <Badge className={userMetrics?.flow === 1 ? 'bg-green-500' : 'bg-red-500'}>●</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>TDS</span>
                              <Badge className={(userMetrics?.tds ?? 0) <= 500 ? 'bg-green-500' : 'bg-red-500'}>●</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Level</span>
                              <Badge className={(userMetrics?.distance ?? 0) >= 10 && (userMetrics?.distance ?? 0) <= 50 ? 'bg-green-500' : 'bg-red-500'}>●</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>pH</span>
                              <Badge className={(userMetrics?.ph ?? 0) >= 6.5 && (userMetrics?.ph ?? 0) <= 8.5 ? 'bg-green-500' : 'bg-red-500'}>●</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Trend Chart Placeholder */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Water Quality Trends</CardTitle>
                        <CardDescription>Historical data for {selectedUser.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                          📈 Historical chart for user {selectedUser.name}
                          <br />
                          (Channel: {selectedUser.channelID || 'N/A'})
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">User Feedback</h2>
            {feedbacks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No feedback received yet.
                </CardContent>
              </Card>
            ) : (
              feedbacks.map((feedback) => (
                <Card key={feedback._id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {getTypeLabel(feedback.type)}
                        </CardTitle>
                        <CardDescription>
                          From: <strong>{feedback.userId?.name || 'Unknown'}</strong> ({feedback.userId?.email || 'N/A'})
                        </CardDescription>
                      </div>
                      <select
                        value={feedback.status}
                        onChange={(e) => handleStatusChange(feedback._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer border-0 outline-none ${getStatusColor(feedback.status)}`}
                      >
                        <option value="pending" className="bg-white text-gray-900">pending</option>
                        <option value="under-review" className="bg-white text-gray-900">under-review</option>
                        <option value="resolved" className="bg-white text-gray-900">resolved</option>
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{feedback.message}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Submitted: {new Date(feedback.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {feedback.adminResponse && (
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-blue-700">Admin Response:</p>
                            <p className="text-gray-700">{feedback.adminResponse}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteResponse(feedback._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {feedback.status !== 'resolved' && (
                      <>
                        {respondingTo === feedback._id ? (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Type your response to the user..."
                              value={adminResponse}
                              onChange={(e) => setAdminResponse(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleRespond(feedback._id)}
                                disabled={submitting || !adminResponse.trim()}
                              >
                                {submitting ? 'Sending...' : 'Send Response'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRespondingTo(null);
                                  setAdminResponse('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setRespondingTo(feedback._id)}
                          >
                            ✉️ Respond to User
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Registered Users</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={user.role === 'admin' ? 'bg-purple-500' : 'bg-gray-500'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.channelID || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
