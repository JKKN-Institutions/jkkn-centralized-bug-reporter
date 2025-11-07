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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Plus,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Users,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import {
  useOrganizations,
  useCreateOrganization
} from '@/hooks/organizations/use-organizations';
import { formatDistanceToNow } from 'date-fns';

/**
 * Organizations Management Page (Super Admin Only)
 * Create and view all organizations
 */
export default function OrganizationsPage() {
  const { organizations, loading, refetch } = useOrganizations(true); // Pass true to fetch all orgs with member counts for admin
  const { createOrganization, creating } = useCreateOrganization();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrganization = async () => {
    setError(null);

    if (!formData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    if (!formData.slug.trim()) {
      setError('Organization slug is required');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      await createOrganization({
        name: formData.name.trim(),
        slug: formData.slug.trim()
      });

      // Success - close dialog, reset form, and refetch
      setIsCreateDialogOpen(false);
      setFormData({ name: '', slug: '' });
      refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create organization'
      );
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }));
  };

  return (
    <div className='min-h-screen bg-linear-to-r from-blue-50 via-white to-purple-50'>
      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Header */}
        <div className='space-y-4'>
          <Link href='/admin/dashboard'>
            <Button variant='ghost' className='gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back to Dashboard
            </Button>
          </Link>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-3 bg-linear-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg'>
                <Building2 className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Organizations
                </h1>
                <p className='text-gray-600'>Create and manage organizations</p>
              </div>
            </div>

            {/* Create Organization Button */}
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className='bg-linear-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 gap-2'>
                  <Plus className='h-4 w-4' />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Enter organization name and slug. The slug will be used in
                    URLs.
                  </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-4'>
                  {error && (
                    <Alert variant='destructive'>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className='space-y-2'>
                    <Label htmlFor='name'>Organization Name *</Label>
                    <Input
                      id='name'
                      placeholder='e.g., JKKN College'
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='slug'>Slug *</Label>
                    <Input
                      id='slug'
                      placeholder='e.g., jkkn-college'
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          slug: e.target.value
                        }))
                      }
                    />
                    <p className='text-xs text-gray-500'>
                      Lowercase letters, numbers, and hyphens only. Used in
                      URLs.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setFormData({ name: '', slug: '' });
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateOrganization}
                    disabled={creating}
                    className='bg-linear-to-r from-blue-600 to-blue-800'
                  >
                    {creating ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        Creating...
                      </>
                    ) : (
                      'Create Organization'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className='border-blue-200 bg-blue-50'>
          <Building2 className='h-4 w-4 text-blue-600' />
          <AlertDescription className='text-blue-900'>
            Only super admins can create organizations. After creating an
            organization, you can assign members to it from the
            organization&apos;s page.
          </AlertDescription>
        </Alert>

        {/* Organizations List */}
        <Card className='border-2 shadow-lg'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <div>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>
                Platform-wide list of organizations
              </CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={loading}
              className='gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
              </div>
            ) : !organizations || organizations.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Building2 className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                <p>No organizations found</p>
                <p className='text-sm mt-2'>
                  Create your first organization to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className='font-medium'>{org.name}</div>
                      </TableCell>
                      <TableCell>
                        <code className='text-sm bg-gray-100 px-2 py-1 rounded'>
                          {org.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {formatDistanceToNow(new Date(org.created_at), {
                            addSuffix: true
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Users className='h-4 w-4' />
                          <span>{org.member_count ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Link href={`/org/${org.slug}/team`}>
                            <Button
                              variant='outline'
                              size='sm'
                              className='gap-2 border-blue-200 text-blue-700 hover:bg-blue-50'
                            >
                              <Users className='h-3 w-3' />
                              Manage Team
                            </Button>
                          </Link>
                          <Link href={`/org/${org.slug}`}>
                            <Button variant='ghost' size='sm' className='gap-2'>
                              View Org
                              <ExternalLink className='h-3 w-3' />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
