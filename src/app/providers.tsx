'use client';

import { ProjectProvider } from '@/contexts/ProjectContext';
import SessionProvider from '@/components/SessionProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </SessionProvider>
  );
}
