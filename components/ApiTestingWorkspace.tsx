'use client'

import { UnifiedApiTester } from './UnifiedApiTester'

interface ApiTestingWorkspaceProps {
  userId: string
}

export default function ApiTestingWorkspace({ userId }: ApiTestingWorkspaceProps) {
  return (
    <div className="container mx-auto py-6">
      <UnifiedApiTester userId={userId} />
    </div>
  )
}