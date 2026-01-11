/**
 * WebSocket adapter that works with both Node.js (ws library) and Bun (native WebSocket)
 */

// Check if we're running in Bun
const isBun = typeof (globalThis as any).Bun !== "undefined";

export interface WebSocketAdapter {
  send(data: string): void;
  close(): void;
  addEventListener(event: string, handler: (...args: any[]) => void): void;
  removeEventListener(event: string, handler: (...args: any[]) => void): void;
  readyState: number;
}

export interface WebSocketAdapterConstructor {
  new (url: string, options?: any): WebSocketAdapter;
  CONNECTING: number;
  OPEN: number;
  CLOSING: number;
  CLOSED: number;
}

/**
 * Create a WebSocket connection using the appropriate implementation
 */
export async function createWebSocket(
  url: string,
  options: { origin?: string } = {},
): Promise<WebSocketAdapter> {
  if (isBun) {
    // Use Bun's native WebSocket
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url, {
          headers: options.origin ? { Origin: options.origin } : undefined,
        });

        ws.addEventListener("open", () => resolve(ws as any));
        ws.addEventListener("error", (event) =>
          reject(new Error("WebSocket connection failed")),
        );
      } catch (error) {
        reject(error);
      }
    });
  } else {
    // Use Node.js ws library
    const { WebSocket: NodeWebSocket } = await import("ws");

    return new Promise((resolve, reject) => {
      try {
        const ws = new NodeWebSocket(url, {
          origin: options.origin,
        });

        // Wrap Node.js ws to match Web API
        const adapter: any = ws;

        // Node.js ws uses .on(), but we want .addEventListener() for consistency
        if (!adapter.addEventListener) {
          adapter.addEventListener = (event: string, handler: any) => {
            const nodeEvent = event === "message" ? "message" : event;
            ws.on(nodeEvent, handler);
          };

          adapter.removeEventListener = (event: string, handler: any) => {
            const nodeEvent = event === "message" ? "message" : event;
            ws.off(nodeEvent, handler);
          };
        }

        ws.on("open", () => resolve(adapter));
        ws.on("error", (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Get WebSocket state constants
 */
export const WebSocketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};
