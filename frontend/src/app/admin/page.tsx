'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Users, MessageSquare, Send, Eye } from 'lucide-react';
import { adminAPI, thingSpeakAPI } from '@/lib/api';
import { authUtils } from '@/lib/auth';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  channelID?: string;
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

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  'under-review': { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
};

const feedbackTypes: Record<string, string> = {
  'quality-issue': '💧 Quality Issue',
  leak: '🚨 Leak/Spillage',
  billing: '💳 Billing Issue',
  other: '📝 Other',
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userMetrics, setUserMetrics] = useState<any>(null);
  const [userMetricsLoading, setUserMetricsLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = authUtils.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const user = authUtils.getUser();
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, feedbacksRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAllFeedback(),
      ]);
      setUsers(usersRes.data);
      setFeedbacks(feedbacksRes.data);
    } catch (err) {
      setError('Failed to load admin data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToFeedback = async () => {
    if (!selectedFeedback || !responseText.trim()) return;

    setIsResponding(true);
    try {
      await adminAPI.respondToFeedback(selectedFeedback._id, responseText);
      await adminAPI.updateFeedbackStatus(selectedFeedback._id, 'under-review');

      setResponseText('');
      setSelectedFeedback(null);
      await fetchAdminData();
    } catch (err) {
      setError('Failed to send response');
    } finally {
      setIsResponding(false);
    }
  };

  const handleResolveFeedback = async (feedbackId: string) => {
    try {
      await adminAPI.updateFeedbackStatus(feedbackId, 'resolved');
      await fetchAdminData();
    } catch (err) {
      setError('Failed to resolve feedback');
    }
  };

  const handleViewUserDashboard = async (user: User) => {
    if (!user.channelID) {
      setError('User has no ThingSpeak channel configured');
      return;
    }

    setSelectedUser(user);
    setUserMetricsLoading(true);
    try {
      const response = await thingSpeakAPI.getLatestData(user.channelID);
      if (response.feeds && response.feeds.length > 0) {
        const latestFeed = response.feeds[0];
        const parsedMetrics = thingSpeakAPI.parseMetrics(latestFeed);
        setUserMetrics(parsedMetrics);
      } else {
        setUserMetrics(null);
      }
    } catch (err) {
      console.error('Failed to fetch user metrics:', err);
      setError('Failed to load user dashboard data');
    } finally {
      setUserMetricsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <div className="text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  const pendingFeedback = feedbacks.filter(f => f.status === 'pending').length;
  const usersWithChannels = users.filter(u => u.channelID).length;

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage users and feedback submissions</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold mt-1">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Channels</p>
                <p className="text-3xl font-bold mt-1 text-cyan-600">{usersWithChannels}</p>
              </div>
              <span className="text-2xl">📡</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-3xl font-bold mt-1">{feedbacks.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">{pendingFeedback}</p>
              </div>
              <span className="text-2xl">⏳</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-12">
        {/* Feedback Management Section */}
        <section className="space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Feedback Management</h2>
            <p className="text-gray-600 text-sm mt-1">Review and respond to all user feedback</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Feedback Submissions</CardTitle>
              <CardDescription>Review and respond to user feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No feedback submissions</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-900">
                      <TableRow className="hover:bg-slate-900">
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Type</TableHead>
                        <TableHead className="text-white">Message</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-right text-white">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbacks.map((feedback) => (
                        <TableRow key={feedback._id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{feedback.userId.name}</p>
                              <p className="text-xs text-gray-500">{feedback.userId.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {feedbackTypes[feedback.type] || feedback.type}
                          </TableCell>
                          <TableCell className="max-w-sm text-gray-600 truncate">
                            {feedback.message}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[feedback.status as keyof typeof statusConfig]?.color}>
                              {statusConfig[feedback.status as keyof typeof statusConfig]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="bg-black text-white hover:bg-gray-800"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFeedback(feedback);
                                    setResponseText(feedback.adminResponse || '');
                                  }}
                                >
                                  Review
                                </Button>
                              </DialogTrigger>
                              {selectedFeedback && selectedFeedback._id === feedback._id && (
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>Feedback Details</DialogTitle>
                                    <DialogDescription>
                                      From: {feedback.userId.name}
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4">
                                    {/* User Feedback */}
                                    <div>
                                      <Label className="text-xs font-semibold uppercase text-gray-500 block mb-2">User Message</Label>
                                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                        <p className="text-gray-700">{feedback.message}</p>
                                      </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                      <Label className="text-xs font-semibold uppercase text-gray-500 block mb-2">Status</Label>
                                      <Badge className={`${statusConfig[feedback.status as keyof typeof statusConfig]?.color} text-base py-2 px-3`}>
                                        {statusConfig[feedback.status as keyof typeof statusConfig]?.label}
                                      </Badge>
                                    </div>

                                    {/* Response Field */}
                                    <div>
                                      <Label htmlFor="response" className="text-xs font-semibold uppercase text-gray-500 block mb-2">Your Response</Label>
                                      <Textarea
                                        id="response"
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Enter your response to this feedback..."
                                        rows={4}
                                      />
                                    </div>
                                  </div>

                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => setSelectedFeedback(null)}
                                    >
                                      Close
                                    </Button>
                                    {feedback.status !== 'resolved' && (
                                      <>
                                        <Button
                                          variant="outline"
                                          onClick={() => handleResolveFeedback(feedback._id)}
                                          disabled={isResponding}
                                        >
                                          Resolve
                                        </Button>
                                        <Button
                                          onClick={handleRespondToFeedback}
                                          disabled={isResponding || !responseText.trim()}
                                          className="gap-2"
                                        >
                                          {isResponding && <Spinner className="h-4 w-4" />}
                                          <Send className="h-4 w-4" />
                                          Send Response
                                        </Button>
                                      </>
                                    )}
                                  </DialogFooter>
                                </DialogContent>
                              )}
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* User Management Section */}
        <section className="space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600 text-sm mt-1">View and manage all system users</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage system users</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-900">
                      <TableRow className="hover:bg-slate-900">
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Email</TableHead>
                        <TableHead className="text-white">Role</TableHead>
                        <TableHead className="text-white">Channel ID</TableHead>
                        <TableHead className="text-white">Joined</TableHead>
                        <TableHead className="text-right text-white">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user._id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                          <TableCell>
                            <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                              {user.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.channelID ? (
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                #{user.channelID}
                              </code>
                            ) : (
                              <span className="text-gray-500 text-sm">Not configured</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUserDashboard(user)}
                              disabled={!user.channelID}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Dashboard Dialog */}
          {selectedUser && (
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedUser.name}'s Dashboard</DialogTitle>
                  <DialogDescription>
                    Channel ID: #{selectedUser.channelID}
                  </DialogDescription>
                </DialogHeader>

                {userMetricsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Spinner className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-gray-600">Loading dashboard data...</p>
                    </div>
                  </div>
                ) : userMetrics ? (
                  <div className="space-y-4">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Temperature */}
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">🌡️ Temperature</p>
                            <p className="text-2xl font-bold text-cyan-600">{userMetrics.temperature?.toFixed(1) || 'N/A'}°C</p>
                            <p className="text-xs text-gray-500 mt-1">Optimal: 20-30°C</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Flow */}
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">💧 Water Flow</p>
                            <p className="text-2xl font-bold">{userMetrics.flow === 1 ? '✓ Active' : '✗ Stopped'}</p>
                            <p className="text-xs text-gray-500 mt-1">{userMetrics.flow === 1 ? 'Flowing' : 'Not flowing'}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* TDS */}
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">🧪 TDS</p>
                            <p className="text-2xl font-bold text-purple-600">{userMetrics.tds?.toFixed(0) || 'N/A'} ppm</p>
                            <p className="text-xs text-gray-500 mt-1">Optimal: 500-1000 ppm</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* pH */}
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">⚗️ pH Level</p>
                            <p className="text-2xl font-bold text-amber-600">{userMetrics.ph?.toFixed(1) || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">Optimal: 6.5-8.5</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Distance */}
                      <Card className="col-span-2">
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">📏 Water Distance</p>
                            <p className="text-2xl font-bold text-blue-600">{userMetrics.distance?.toFixed(1) || 'N/A'} cm</p>
                            <p className="text-xs text-gray-500 mt-1">Optimal: 10-80 cm</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No data available</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </section>
      </div>
    </div>
  );
}

// Helper function definition
function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} />;
}
