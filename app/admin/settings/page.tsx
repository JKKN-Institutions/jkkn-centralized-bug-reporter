'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  ArrowLeft,
  Shield,
  Database,
  Bell,
  Mail,
  Lock,
  Globe,
  Palette,
  AlertCircle
} from 'lucide-react';

/**
 * Admin Settings Page
 * Platform-wide configuration settings
 */
export default function AdminSettingsPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50'>
      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Header */}
        <div className='space-y-4'>
          <Link href='/admin/dashboard'>
            <Button variant='ghost' className='gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to Dashboard
            </Button>
          </Link>

          <div className='flex items-center gap-3'>
            <div className='p-3 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl shadow-lg'>
              <Settings className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Platform Settings
              </h1>
              <p className='text-gray-600'>
                Configure platform-wide settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Alert */}
        <Alert className='border-blue-200 bg-blue-50'>
          <AlertCircle className='h-4 w-4 text-blue-600' />
          <AlertDescription className='text-blue-900'>
            Platform settings are currently under development. Check back soon for
            configuration options.
          </AlertDescription>
        </Alert>

        {/* Settings Categories Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {/* Security Settings */}
          <Card className='border-2 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 rounded-lg'>
                  <Shield className='h-5 w-5 text-red-600' />
                </div>
                <div>
                  <CardTitle className='text-lg'>Security</CardTitle>
                  <CardDescription className='text-sm'>
                    Authentication & access control
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                Configure authentication methods, password policies, and session
                settings.
              </p>
              <Button variant='outline' disabled className='w-full'>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card className='border-2 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <Database className='h-5 w-5 text-green-600' />
                </div>
                <div>
                  <CardTitle className='text-lg'>Database</CardTitle>
                  <CardDescription className='text-sm'>
                    Backup & maintenance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                Configure database backups, retention policies, and maintenance
                schedules.
              </p>
              <Button variant='outline' disabled className='w-full'>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card className='border-2 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <Mail className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <CardTitle className='text-lg'>Email</CardTitle>
                  <CardDescription className='text-sm'>
                    SMTP & notification templates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                Configure email providers, SMTP settings, and customize email
                templates.
              </p>
              <Button variant='outline' disabled className='w-full'>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className='border-2 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-yellow-100 rounded-lg'>
                  <Bell className='h-5 w-5 text-yellow-600' />
                </div>
                <div>
                  <CardTitle className='text-lg'>Notifications</CardTitle>
                  <CardDescription className='text-sm'>
                    Platform-wide alerts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                Configure notification channels, triggers, and user preferences.
              </p>
              <Button variant='outline' disabled className='w-full'>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card className='border-2 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <Lock className='h-5 w-5 text-purple-600' />
                </div>
                <div>
                  <CardTitle className='text-lg'>API Keys</CardTitle>
                  <CardDescription className='text-sm'>
                    Public API management
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                Manage API keys, rate limits, and access permissions for public
                API endpoints.
              </p>
              <Button variant='outline' disabled className='w-full'>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Internationalization */}
          <Card className='border-2 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-indigo-100 rounded-lg'>
                  <Globe className='h-5 w-5 text-indigo-600' />
                </div>
                <div>
                  <CardTitle className='text-lg'>Localization</CardTitle>
                  <CardDescription className='text-sm'>
                    Languages & regions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                Configure supported languages, date formats, and regional
                settings.
              </p>
              <Button variant='outline' disabled className='w-full'>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className='border-2 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-pink-100 rounded-lg'>
                  <Palette className='h-5 w-5 text-pink-600' />
                </div>
                <div>
                  <CardTitle className='text-lg'>Appearance</CardTitle>
                  <CardDescription className='text-sm'>
                    Branding & themes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                Customize platform branding, logos, colors, and theme settings.
              </p>
              <Button variant='outline' disabled className='w-full'>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card className='border-2'>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current platform version and status
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium text-gray-700'>
                Platform Version
              </span>
              <span className='text-sm text-gray-900 font-mono'>v1.0.0</span>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium text-gray-700'>
                Environment
              </span>
              <span className='text-sm text-gray-900 font-mono'>
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium text-gray-700'>Status</span>
              <span className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                <span className='text-sm text-gray-900'>Operational</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
