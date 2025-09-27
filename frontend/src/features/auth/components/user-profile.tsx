/* User profile component that fetches data from FastAPI backend. */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useApi } from '../hooks/use-api';

interface BackendUser {
  id: string;
  email: string;
  name: string | null;
  provider: string;
  email_verified: boolean;
  created_at: string;
}

export function UserProfile() {
  const { user: authUser, isAuthenticated, isLoading } = useAuth();
  const api = useApi();
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await api.get<BackendUser>('/api/auth/me');
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated, fetchUserProfile]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center text-gray-600">
        Please sign in to view your profile.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error: {error}</p>
        <button 
          onClick={fetchUserProfile}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-600">
        No user data available.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">User Profile</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <p className="text-gray-800">{user.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <p className="text-gray-800">{user.name || 'Not provided'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Provider</label>
            <p className="text-gray-800 capitalize">{user.provider}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Email Verified</label>
            <p className={`font-medium ${user.email_verified ? 'text-green-600' : 'text-red-600'}`}>
              {user.email_verified ? 'Verified' : 'Not verified'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Member Since</label>
            <p className="text-gray-800">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Session Info</h3>
        <div className="text-xs text-gray-500">
          <p>User ID: {authUser?.id}</p>
          <p>Provider: {authUser?.provider}</p>
        </div>
      </div>
    </div>
  );
}
