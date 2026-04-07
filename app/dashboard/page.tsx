"use client";

import Header from "@/components/Header";
import MainWorkspace from "@/components/MainWorkspace";
import { useAuth } from "@/hooks/useAuth";
import type { PendingMonitorData } from "@/lib/pending-monitor-data";
import {
  PENDING_TEST_DATA_EVENT,
  type PendingTestData,
  readPendingTestData,
} from "@/lib/pending-test-data";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export const dynamic = "force-dynamic";

function DashboardContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "testing");
  const [monitorDraft, setMonitorDraft] = useState<PendingMonitorData | null>(
    null,
  );
  const [testData, setTestData] = useState<PendingTestData | null>(null);

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    const syncPendingTestData = () => {
      const parsedData = readPendingTestData();
      if (!parsedData) {
        return;
      }

      setTestData(parsedData);
      setActiveTab("testing");
    };

    syncPendingTestData();
    window.addEventListener(PENDING_TEST_DATA_EVENT, syncPendingTestData);

    return () => {
      window.removeEventListener(PENDING_TEST_DATA_EVENT, syncPendingTestData);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Загрузка...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <MainWorkspace
        userId={user?.id || "guest-user"}
        activeTab={activeTab}
        monitorDraft={monitorDraft}
        onCreateMonitorFromTest={(nextMonitorDraft) => {
          setMonitorDraft(nextMonitorDraft);
          setActiveTab("monitoring");
        }}
        testData={testData ?? undefined}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-zinc-600 dark:text-zinc-400">Загрузка...</p>
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
