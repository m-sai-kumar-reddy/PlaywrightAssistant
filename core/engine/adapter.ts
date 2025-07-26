export interface TestAdapter {
  click(sel: string): Promise<void>;
  fill(sel: string, val: string): Promise<void>;
  getText(sel: string): Promise<string>;
  getAttribute(sel: string, attr: string): Promise<string | null>;
  getStyle(sel: string, prop: string): Promise<string>;
  getCurrentUrl(): Promise<string>;
  navigate(url: string): Promise<void>;
  waitForSelectorToBeVisible?(
    selector: string,
    timeout?: number
  ): Promise<void>;
  getValue(selector: string): Promise<string>;
  waitForSelector(selector: string, timeout?: number): Promise<any>;
  getFrameContent(
    frameSelector: string,
    contentSelector: string
  ): Promise<string>;
  interceptNetwork(options: {
    url: string | RegExp;
    method?: string;
    status?: number;
    contentType?: string;
    mockData: any;
    injectHeaders?: Record<string, string>;
  }): Promise<void>;
  isVisible(selector: string): Promise<boolean>;
  getTextContent(selector: string): Promise<string>;
}
