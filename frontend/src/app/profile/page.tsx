'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { userAPI } from '@/lib/api';
import { authUtils } from '@/lib/auth';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
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
    if (['phone', 'address'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        profileDetails: {
          ...prev.profileDetails,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');
      await userAPI.updateProfile(formData);
      setProfile(formData);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading profile...</div>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-6">
              {/* Read-only fields */}
              <div className="space-y-2">
                <Label htmlFor="email">Email (Read-only)</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              {/* ThingSpeak Configuration */}
              <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <h3 className="font-semibold text-cyan-800 mb-4">📡 ThingSpeak Configuration</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="channelID">Channel ID</Label>
                    <Input
                      id="channelID"
                      type="text"
                      name="channelID"
                      value={formData?.channelID || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-100' : 'bg-white'}
                      placeholder="e.g., 123456"
                    />
                    <p className="text-xs text-gray-500">Your ThingSpeak channel number</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="readAPIKey">Read API Key (Optional)</Label>
                    <Input
                      id="readAPIKey"
                      type="text"
                      name="readAPIKey"
                      value={formData?.readAPIKey || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-100' : 'bg-white'}
                      placeholder="e.g., ABC123XYZ"
                    />
                    <p className="text-xs text-gray-500">Required if your channel is private</p>
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={formData?.name || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData?.profileDetails?.phone || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-100' : ''}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  name="address"
                  value={formData?.profileDetails?.address || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-100' : ''}
                  placeholder="123 Main St, City, State"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(profile);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
