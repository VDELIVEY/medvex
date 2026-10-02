'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, type UserRole } from '@/lib/context';

interface RoleGuardProps {
  allowedRole: UserRole | UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { role, isHydrated } = useApp();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const allowedRolesStr = Array.isArray(allowedRole) ? allowedRole.join(',') : allowedRole || '';

  useEffect(() => {
    if (!isHydrated) return;

    const rolesList = allowedRolesStr.split(',').filter(Boolean);
    const isAllowed = rolesList.includes(role || '');

    if (!isAllowed) {
      router.replace('/auth/login');
      return;
    }

    setAuthorized(true);
  }, [role, allowedRolesStr, isHydrated, router]);

  if (!isHydrated || !authorized) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Checking access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

