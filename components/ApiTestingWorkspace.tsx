'use client'

import { useState } from 'react'
import { AIAnalyzer } from './AIAnalyzer'
import ApiTestFormLocal, { TestTemplate } from './ApiTestFormLocal'

interface ApiTestingWorkspaceProps {
  userId: string
}

export default function ApiTestingWorkspace({ userId }: ApiTestingWorkspaceProps) {
  const [generatedTests, setGeneratedTests] = useState<TestTemplate[]>([])
  const [showGeneratedTests, setShowGeneratedTests] = useState(false)

  const handleTestsGenerated = (tests: TestTemplate[]) => {
    setGeneratedTests(tests)
    setShowGeneratedTests(true)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <AIAnalyzer onTestGenerated={handleTestsGenerated} />
      </div>
      <div className="space-y-6">
        <ApiTestFormLocal 
          userId={userId} 
          generatedTests={showGeneratedTests ? generatedTests : []}
          onTestsUsed={() => setShowGeneratedTests(false)}
        />
      </div>
    </div>
  )
}