import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';

const MAX_PAGE_SIZE = 100;

type UserRow = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'CUSTOMER' | 'MANAGER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  provider: string;
  created_at: string;
  updated_at?: string;
};

interface NormalizedUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'CUSTOMER' | 'MANAGER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  provider: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string | null;
}

async function getUsersHandler(request: NextRequest) {
  await requireAdminAccess(request);

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
  const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10) || 20;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const provider = searchParams.get('provider');
  const search = searchParams.get('search')?.trim();

  const applyFilters = <Builder extends {
    eq: (column: string, value: any) => Builder;
    or: (filter: string) => Builder;
  }>(query: Builder): Builder => {
    let nextQuery = query;

    if (role && role !== 'ALL') {
      nextQuery = nextQuery.eq('role', role.toUpperCase());
    }

    if (status && status !== 'ALL') {
      nextQuery = nextQuery.eq('status', status.toUpperCase());
    }

    if (provider && provider !== 'ALL') {
      nextQuery = nextQuery.eq('provider', provider);
    }

    if (search) {
      const sanitized = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const pattern = `%${sanitized}%`;
      nextQuery = nextQuery.or(
        `name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
      );
    }

    return nextQuery;
  };

  let usersQuery = supabaseAdmin
    .from('users')
    .select(
      'id, email, name, phone, role, status, provider, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  usersQuery = applyFilters(usersQuery);

  const { data: users, error: usersError } = await usersQuery;

  if (usersError) {
    console.error('Admin users fetch error:', usersError);
    throw ApiErrors.InternalServerError(
      '���� ����Ʈ�� �ҷ����� �� ������ �߻��߽��ϴ�.',
      'USERS_FETCH_ERROR'
    );
  }

  let countQuery = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true });

  countQuery = applyFilters(countQuery);

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error('Admin users count error:', countError);
    throw ApiErrors.InternalServerError(
      '���� ������ ������ �� ������ �߻��߽��ϴ�.',
      'USERS_COUNT_ERROR'
    );
  }

  const total = count ?? users?.length ?? 0;

  const authUserMap = new Map<string, { email_confirmed_at: string | null; last_sign_in_at: string | null }>();

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (authError) {
      console.error('Supabase auth list users error:', authError);
    } else if (authData?.users) {
      for (const authUser of authData.users) {
        authUserMap.set(authUser.id, {
          email_confirmed_at: authUser.email_confirmed_at ?? null,
          last_sign_in_at: authUser.last_sign_in_at ?? null
        });
      }
    }
  } catch (authListError) {
    console.error('Supabase auth list users unexpected error:', authListError);
  }

  const normalized: NormalizedUser[] = (users ?? []).map((user) => {
    const authInfo = authUserMap.get(user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      role: user.role,
      status: user.status,
      provider: user.provider,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_active: user.status === 'ACTIVE',
      email_verified: Boolean(authInfo?.email_confirmed_at),
      last_login_at: authInfo?.last_sign_in_at ?? null
    };
  });

  return createSuccessResponse({
    users: normalized,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    }
  }, '���� ����Ʈ�� �����߽��ϴ�.');
}

export const GET = withErrorHandling(getUsersHandler);
