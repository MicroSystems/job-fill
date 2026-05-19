interface BrowserRuntimeOnMessage {
  addListener(
    cb: (
      message: any,
      sender: any,
      sendResponse: (response?: any) => void,
    ) => void | Promise<any>,
  ): void;
  removeListener(cb: (...args: any[]) => void): void;
}

declare namespace browser {
  namespace runtime {
    const onInstalled: { addListener(cb: () => void): void };
    const onMessage: BrowserRuntimeOnMessage;
    function sendMessage(message: any): Promise<any>;
    function getURL(path: string): string;
  }
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      active?: boolean;
      currentWindow?: boolean;
    }
    function query(queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
      url?: string[];
    }): Promise<Tab[]>;
    function sendMessage(tabId: number, message: any): Promise<any>;
    function create(createProperties: { url?: string; active?: boolean }): Promise<Tab>;
  }
  namespace windows {
    function create(createData: {
      url?: string;
      type?: "normal" | "popup" | "panel";
      width?: number;
      height?: number;
      titlePreface?: string;
    }): Promise<Window>;
    interface Window {
      id?: number;
    }
  }
  namespace storage {
    namespace local {
      function get(keys?: string | string[] | Record<string, any> | null): Promise<Record<string, any>>;
      function set(items: Record<string, any>): Promise<void>;
      function remove(keys: string | string[]): Promise<void>;
    }
  }
}
