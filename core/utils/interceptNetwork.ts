import { Page, Route, Request } from "@playwright/test";

interface InterceptOptions {
  url: string | RegExp;
  method?: string;
  mockData: any;
  status?: number;
  contentType?: string;
}

export async function interceptNetwork(page: Page, options: InterceptOptions) {
  const {
    url,
    mockData,
    method = "GET",
    status = 200,
    contentType = "application/json",
  } = options;

  await page.route(url, async (route: Route, request: Request) => {
    if (request.method() === method) {
      route.fulfill({
        status,
        contentType,
        body: JSON.stringify(mockData),
      });
    } else {
      route.continue();
    }
  });
}
