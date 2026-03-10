'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
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

const feedbackTypes = {
  'quality-issue': '💧 Quality Issue',
  leak: '🚨 Leak/Spillage',
  billing: '💳 Billing Issue',
  other: '📝 Other',
};

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: '⏳' },
  'under-review': { color: 'bg-blue-100 text-blue-800', label: 'Under Review', icon: '🔍' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved', icon: '✓' },
};

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [formData, setFormData] = useState({
    type: 'quality-issue',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const token = authUtils.getToken();
    if (!token) {
      router.push('/login');
      return;
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

    if (!formData.message.trim()) {
      setError('Please enter feedback message');
      return;
    }

    setIsSubmitting(true);

    try {
      await feedbackAPI.submitFeedback(formData);
      setSuccess('Feedback submitted successfully!');
      setFormData({ type: 'quality-issue', message: '' });
      setIsDialogOpen(false);
      await fetchFeedbacks();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFeedbacks = filterStatus === 'all'
    ? feedbacks
    : feedbacks.filter(f => f.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <div className="text-gray-600">Loading feedback...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback & Issues</h1>
          <p className="text-gray-600 mt-1">Report and track water quality issues</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Submit Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Feedback</DialogTitle>
              <DialogDescription>
                Report any water quality issues or concerns
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Issue Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(feedbackTypes).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Description *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Spinner className="h-4 w-4" />}
                  Submit
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && !isDialogOpen && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Feedback</p>
              <p className="text-3xl font-bold">{feedbacks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{feedbacks.filter(f => f.status === 'pending').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">In Review</p>
              <p className="text-3xl font-bold text-blue-600">{feedbacks.filter(f => f.status === 'under-review').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{feedbacks.filter(f => f.status === 'resolved').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Feedback</CardTitle>
              <CardDescription>Track the status of your submissions</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No feedback submitted yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedbacks.map((feedback) => (
                    <TableRow key={feedback._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {feedbackTypes[feedback.type as keyof typeof feedbackTypes] || feedback.type}
                      </TableCell>
                      <TableCell className="max-w-xs text-gray-600 truncate">
                        {feedback.message}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[feedback.status as keyof typeof statusConfig]?.color}>
                          {statusConfig[feedback.status as keyof typeof statusConfig]?.icon} {statusConfig[feedback.status as keyof typeof statusConfig]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFeedback(feedback)}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          {selectedFeedback && selectedFeedback._id === feedback._id && (
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Feedback Details</DialogTitle>
                              </DialogHeader>

                              <div className="space-y-4">
                                {/* Your Message */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold uppercase text-gray-500">Your Issue</Label>
                                    <span className="text-xs text-gray-500">
                                      {new Date(feedback.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <p className="font-medium mb-1">
                                      {feedbackTypes[feedback.type as keyof typeof feedbackTypes] || feedback.type}
                                    </p>
                                    <p className="text-gray-700">{feedback.message}</p>
                                  </div>
                                </div>

                                {/* Status */}
                                <div>
                                  <Label className="text-xs font-semibold uppercase text-gray-500">Current Status</Label>
                                  <div className="mt-2">
                                    <Badge className={statusConfig[feedback.status as keyof typeof statusConfig]?.color} className="text-base py-2 px-3">
                                      {statusConfig[feedback.status as keyof typeof statusConfig]?.icon} {statusConfig[feedback.status as keyof typeof statusConfig]?.label}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Admin Response */}
                                {feedback.adminResponse && (
                                  <div>
                                    <Label className="text-xs font-semibold uppercase text-gray-500">Admin Response</Label>
                                    <div className="bg-cyan-50 rounded-lg p-3 text-sm mt-2 border border-cyan-200">
                                      <p className="text-gray-700">{feedback.adminResponse}</p>
                                      {feedback.respondedAt && (
                                        <p className="text-xs text-gray-500 mt-2">
                                          Responded: {new Date(feedback.respondedAt).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                                  Close
                                </Button>
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
    </div>
  );
}
