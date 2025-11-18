'use client';

import { ProjectProvider } from '@/contexts/ProjectContext';
import SessionProvider from '@/components/SessionProvider';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
