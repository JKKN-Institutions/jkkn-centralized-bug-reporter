import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code,
  ArrowRight,
  CheckCircle2,
  Package,
  Settings,
  Zap,
  AlertCircle,
  BookOpen,
  Copy,
  ExternalLink
} from 'lucide-react';
import { HomepageNav } from '../_components/homepage-nav';

export default function DocumentationPage() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50'>
      {/* Header */}
      <header className='border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/' className='flex items-center gap-3'>
              <div className='h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold shadow-md'>
                <BookOpen className='h-6 w-6' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-gray-900'>
                  Integration Documentation
                </h1>
                <p className='text-xs text-gray-600'>JKKN Bug Reporter</p>
              </div>
            </Link>
            <HomepageNav />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className='py-16 bg-gradient-to-r from-blue-600 to-blue-900 text-white'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto text-center space-y-6'>
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4'>
              <Code className='h-4 w-4' />
              Developer Documentation
            </div>
            <h1 className='text-4xl md:text-6xl font-extrabold'>
              Integration Guide
            </h1>
            <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
              Complete guide to integrate JKKN Bug Reporter into your Next.js applications with Supabase
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className='py-16'>
        <div className='container mx-auto px-4'>
          <div className='max-w-6xl mx-auto'>

            {/* Quick Start */}
            <Card className='mb-8 border-2 border-blue-200 bg-blue-50/50'>
              <CardHeader>
                <div className='flex items-center gap-3'>
                  <div className='h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center'>
                    <Zap className='h-6 w-6 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl'>Quick Start</CardTitle>
                    <CardDescription className='text-base'>
                      Get up and running in 5 minutes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid md:grid-cols-3 gap-4'>
                  <div className='flex items-start gap-3 p-4 bg-white rounded-lg border'>
                    <div className='h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                      <span className='text-blue-700 font-bold'>1</span>
                    </div>
                    <div>
                      <h4 className='font-semibold mb-1'>Install SDK</h4>
                      <p className='text-sm text-muted-foreground'>
                        Add the bug reporter package to your project
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 p-4 bg-white rounded-lg border'>
                    <div className='h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                      <span className='text-green-700 font-bold'>2</span>
                    </div>
                    <div>
                      <h4 className='font-semibold mb-1'>Get API Key</h4>
                      <p className='text-sm text-muted-foreground'>
                        Create an application and generate API key
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 p-4 bg-white rounded-lg border'>
                    <div className='h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                      <span className='text-purple-700 font-bold'>3</span>
                    </div>
                    <div>
                      <h4 className='font-semibold mb-1'>Initialize</h4>
                      <p className='text-sm text-muted-foreground'>
                        Wrap your app with BugReporterProvider
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Steps */}
            <Tabs defaultValue="installation" className='space-y-8'>
              <TabsList className='grid w-full grid-cols-4 lg:w-auto'>
                <TabsTrigger value="installation">Installation</TabsTrigger>
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="nextjs">Next.js Setup</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* Installation Tab */}
              <TabsContent value="installation" className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Package className='h-5 w-5' />
                      Step 1: Installation
                    </CardTitle>
                    <CardDescription>
                      Install the Bug Reporter SDK package in your Next.js project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <h4 className='font-semibold mb-2 flex items-center gap-2'>
                        <span className='h-6 w-6 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-700'>
                          1
                        </span>
                        Install the SDK Package
                      </h4>

                      <div className='space-y-3'>
                        <div>
                          <p className='text-sm font-medium mb-2 flex items-center gap-2'>
                            <span className='px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold'>
                              Recommended
                            </span>
                            Option A: Install from npm
                          </p>
                          <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto'>
                            <pre>npm install @boobalan_jkkn/bug-reporter-sdk</pre>
                          </div>
                          <p className='text-sm text-muted-foreground mt-2'>
                            Or using yarn:
                          </p>
                          <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-2'>
                            <pre>yarn add @boobalan_jkkn/bug-reporter-sdk</pre>
                          </div>
                        </div>

                        <div>
                          <p className='text-sm font-medium mb-2'>Option B: Install from file path (for development)</p>
                          <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto'>
                            <pre>npm install file:../packages/bug-reporter-sdk</pre>
                          </div>
                        </div>

                        <div>
                          <p className='text-sm font-medium mb-2'>Option C: Install from built package</p>
                          <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto'>
                            <pre>{`# First, build the SDK package
cd packages/bug-reporter-sdk
npm run build

# Then install in your project
cd your-project-directory
npm install file:path/to/packages/bug-reporter-sdk`}</pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <CheckCircle2 className='h-5 w-5 text-green-600 flex-shrink-0 mt-0.5' />
                        <div>
                          <h5 className='font-semibold text-green-900 mb-1'>
                            ✅ Published on npm Registry
                          </h5>
                          <p className='text-sm text-green-800 mb-2'>
                            The SDK is now available on npm as <code className='bg-green-100 px-1 rounded'>@boobalan_jkkn/bug-reporter-sdk@1.1.0</code>. Simply install it using npm or yarn - no additional setup required!
                          </p>
                          <div className='flex flex-col sm:flex-row gap-2 mt-3'>
                            <a
                              href='https://www.npmjs.com/package/@boobalan_jkkn/bug-reporter-sdk'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-sm text-green-700 hover:text-green-900 underline inline-flex items-center gap-1'
                            >
                              View SDK on npm <ExternalLink className='h-3 w-3' />
                            </a>
                            <span className='hidden sm:inline text-green-600'>•</span>
                            <a
                              href='https://www.npmjs.com/package/@boobalan_jkkn/shared'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-sm text-green-700 hover:text-green-900 underline inline-flex items-center gap-1'
                            >
                              View Shared Types <ExternalLink className='h-3 w-3' />
                            </a>
                          </div>
                          <div className='mt-3 pt-3 border-t border-green-200'>
                            <p className='text-xs text-green-700 font-medium mb-1'>📦 Package Details:</p>
                            <ul className='text-xs text-green-800 space-y-0.5'>
                              <li>• Version: 1.1.0 (Latest)</li>
                              <li>• Size: 18.6 KB (86.4 KB unpacked)</li>
                              <li>• Includes: CJS, ESM, TypeScript definitions</li>
                              <li>• Dependencies: 3 (including @boobalan_jkkn/shared)</li>
                              <li>✨ NEW: Mandatory screenshots + Auto console logs</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <AlertCircle className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
                        <div>
                          <h5 className='font-semibold text-blue-900 mb-1'>
                            Getting 404 Error?
                          </h5>
                          <p className='text-sm text-blue-800 mb-2'>
                            If you see "npm error 404 Not Found" when installing, clear your npm cache first:
                          </p>
                          <div className='bg-slate-950 text-slate-50 rounded-lg p-3 font-mono text-xs overflow-x-auto'>
                            <pre>npm cache clean --force{'\n'}npm install @boobalan_jkkn/bug-reporter-sdk</pre>
                          </div>
                          <p className='text-xs text-blue-700 mt-2'>
                            This happens when npm's local cache hasn't updated with newly published packages.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <AlertCircle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
                        <div>
                          <h5 className='font-semibold text-amber-900 mb-1'>
                            Requirements
                          </h5>
                          <p className='text-sm text-amber-800'>
                            • Next.js 15+ with App Router<br />
                            • React 19+<br />
                            • TypeScript 5+ (recommended)<br />
                            • Node.js 18+
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configuration Tab */}
              <TabsContent value="configuration" className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Settings className='h-5 w-5' />
                      Step 2: Get Your API Key
                    </CardTitle>
                    <CardDescription>
                      Generate API credentials from the JKKN Bug Reporter platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <div className='space-y-4'>
                      <div className='flex items-start gap-3'>
                        <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' />
                        <div>
                          <h4 className='font-semibold mb-1'>1. Sign up / Log in</h4>
                          <p className='text-sm text-muted-foreground'>
                            Go to{' '}
                            <Link href='/login' className='text-blue-600 hover:underline'>
                              platform login page
                            </Link>{' '}
                            and authenticate
                          </p>
                        </div>
                      </div>

                      <div className='flex items-start gap-3'>
                        <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' />
                        <div>
                          <h4 className='font-semibold mb-1'>2. Create Organization</h4>
                          <p className='text-sm text-muted-foreground'>
                            Create a new organization (usually your department name) or join an existing one
                          </p>
                        </div>
                      </div>

                      <div className='flex items-start gap-3'>
                        <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' />
                        <div>
                          <h4 className='font-semibold mb-1'>3. Register Application</h4>
                          <p className='text-sm text-muted-foreground'>
                            Navigate to Applications → New Application and register your app
                          </p>
                          <div className='mt-2 bg-slate-100 rounded p-3 text-sm space-y-2'>
                            <div className='flex gap-2'>
                              <span className='font-medium min-w-[100px]'>Name:</span>
                              <span>Your application name</span>
                            </div>
                            <div className='flex gap-2'>
                              <span className='font-medium min-w-[100px]'>Slug:</span>
                              <span>unique-app-slug</span>
                            </div>
                            <div className='flex gap-2'>
                              <span className='font-medium min-w-[100px]'>Description:</span>
                              <span>Brief description of your app</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-start gap-3'>
                        <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' />
                        <div>
                          <h4 className='font-semibold mb-1'>4. Copy API Key</h4>
                          <p className='text-sm text-muted-foreground mb-2'>
                            After creating the application, you'll receive an API key. Copy and save it securely.
                          </p>
                          <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs'>
                            <pre>app_xxxxxxxxxxxxxxxxxxxxxxxxxx</pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                        <div>
                          <h5 className='font-semibold text-red-900 mb-1'>
                            Security Warning
                          </h5>
                          <p className='text-sm text-red-800'>
                            Never commit API keys to version control. Use environment variables to store sensitive credentials.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Next.js Setup Tab */}
              <TabsContent value="nextjs" className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Code className='h-5 w-5' />
                      Step 3: Next.js Integration
                    </CardTitle>
                    <CardDescription>
                      Complete setup for Next.js 15 with App Router
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {/* Environment Variables */}
                    <div>
                      <h4 className='font-semibold mb-3 text-lg'>3.1. Environment Variables</h4>
                      <p className='text-sm text-muted-foreground mb-3'>
                        Create a <code className='bg-slate-100 px-2 py-0.5 rounded text-xs'>.env.local</code> file in your project root:
                      </p>
                      <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto'>
                        <pre>{`# JKKN Bug Reporter Configuration
NEXT_PUBLIC_BUG_REPORTER_API_KEY=app_your_api_key_here
NEXT_PUBLIC_BUG_REPORTER_API_URL=https://your-platform.vercel.app`}</pre>
                      </div>
                    </div>

                    {/* Root Layout Setup */}
                    <div>
                      <h4 className='font-semibold mb-3 text-lg'>3.2. Root Layout Setup</h4>
                      <p className='text-sm text-muted-foreground mb-3'>
                        Update your <code className='bg-slate-100 px-2 py-0.5 rounded text-xs'>app/layout.tsx</code>:
                      </p>
                      <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto'>
                        <pre>{`import { BugReporterProvider } from '@boobalan_jkkn/bug-reporter-sdk';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BugReporterProvider
          apiKey={process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY!}
          apiUrl={process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL!}
          enabled={true}
          debug={process.env.NODE_ENV === 'development'}
          userContext={{
            userId: 'user-id-here', // Optional
            name: 'John Doe',       // Optional
            email: 'user@jkkn.ac.in' // Optional
          }}
        >
          {children}
        </BugReporterProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}`}</pre>
                      </div>
                    </div>

                    {/* With Auth (Supabase) */}
                    <div>
                      <h4 className='font-semibold mb-3 text-lg'>3.3. With Supabase Authentication</h4>
                      <p className='text-sm text-muted-foreground mb-3'>
                        For authenticated apps using Supabase:
                      </p>
                      <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto'>
                        <pre>{`'use client';

import { BugReporterProvider } from '@boobalan_jkkn/bug-reporter-sdk';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function BugReporterWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  return (
    <BugReporterProvider
      apiKey={process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY!}
      apiUrl={process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL!}
      enabled={true}
      userContext={user ? {
        userId: user.id,
        name: user.user_metadata?.full_name,
        email: user.email
      } : undefined}
    >
      {children}
    </BugReporterProvider>
  );
}`}</pre>
                      </div>
                    </div>

                    {/* Features */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <h5 className='font-semibold text-blue-900 mb-2 flex items-center gap-2'>
                        <Zap className='h-4 w-4' />
                        What You Get
                      </h5>
                      <ul className='space-y-1 text-sm text-blue-800'>
                        <li className='flex items-center gap-2'>
                          <CheckCircle2 className='h-4 w-4' />
                          🐛 Floating bug report button (bottom-right)
                        </li>
                        <li className='flex items-center gap-2'>
                          <CheckCircle2 className='h-4 w-4' />
                          📸 <strong>MANDATORY</strong> screenshot capture (v1.1.0+)
                        </li>
                        <li className='flex items-center gap-2'>
                          <CheckCircle2 className='h-4 w-4' />
                          🔍 <strong>AUTOMATIC</strong> console logs capture (v1.1.0+)
                        </li>
                        <li className='flex items-center gap-2'>
                          <CheckCircle2 className='h-4 w-4' />
                          👤 User context tracking
                        </li>
                        <li className='flex items-center gap-2'>
                          <CheckCircle2 className='h-4 w-4' />
                          🌐 Browser and system info
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Configuration</CardTitle>
                    <CardDescription>
                      Customize behavior and add advanced features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {/* Custom Styling */}
                    <div>
                      <h4 className='font-semibold mb-2'>Custom Widget Styling</h4>
                      <p className='text-sm text-muted-foreground mb-3'>
                        Override default styles using CSS classes:
                      </p>
                      <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto'>
                        <pre>{`/* globals.css */
.bug-reporter-widget {
  /* Custom floating button styles */
  bottom: 2rem !important;
  right: 2rem !important;
}

.bug-reporter-sdk {
  /* Custom modal/widget styles */
  font-family: 'Your Custom Font' !important;
}`}</pre>
                      </div>
                    </div>

                    {/* Conditional Rendering */}
                    <div>
                      <h4 className='font-semibold mb-2'>Conditional Rendering</h4>
                      <p className='text-sm text-muted-foreground mb-3'>
                        Show/hide bug reporter based on conditions:
                      </p>
                      <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto'>
                        <pre>{`<BugReporterProvider
  apiKey={process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY!}
  apiUrl={process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL!}
  enabled={
    process.env.NODE_ENV === 'production' &&
    user?.role === 'beta-tester'
  }
  debug={false}
>
  {children}
</BugReporterProvider>`}</pre>
                      </div>
                    </div>

                    {/* My Bugs Panel */}
                    <div>
                      <h4 className='font-semibold mb-2'>Add "My Bugs" Panel</h4>
                      <p className='text-sm text-muted-foreground mb-3'>
                        Let users view their submitted bugs:
                      </p>
                      <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto'>
                        <pre>{`import { MyBugsPanel } from '@boobalan_jkkn/bug-reporter-sdk';

export default function ProfilePage() {
  return (
    <div>
      <h1>My Profile</h1>
      <MyBugsPanel />
    </div>
  );
}`}</pre>
                      </div>
                    </div>

                    {/* Programmatic Reporting */}
                    <div>
                      <h4 className='font-semibold mb-2'>Programmatic Bug Reporting</h4>
                      <p className='text-sm text-muted-foreground mb-3'>
                        Trigger bug reports from code:
                      </p>
                      <div className='bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto'>
                        <pre>{`import { useBugReporter } from '@boobalan_jkkn/bug-reporter-sdk';

function MyComponent() {
  const { apiClient } = useBugReporter();

  const handleError = async (error: Error) => {
    try {
      await apiClient?.createBugReport({
        title: 'Automatic Error Report',
        description: error.message,
        page_url: window.location.href,
        category: 'error',
        console_logs: [],
      });
    } catch (err) {
      console.error('Failed to report bug:', err);
    }
  };

  return <button onClick={() => handleError(new Error('Test'))}>
    Report Error
  </button>;
}`}</pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Troubleshooting */}
                <Card>
                  <CardHeader>
                    <CardTitle>Troubleshooting</CardTitle>
                    <CardDescription>
                      Common issues and solutions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='border-l-4 border-purple-500 bg-purple-50 p-4 rounded'>
                        <h5 className='font-semibold mb-1'>npm install shows 404 error?</h5>
                        <p className='text-sm text-muted-foreground mb-2'>
                          • Clear npm cache: <code className='bg-purple-100 px-1.5 py-0.5 rounded text-xs'>npm cache clean --force</code><br />
                          • Wait 5-10 minutes if package was just published<br />
                          • Try with explicit registry: <code className='bg-purple-100 px-1.5 py-0.5 rounded text-xs'>npm install @boobalan_jkkn/bug-reporter-sdk --registry=https://registry.npmjs.org/</code><br />
                          • Verify package exists at: <a href='https://www.npmjs.com/package/@boobalan_jkkn/bug-reporter-sdk' target='_blank' className='text-purple-700 hover:underline'>npmjs.com</a>
                        </p>
                      </div>

                      <div className='border-l-4 border-amber-500 bg-amber-50 p-4 rounded'>
                        <h5 className='font-semibold mb-1'>Widget not appearing?</h5>
                        <p className='text-sm text-muted-foreground'>
                          • Check that <code>enabled={true}</code> is set<br />
                          • Verify API key is correct<br />
                          • Check browser console for errors<br />
                          • Ensure API URL is reachable
                        </p>
                      </div>

                      <div className='border-l-4 border-red-500 bg-red-50 p-4 rounded'>
                        <h5 className='font-semibold mb-1'>API key validation failed?</h5>
                        <p className='text-sm text-muted-foreground'>
                          • Verify API key starts with "app_"<br />
                          • Check that application is active<br />
                          • Ensure API URL matches platform URL<br />
                          • Try regenerating the API key
                        </p>
                      </div>

                      <div className='border-l-4 border-blue-500 bg-blue-50 p-4 rounded'>
                        <h5 className='font-semibold mb-1'>Screenshots not capturing? (v1.1.0+)</h5>
                        <p className='text-sm text-muted-foreground'>
                          • Screenshot is now MANDATORY - widget won't open without it<br />
                          • Browser may block html2canvas library<br />
                          • Check Content Security Policy (CSP)<br />
                          • Verify no conflicting screenshot libraries<br />
                          • Try closing overlays/modals and retry
                        </p>
                      </div>

                      <div className='border-l-4 border-green-500 bg-green-50 p-4 rounded'>
                        <h5 className='font-semibold mb-1'>Console logs empty? (v1.1.0+)</h5>
                        <p className='text-sm text-muted-foreground'>
                          • Logs capture automatically in v1.1.0+<br />
                          • Perform actions that generate console output before reporting<br />
                          • Verify you're using v1.1.0 or later: <code className='bg-green-100 px-1 rounded text-xs'>npm list @boobalan_jkkn/bug-reporter-sdk</code><br />
                          • Check BugReporterProvider wraps your app correctly
                        </p>
                      </div>

                      <div className='border-l-4 border-orange-500 bg-orange-50 p-4 rounded'>
                        <h5 className='font-semibold mb-1'>How to update to v1.1.0?</h5>
                        <p className='text-sm text-muted-foreground mb-2'>
                          If you already have the SDK installed, update to the latest version:
                        </p>
                        <div className='bg-slate-950 text-slate-50 rounded p-2 font-mono text-xs mb-2'>
                          npm install @boobalan_jkkn/bug-reporter-sdk@latest
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          ✅ No breaking changes - fully backward compatible!<br />
                          ✅ New features work automatically<br />
                          ✅ No configuration changes needed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* API Reference Card */}
            <Card className='mt-8 border-2 border-purple-200 bg-purple-50/50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Code className='h-5 w-5' />
                  API Reference & Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-2 gap-4'>
                  <div className='bg-white p-4 rounded-lg border'>
                    <h4 className='font-semibold mb-2'>TypeScript Types</h4>
                    <p className='text-sm text-muted-foreground mb-3'>
                      Full type definitions for SDK
                    </p>
                    <Button variant='outline' size='sm' asChild>
                      <a href='#' className='gap-2'>
                        View Types <ExternalLink className='h-3 w-3' />
                      </a>
                    </Button>
                  </div>
                  <div className='bg-white p-4 rounded-lg border'>
                    <h4 className='font-semibold mb-2'>Example Projects</h4>
                    <p className='text-sm text-muted-foreground mb-3'>
                      Demo apps and code samples
                    </p>
                    <Button variant='outline' size='sm' asChild>
                      <a href='#' className='gap-2'>
                        Browse Examples <ExternalLink className='h-3 w-3' />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className='mt-8 bg-gradient-to-r from-blue-600 to-blue-900 text-white'>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription className='text-blue-100'>
                  Our team is here to support JKKN developers
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col sm:flex-row gap-4'>
                <Button variant='secondary' size='lg' asChild>
                  <Link href='/login' className='gap-2'>
                    Go to Dashboard <ArrowRight className='h-4 w-4' />
                  </Link>
                </Button>
                <Button variant='outline' size='lg' className='bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-900'>
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-8'>
        <div className='container mx-auto px-4 text-center'>
          <p className='text-sm text-gray-400'>
            &copy; 2025 JKKN Bug Reporter. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
