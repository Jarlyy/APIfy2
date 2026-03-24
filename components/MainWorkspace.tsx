"use client";

import type { PendingMonitorData } from "@/lib/pending-monitor-data";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { UnifiedApiTester } from "./UnifiedApiTester";

const OpenApiImport = dynamic(() => import("./OpenApiImport"));
const HistoryTab = dynamic(() => import("./HistoryTab"));
const FavoritesTab = dynamic(() => import("./FavoritesTab"));
const AnalyticsTab = dynamic(() => import("./AnalyticsTab"));

interface MainWorkspaceProps {
  userId: string;
  initialTab?: string;
  activeTab?: string;
  monitorDraft?: PendingMonitorData | null;
  onCreateMonitorFromTest?: (monitorData: PendingMonitorData) => void;
  testData?: {
    serviceName: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
    authType: string;
    authToken: string;
  };
}

export default function MainWorkspace({
  userId,
  initialTab = "testing",
  activeTab,
  monitorDraft,
  onCreateMonitorFromTest,
  testData,
}: MainWorkspaceProps) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [currentTab, setCurrentTab] = useState(
    activeTab || tabFromUrl || initialTab,
  );

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    } else if (tabFromUrl) {
      setCurrentTab(tabFromUrl);
    }
  }, [activeTab, tabFromUrl]);

  const renderCurrentTab = () => {
    switch (currentTab) {
      case "testing":
        return (
          <UnifiedApiTester
            userId={userId}
            onCreateMonitorFromTest={onCreateMonitorFromTest}
            testData={testData}
          />
        );

      case "favorites":
        return <FavoritesTab userId={userId} />;

      case "import":
        return (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                Импорт OpenAPI/Swagger
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Загрузите спецификацию OpenAPI для автоматического создания
                тестов
              </p>
            </div>
            <OpenApiImport />
          </>
        );

      case "analytics":
        return <AnalyticsTab monitorDraft={monitorDraft} />;

      case "history":
        return <HistoryTab />;

      default:
        return (
          <UnifiedApiTester
            userId={userId}
            onCreateMonitorFromTest={onCreateMonitorFromTest}
            testData={testData}
          />
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {renderCurrentTab()}
    </div>
  );
}
