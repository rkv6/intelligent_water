'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { userAPI } from '@/lib/api';
import { authUtils } from '@/lib/auth';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedChannelMethod, setSelectedChannelMethod] = useState('manual');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = authUtils.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data);
      setFormData(response.data);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');
      setIsSaving(true);

      if (!formData.name?.trim()) {
        setError('Full name is required');
        return;
      }

      if (formData.channelID && !formData.readAPIKey?.trim()) {
        setError('Read API Key is required when Channel ID is provided');
        return;
      }

      await userAPI.updateProfile(formData);
      setProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsDialogOpen(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChannelMethodChange = (method: string) => {
    setSelectedChannelMethod(method);
    if (method === 'clear') {
      setFormData((prev: any) => ({
        ...prev,
        channelID: '',
        readAPIKey: '',
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and configuration</p>
      </div>

      {/* Alerts */}
      {error && (
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

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Your login credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">Email Address</Label>
              <p className="text-lg font-medium mt-1">{profile?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Role</Label>
              <p className="text-lg font-medium mt-1 capitalize">{profile?.role || 'User'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Info</CardTitle>
            <CardDescription>Your display information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Full Name</Label>
              <p className="text-lg font-medium mt-1">{profile?.name}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2">Edit Info</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Personal Information</DialogTitle>
                  <DialogDescription>
                    Update your name and personal details
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData?.name || ''}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="mt-2"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving && <Spinner className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* ThingSpeak Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ThingSpeak</CardTitle>
            <CardDescription>Water monitoring channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Channel ID</Label>
              <p className="text-lg font-medium mt-1">{profile?.channelID || 'Not configured'}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2">Configure Channel</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Configure ThingSpeak Channel</DialogTitle>
                  <DialogDescription>
                    Add your ThingSpeak channel information to start monitoring water quality
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Channel Method Selector */}
                  <div>
                    <Label>Configuration Method</Label>
                    <Select value={selectedChannelMethod} onValueChange={handleChannelMethodChange}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Enter Manually</SelectItem>
                        <SelectItem value="clear">Clear Configuration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Channel Configuration Form */}
                  {selectedChannelMethod === 'manual' && (
                    <div className="space-y-4">
                      <Card className="bg-cyan-50 border-cyan-200">
                        <CardContent className="pt-4 text-sm text-cyan-800">
                          <p className="mb-2">
                            <strong>How to find your credentials:</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Go to ThingSpeak.com and sign in</li>
                            <li>Open your Channel</li>
                            <li>Find your Channel ID in the URL</li>
                            <li>Click "API Keys" tab to get your Read API Key</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <div>
                        <Label htmlFor="channelID">Channel ID *</Label>
                        <Input
                          id="channelID"
                          name="channelID"
                          value={formData?.channelID || ''}
                          onChange={handleChange}
                          placeholder="e.g., 123456"
                          className="mt-2"
                          type="number"
                        />
                        <p className="text-xs text-gray-500 mt-1">Found in your ThingSpeak URL</p>
                      </div>

                      <div>
                        <Label htmlFor="readAPIKey">Read API Key *</Label>
                        <div className="flex mt-2">
                          <Input
                            id="readAPIKey"
                            name="readAPIKey"
                            value={formData?.readAPIKey || ''}
                            onChange={handleChange}
                            placeholder="Enter your Read API Key"
                            type={showApiKey ? 'text' : 'password'}
                            className="rounded-r-none"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-l-none border-l-0"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Keep this secure</p>
                      </div>
                    </div>
                  )}

                  {selectedChannelMethod === 'clear' && (
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="pt-4">
                        <p className="text-yellow-800">
                          Are you sure you want to clear your ThingSpeak configuration? You'll need to configure it again to monitor water quality.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving && <Spinner className="h-4 w-4" />}
                    Save Configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Data Privacy Card */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription>How your data is used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <ul className="space-y-2">
              <li>✓ Your profile information is never shared with third parties</li>
              <li>✓ ThingSpeak credentials are encrypted in our database</li>
              <li>✓ Your water quality data is private and only accessible to you</li>
            </ul>
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Get support and resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Documentation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Submit Feedback
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
