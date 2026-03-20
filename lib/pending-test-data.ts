export const PENDING_TEST_DATA_EVENT = "pending-test-data-updated";

export interface PendingTestData {
  serviceName: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  authType: string;
  authToken: string;
}

export function readPendingTestData(): PendingTestData | null {
  const pendingTestData = localStorage.getItem("pendingTestData");

  if (!pendingTestData) {
    return null;
  }

  try {
    const parsedData = JSON.parse(pendingTestData) as PendingTestData;
    localStorage.removeItem("pendingTestData");
    return parsedData;
  } catch (error) {
    console.error("Ошибка парсинга данных теста:", error);
    localStorage.removeItem("pendingTestData");
    return null;
  }
}

export function queuePendingTestData(testData: PendingTestData) {
  localStorage.setItem("pendingTestData", JSON.stringify(testData));
  window.dispatchEvent(new Event(PENDING_TEST_DATA_EVENT));
}
