'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { feedbackAPI } from '@/lib/api';
import { authUtils } from '@/lib/auth';

interface Feedback {
  _id: string;
  type: string;
  message: string;
  status: 'pending' | 'under-review' | 'resolved';
  createdAt: string;
  adminResponse?: string;
  respondedAt?: string;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'quality-issue',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

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

    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await feedbackAPI.getFeedback();
      setFeedbacks(response.data);
    } catch (err) {
      setError('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await feedbackAPI.submitFeedback(formData);
      setSuccess('Feedback submitted successfully!');
      setFormData({ type: 'quality-issue', message: '' });
      setShowForm(false);
      fetchFeedbacks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under-review':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading feedback...</div>
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
                  🛡️ Admin
                </Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="border-red-300 bg-red-50 mb-6">
            <CardContent className="text-red-700 pt-6">{error}</CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-300 bg-green-50 mb-6">
            <CardContent className="text-green-700 pt-6">{success}</CardContent>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Feedback & Complaints</h2>
          <p className="text-gray-600">Submit and track your water quality issues</p>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-8">
            + Submit New Feedback
          </Button>
        )}

        {/* Feedback Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription>Tell us about any water quality issues</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Issue Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="quality-issue">Water Quality Issue</option>
                    <option value="leak">Leak/Spillage</option>
                    <option value="billing">Billing Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Description</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Feedback List */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Feedback</h3>
          {feedbacks.length === 0 ? (
            <p className="text-gray-600">No feedback submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <Card key={feedback._id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {feedback.type.replace('-', ' ')}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(feedback.status)}>
                        {feedback.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <p className="text-gray-700">{feedback.message}</p>
                    
                    {/* Admin Response Section */}
                    {feedback.adminResponse && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="bg-cyan-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-cyan-600 font-semibold text-sm">Admin Response</span>
                            {feedback.respondedAt && (
                              <span className="text-gray-500 text-xs">
                                • {new Date(feedback.respondedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700">{feedback.adminResponse}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
