import { testText } from "../../components/text.js";
import { testCard } from "../../components/card.js";
import { testUrl } from "../../components/url.js";
import { registerAllMocks } from "../../core/utils/registerAllMocks.js";
import mockData from "../../mocks/overview.mock.json";
import {
  ensureAdapter,
  interceptAllRequestsWithToken,
} from "../../core/engine/index.js";

export async function testOverviewPage() {
  // Register all API mocks before page load
  await registerAllMocks(mockData);
  await interceptAllRequestsWithToken(
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxwYUxwSDRjYUpoVGIxRUVIS1k1NSJ9.eyJmZWRlcmF0ZWRJZCI6ImdiMDAwYzc0LTEzMmMtZDBiMi02MGQzLTIwMjUwMzA2MTMzMyIsImlzcyI6Imh0dHBzOi8vaWRwLWludC5zZS5jb20vIiwic3ViIjoiYXV0aDB8NjdjOWE0MWQxNzQ3NTAwNWVlZmUzZjgyIiwiYXVkIjpbImh0dHBzOi8vY2lhbS1pbnQtYXBpLmNvbS8iLCJodHRwczovL2NpYW0taW50LnNlLW5vbnByb2QuYXV0aDBhcHAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc1MzUwNDQ3MiwiZXhwIjoxNzUzNTA2MjcyLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzIiwiYXpwIjoiVlZYT1hnbkNQOXByTDkzTE14Yjk3MHRuVGdtRG9odVMiLCJwZXJtaXNzaW9ucyI6W119.b-qk25fFZSZAUqdENi6_XZ5nRS73Cw-ByfuFFLmYM_Wl7z_sY2myDqik8lwvG3uaSIRi2M5HbU4LvfQv_IFcM5IPJB1XZcIBnfmx_OwehkaBLwLV-c-gKfVSjwZDN7E7304M2H4s6PfK72VUZmHHkkOmexbRwrZMGwXOwyOUVCe4242D8jmDIi_cJq7Sm2-IU7dpnC-kFt9Ay5Pqr8MFWB-V834sas936AhLnE2IGPFKapO0UGjt8PWoj-OLpb4YFkMuj9iiIbhEHpx596UXMtUbFdyRmzSFoLgECUYSau7D4v50SxvpPUeS7fJesQ3tgbSAqr4EAGBNDiDcOqk1WA"
  );
  await testUrl({
    url: "https://ppr.ecostruxure-energy-access-expert.se.app/overview",
    expected: "https://ppr.ecostruxure-energy-access-expert.se.app/overview",
    partialMatch: false,
    timeoutMs: 8000,
  });

  const adapter = ensureAdapter();

  // Wait for a key selector (e.g., heading or card) to ensure page loaded
  await adapter.waitForSelectorToBeVisible?.("text=Total Sites: 57", 10000);

  // Test key page metrics
  await testText({
    selector: "text=Total Sites: 57",
    expected: "Total Sites: 57",
  });

  await testText({
    selector: "text=396 alarms across 54 sites",
    expected: "396 alarms across 54 sites",
  });

  await testText({
    selector: "text=9203 beneficiaries of clean energy",
    expected: "9203 beneficiaries of clean energy",
  });

  await testCard({
    title: "Alarms",
    expectedValue: "396",
  });

  await testCard({
    title: "Warnings",
    expectedValue: "79",
  });

  await testCard({
    title: "Alerts",
    expectedValue: "12",
  });

  await testCard({
    title: "Segments",
    expectedValue: "8",
  });

  await testCard({
    title: "Partners",
    expectedValue: "24",
  });
}
