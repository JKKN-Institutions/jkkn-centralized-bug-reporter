'use server';

import { SuperAdminServerService } from '../services/super-admins/server';
import type { CreateSuperAdminPayload } from '../services/super-admins/server';

/**
 * Server Actions for Super Admin Management
 */

export async function addSuperAdminAction(payload: CreateSuperAdminPayload) {
  try {
    const data = await SuperAdminServerService.addSuperAdmin(payload);
    return { data, error: null };
  } catch (error) {
    console.error('[addSuperAdminAction] Error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add super admin',
    };
  }
}

export async function removeSuperAdminAction(superAdminId: string) {
  try {
    await SuperAdminServerService.removeSuperAdmin(superAdminId);
    return { success: true, error: null };
  } catch (error) {
    console.error('[removeSuperAdminAction] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to remove super admin',
    };
  }
}

export async function listSuperAdminsAction() {
  try {
    const data = await SuperAdminServerService.listSuperAdmins();
    return { data, error: null };
  } catch (error) {
    console.error('[listSuperAdminsAction] Error:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to list super admins',
    };
  }
}

export async function checkIsSuperAdminAction() {
  try {
    const isSuperAdmin =
      await SuperAdminServerService.checkCurrentUserIsSuperAdmin();
    return { data: isSuperAdmin, error: null };
  } catch (error) {
    console.error('[checkIsSuperAdminAction] Error:', error);
    return {
      data: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to check super admin status',
    };
  }
}

export async function listAvailableUsersAction() {
  try {
    const data = await SuperAdminServerService.listAvailableUsers();
    return { data, error: null };
  } catch (error) {
    console.error('[listAvailableUsersAction] Error:', error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to list available users',
    };
  }
}
