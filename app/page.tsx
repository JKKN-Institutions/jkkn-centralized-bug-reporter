import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Bug,
  Zap,
  Shield,
  Users,
  BarChart3,
  MessageSquare,
  Award,
  Code
} from 'lucide-react';
import { HomepageNav } from './_components/homepage-nav';

export default function Home() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50'>
      {/* Header */}
      <header className='border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold shadow-md'>
                <Bug className='h-6 w-6' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-gray-900'>
                  JKKN Bug Reporter
                </h1>
                <p className='text-xs text-gray-600'>Manage Your Bugs</p>
              </div>
            </div>
            <HomepageNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='py-16 md:py-24'>
        <div className='container mx-auto px-4'>
          <div className='max-w-5xl mx-auto'>
            <div className='text-center space-y-6 mb-12'>
              <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700 mb-4'>
                <Zap className='h-4 w-4' />
                Centralized Bug Tracking System
              </div>
              <h1 className='text-4xl md:text-6xl font-extrabold tracking-tight'>
                <span className='bg-linear-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent'>
                  JKKN Institution
                </span>
                <br />
                <span className='text-gray-900'>Bug Reporting Platform</span>
              </h1>
              <p className='text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
                A unified platform for all JKKN departments and applications to
                track, manage, and resolve bugs efficiently with real-time
                collaboration.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center pt-6'>
                <Link href='/signup'>
                  <Button
                    size='lg'
                    className='text-lg px-8 bg-linear-to-r from-blue-600 to-blue-800 shadow-lg hover:shadow-xl transition-all'
                  >
                    Start Reporting Bugs
                  </Button>
                </Link>
                <Link href='#features'>
                  <Button
                    size='lg'
                    variant='outline'
                    className='text-lg px-8 border-2'
                  >
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Section */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mt-16'>
              <div className='text-center p-6 bg-white rounded-xl shadow-md border border-gray-100'>
                <div className='text-3xl font-bold text-blue-600 mb-1'>
                  100+
                </div>
                <div className='text-sm text-gray-600'>Applications</div>
              </div>
              <div className='text-center p-6 bg-white rounded-xl shadow-md border border-gray-100'>
                <div className='text-3xl font-bold text-green-600 mb-1'>
                  50+
                </div>
                <div className='text-sm text-gray-600'>Departments</div>
              </div>
              <div className='text-center p-6 bg-white rounded-xl shadow-md border border-gray-100'>
                <div className='text-3xl font-bold text-purple-600 mb-1'>
                  1000+
                </div>
                <div className='text-sm text-gray-600'>Users</div>
              </div>
              <div className='text-center p-6 bg-white rounded-xl shadow-md border border-gray-100'>
                <div className='text-3xl font-bold text-orange-600 mb-1'>
                  24/7
                </div>
                <div className='text-sm text-gray-600'>Availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='py-20 bg-white'>
        <div className='container mx-auto px-4'>
          <div className='text-center space-y-4 mb-16'>
            <div className='inline-block px-4 py-2 bg-blue-50 rounded-full text-sm font-semibold text-blue-700 mb-2'>
              Platform Features
            </div>
            <h2 className='text-3xl md:text-5xl font-bold text-gray-900'>
              Everything You Need in One Place
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              Powerful features designed specifically for JKKN
              institution&apos;s bug tracking needs
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'>
            {/* Feature 1 */}
            <Card className='border-2 hover:border-blue-300 hover:shadow-lg transition-all'>
              <CardHeader>
                <div className='h-14 w-14 bg-linear-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-4 shadow-md'>
                  <Code className='h-7 w-7 text-white' />
                </div>
                <CardTitle className='text-xl'>Easy SDK Integration</CardTitle>
                <CardDescription className='text-base'>
                  Integrate bug reporting into any React application with just a
                  few lines of code. Start capturing bugs instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className='border-2 hover:border-green-300 hover:shadow-lg transition-all'>
              <CardHeader>
                <div className='h-14 w-14 bg-linear-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-4 shadow-md'>
                  <Users className='h-7 w-7 text-white' />
                </div>
                <CardTitle className='text-xl'>
                  Multi-Department Support
                </CardTitle>
                <CardDescription className='text-base'>
                  Manage bugs across all JKKN departments and applications from
                  a single centralized platform with complete data isolation.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className='border-2 hover:border-purple-300 hover:shadow-lg transition-all'>
              <CardHeader>
                <div className='h-14 w-14 bg-linear-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center mb-4 shadow-md'>
                  <MessageSquare className='h-7 w-7 text-white' />
                </div>
                <CardTitle className='text-xl'>
                  Real-Time Collaboration
                </CardTitle>
                <CardDescription className='text-base'>
                  Communicate with bug reporters in real-time. Add comments,
                  attachments, and update status instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className='border-2 hover:border-orange-300 hover:shadow-lg transition-all'>
              <CardHeader>
                <div className='h-14 w-14 bg-linear-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center mb-4 shadow-md'>
                  <BarChart3 className='h-7 w-7 text-white' />
                </div>
                <CardTitle className='text-xl'>Analytics Dashboard</CardTitle>
                <CardDescription className='text-base'>
                  Get insights into bug trends, resolution times, and department
                  performance with comprehensive analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className='border-2 hover:border-red-300 hover:shadow-lg transition-all'>
              <CardHeader>
                <div className='h-14 w-14 bg-linear-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center mb-4 shadow-md'>
                  <Shield className='h-7 w-7 text-white' />
                </div>
                <CardTitle className='text-xl'>Enterprise Security</CardTitle>
                <CardDescription className='text-base'>
                  Row-level security, role-based access control, and secure API
                  authentication ensure your data is protected.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className='border-2 hover:border-yellow-300 hover:shadow-lg transition-all'>
              <CardHeader>
                <div className='h-14 w-14 bg-linear-to-br from-yellow-500 to-yellow-700 rounded-xl flex items-center justify-center mb-4 shadow-md'>
                  <Award className='h-7 w-7 text-white' />
                </div>
                <CardTitle className='text-xl'>Bug Bounty System</CardTitle>
                <CardDescription className='text-base'>
                  Encourage quality bug reports with gamification, leaderboards,
                  and rewards for top contributors.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className='py-20 bg-linear-to-b from-blue-50 to-white'>
        <div className='container mx-auto px-4'>
          <div className='text-center space-y-4 mb-16'>
            <div className='inline-block px-4 py-2 bg-white rounded-full text-sm font-semibold text-blue-700 mb-2 shadow-sm'>
              Simple Process
            </div>
            <h2 className='text-3xl md:text-5xl font-bold text-gray-900'>
              How It Works
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              Get started with bug reporting in three simple steps
            </p>
          </div>

          <div className='max-w-5xl mx-auto'>
            <div className='grid md:grid-cols-3 gap-8'>
              {/* Step 1 */}
              <div className='text-center'>
                <div className='relative'>
                  <div className='h-20 w-20 bg-linear-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg'>
                    1
                  </div>
                </div>
                <h3 className='text-xl font-bold mb-3 text-gray-900'>
                  Integrate SDK
                </h3>
                <p className='text-gray-600'>
                  Add our lightweight SDK to your application with just a few
                  lines of code
                </p>
              </div>

              {/* Step 2 */}
              <div className='text-center'>
                <div className='relative'>
                  <div className='h-20 w-20 bg-linear-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg'>
                    2
                  </div>
                </div>
                <h3 className='text-xl font-bold mb-3 text-gray-900'>
                  Report Bugs
                </h3>
                <p className='text-gray-600'>
                  Users can report bugs with screenshots, console logs, and
                  descriptions
                </p>
              </div>

              {/* Step 3 */}
              <div className='text-center'>
                <div className='relative'>
                  <div className='h-20 w-20 bg-linear-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg'>
                    3
                  </div>
                </div>
                <h3 className='text-xl font-bold mb-3 text-gray-900'>
                  Track & Resolve
                </h3>
                <p className='text-gray-600'>
                  Manage, prioritize, and resolve bugs efficiently from your
                  dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-linear-to-r from-blue-600 to-blue-900 text-white'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto text-center space-y-8'>
            <h2 className='text-3xl md:text-5xl font-bold'>
              Ready to Streamline Bug Tracking at JKKN?
            </h2>
            <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
              Join departments across JKKN institution already using our
              platform to track and resolve bugs faster
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center pt-4'>
              <Link href='/signup'>
                <Button
                  size='lg'
                  variant='secondary'
                  className='text-lg px-8 shadow-lg'
                >
                  Get Started Now
                </Button>
              </Link>
              <Link href='/login'>
                <Button
                  size='lg'
                  variant='outline'
                  className='text-lg px-8 bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-900 transition-all'
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-12'>
        <div className='container mx-auto px-4'>
          <div className='grid md:grid-cols-4 gap-8 mb-8'>
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <div className='h-10 w-10 bg-linear-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md'>
                  <Bug className='h-6 w-6' />
                </div>
                <div>
                  <span className='font-bold text-lg'>JKKN Bug Reporter</span>
                </div>
              </div>
              <p className='text-sm text-gray-400 leading-relaxed'>
                Centralized bug tracking platform for JKKN Institution
              </p>
            </div>
            <div>
              <h3 className='font-semibold mb-4 text-lg'>Platform</h3>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li>
                  <Link
                    href='#features'
                    className='hover:text-white transition-colors'
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href='/signup'
                    className='hover:text-white transition-colors'
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href='/login'
                    className='hover:text-white transition-colors'
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold mb-4 text-lg'>Resources</h3>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li>
                  <Link
                    href='/docs'
                    className='hover:text-white transition-colors'
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href='/docs'
                    className='hover:text-white transition-colors'
                  >
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link
                    href='/docs'
                    className='hover:text-white transition-colors'
                  >
                    SDK Guide
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold mb-4 text-lg'>Institution</h3>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li>
                  <a
                    href='https://jkkn.ac.in'
                    target='_blank'
                    className='hover:text-white transition-colors'
                  >
                    About JKKN
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-white transition-colors'>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-white transition-colors'>
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className='border-t border-gray-800 pt-8 text-center text-sm text-gray-400'>
            <p>&copy; 2025 Manage Your Bugs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
