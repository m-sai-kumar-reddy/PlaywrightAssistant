import { interceptNetwork } from "../engine/index";

export async function registerAllMocks(mockBundle: Record<string, any>) {
  const entries = Object.entries(mockBundle);

  for (const [url, mockData] of entries) {
    await interceptNetwork({
      url: `**/${url}`,
      mockData,
    });
  }
}
