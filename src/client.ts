import {
  createWebSocket,
  WebSocketAdapter,
  WebSocketState,
} from "./websocket-adapter.js";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  WaveLinkClientOptions,
  ApplicationInfo,
  InputDevicesResult,
  OutputDevicesResult,
  ChannelsResult,
  MixesResult,
  SetInputDeviceParams,
  SetOutputDeviceParams,
  SetChannelParams,
  SetMixParams,
  AddToChannelParams,
  SetSubscriptionParams,
  EventName,
  EventCallback,
  WaveLinkEventMap,
  FocusedAppChangedParams,
  LevelMeterChangedParams,
} from "./types.js";

/**
 * Wave Link API Client
 *
 * Provides a typed interface for controlling Elgato Wave Link 3.0.
 */
export class WaveLinkClient {
  private ws: WebSocketAdapter | null = null;
  private requestId = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  >();
  private eventHandlers = new Map<string, Set<Function>>();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;

  private options: Required<WaveLinkClientOptions>;
  private currentPort: number = 1884;
  private readonly minPort: number = 1884;
  private readonly maxPort: number = 1893;
  private portAttempts: number = 0;
  private readonly maxPortAttempts: number = 60;

  constructor(options: WaveLinkClientOptions = {}) {
    this.options = {
      host: options.host || "127.0.0.1",
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelay: options.reconnectDelay || 2000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      origin: options.origin || "streamdeck://",
    };
  }

  /**
   * Connect to Wave Link
   * Automatically tries ports 1884-1893 until a connection is established
   */
  async connect(): Promise<void> {
    this.isManuallyDisconnected = false;

    // Reset port attempts on new connection attempt
    if (this.portAttempts === 0) {
      this.currentPort = this.minPort;
    }

    return this.tryConnect();
  }

  private async tryConnect(): Promise<void> {
    if (this.portAttempts >= this.maxPortAttempts) {
      const error = new Error(
        `Failed to connect to Wave Link after ${this.maxPortAttempts} attempts. ` +
          `Tried ports ${this.minPort}-${this.maxPort}. ` +
          `Make sure Wave Link is running.`,
      );
      this.emit("error", error);
      throw error;
    }

    const url = `ws://${this.options.host}:${this.currentPort}`;

    try {
      this.ws = await createWebSocket(url, {
        origin: this.options.origin,
      });

      // Connection successful!
      this.reconnectAttempts = 0;
      this.portAttempts = 0;

      // Set up event handlers
      this.ws.addEventListener("message", (event: any) => {
        const data = event.data || event;
        this.handleMessage(typeof data === "string" ? data : data.toString());
      });

      this.ws.addEventListener("close", () => {
        this.handleDisconnect();
      });

      this.ws.addEventListener("error", (error: any) => {
        this.emit(
          "error",
          error instanceof Error ? error : new Error(String(error)),
        );
      });

      this.emit("connected");
    } catch (error) {
      // Connection failed, try next port
      this.portAttempts++;

      // Move to next port
      if (this.currentPort >= this.maxPort) {
        this.currentPort = this.minPort;
      } else {
        this.currentPort++;
      }

      // If we've cycled back to the starting port, emit an error
      if (this.currentPort === this.minPort && this.portAttempts > 0) {
        const cycleError = new Error(
          `Failed to connect on ports ${this.minPort}-${this.maxPort}. ` +
            `Attempt ${Math.floor(this.portAttempts / (this.maxPort - this.minPort + 1)) + 1}. ` +
            `Retrying...`,
        );
        this.emit("error", cycleError);
      }

      // Try the next port
      return this.tryConnect();
    }
  }

  /**
   * Disconnect from Wave Link
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocketState.OPEN;
  }

  /**
   * Add event listener
   */
  on<E extends EventName>(event: E, callback: EventCallback<E>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off<E extends EventName>(event: E, callback: EventCallback<E>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(callback);
    }
  }

  /**
   * Remove all event listeners for an event
   */
  removeAllListeners(event?: EventName): void {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }

  private emit<E extends EventName>(
    event: E,
    ...args: WaveLinkEventMap[E]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  private handleDisconnect(): void {
    this.ws = null;
    this.emit("disconnected");

    // Reject all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error("Connection closed"));
    });
    this.pendingRequests.clear();

    // Auto-reconnect if enabled
    if (
      this.options.autoReconnect &&
      !this.isManuallyDisconnected &&
      this.reconnectAttempts < this.options.maxReconnectAttempts
    ) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch((error) => {
          this.emit("error", error);
        });
      }, this.options.reconnectDelay);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Check if it's a response or notification
      if ("id" in message) {
        // Response
        this.handleResponse(message as JsonRpcResponse);
      } else {
        // Notification
        this.handleNotification(message as JsonRpcNotification);
      }
    } catch (error) {
      this.emit(
        "error",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (pending) {
      this.pendingRequests.delete(response.id);

      if (response.error) {
        pending.reject(new Error(response.error.message));
      } else {
        pending.resolve(response.result);
      }
    }
  }

  private handleNotification(notification: JsonRpcNotification): void {
    const { method, params } = notification;

    // Emit specific event
    switch (method) {
      case "inputDevicesChanged":
        this.emit("inputDevicesChanged", params as InputDevicesResult);
        break;
      case "inputDeviceChanged":
        this.emit("inputDeviceChanged", params as Partial<any>);
        break;
      case "outputDevicesChanged":
        if (Array.isArray(params)) {
          this.emit("outputDevicesChanged", {
            mainOutput: params[0],
            outputDevices: params[1],
          });
        }
        break;
      case "outputDeviceChanged":
        this.emit("outputDeviceChanged", params as Partial<any>);
        break;
      case "channelsChanged":
        this.emit("channelsChanged", params as ChannelsResult);
        break;
      case "channelChanged":
        this.emit("channelChanged", params as Partial<any>);
        break;
      case "mixesChanged":
        this.emit("mixesChanged", params as MixesResult);
        break;
      case "mixChanged":
        this.emit("mixChanged", params as Partial<any>);
        break;
      case "levelMeterChanged":
        if (Array.isArray(params)) {
          this.emit("levelMeterChanged", {
            inputs: params[0],
            outputs: params[1],
            channels: params[2],
            mixes: params[3],
          });
        }
        break;
      case "focusedAppChanged":
        if (Array.isArray(params)) {
          this.emit("focusedAppChanged", {
            appId: params[0],
            appName: params[1],
            channel: params[2],
          });
        }
        break;
    }

    // Emit generic notification event
    this.emit("notification", method, params);
  }

  private async call<T>(method: string, params: unknown = null): Promise<T> {
    if (!this.isConnected()) {
      throw new Error("Not connected to Wave Link");
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      id,
      jsonrpc: "2.0",
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(request));
    });
  }

  // API Methods

  /**
   * Get application information
   */
  async getApplicationInfo(): Promise<ApplicationInfo> {
    return this.call<ApplicationInfo>("getApplicationInfo", null);
  }

  /**
   * Get all input devices
   */
  async getInputDevices(): Promise<InputDevicesResult> {
    return this.call<InputDevicesResult>("getInputDevices", null);
  }

  /**
   * Get all output devices
   */
  async getOutputDevices(): Promise<OutputDevicesResult> {
    return this.call<OutputDevicesResult>("getOutputDevices", null);
  }

  /**
   * Get all channels
   */
  async getChannels(): Promise<ChannelsResult> {
    return this.call<ChannelsResult>("getChannels", null);
  }

  /**
   * Get all mixes
   */
  async getMixes(): Promise<MixesResult> {
    return this.call<MixesResult>("getMixes", null);
  }

  /**
   * Set input device properties
   */
  async setInputDevice(params: SetInputDeviceParams): Promise<void> {
    await this.call("setInputDevice", params);
  }

  /**
   * Set output device properties
   */
  async setOutputDevice(params: SetOutputDeviceParams): Promise<void> {
    await this.call("setOutputDevice", params);
  }

  /**
   * Set channel properties
   */
  async setChannel(params: SetChannelParams): Promise<void> {
    await this.call("setChannel", params);
  }

  /**
   * Set mix properties
   */
  async setMix(params: SetMixParams): Promise<void> {
    await this.call("setMix", params);
  }

  /**
   * Add application to channel
   */
  async addToChannel(params: AddToChannelParams): Promise<void> {
    await this.call("addToChannel", params);
  }

  /**
   * Subscribe to notifications
   */
  async setSubscription(params: SetSubscriptionParams): Promise<unknown> {
    return this.call("setSubscription", params);
  }

  // Convenience Methods

  /**
   * Mute or unmute a channel
   */
  async setChannelMute(channelId: string, isMuted: boolean): Promise<void> {
    await this.setChannel({ id: channelId, isMuted });
  }

  /**
   * Set channel volume (0.0 - 1.0)
   */
  async setChannelVolume(channelId: string, level: number): Promise<void> {
    await this.setChannel({ id: channelId, level });
  }

  /**
   * Set channel volume for specific mix
   */
  async setChannelMixVolume(
    channelId: string,
    mixId: string,
    level: number,
  ): Promise<void> {
    await this.setChannel({
      id: channelId,
      mixes: [{ id: mixId, level }],
    });
  }

  /**
   * Mute or unmute a channel in specific mix
   */
  async setChannelMixMute(
    channelId: string,
    mixId: string,
    isMuted: boolean,
  ): Promise<void> {
    await this.setChannel({
      id: channelId,
      mixes: [{ id: mixId, isMuted }],
    });
  }

  /**
   * Toggle channel mute
   */
  async toggleChannelMute(channelId: string): Promise<void> {
    const { channels } = await this.getChannels();
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      await this.setChannelMute(channelId, !channel.isMuted);
    }
  }

  /**
   * Set mix master volume (0.0 - 1.0)
   */
  async setMixVolume(mixId: string, level: number): Promise<void> {
    await this.setMix({ id: mixId, level });
  }

  /**
   * Mute or unmute a mix
   */
  async setMixMute(mixId: string, isMuted: boolean): Promise<void> {
    await this.setMix({ id: mixId, isMuted });
  }

  /**
   * Toggle mix mute
   */
  async toggleMixMute(mixId: string): Promise<void> {
    const { mixes } = await this.getMixes();
    const mix = mixes.find((m) => m.id === mixId);
    if (mix) {
      await this.setMixMute(mixId, !mix.isMuted);
    }
  }

  /**
   * Set input device gain (0.0 - 1.0)
   */
  async setInputGain(
    deviceId: string,
    inputId: string,
    value: number,
  ): Promise<void> {
    await this.setInputDevice({
      id: deviceId,
      inputs: [{ id: inputId, gain: { value, maxRange: 0 } }],
    });
  }

  /**
   * Mute or unmute input device
   */
  async setInputMute(
    deviceId: string,
    inputId: string,
    isMuted: boolean,
  ): Promise<void> {
    await this.setInputDevice({
      id: deviceId,
      inputs: [{ id: inputId, isMuted }],
    });
  }

  /**
   * Set output device volume (0.0 - 1.0)
   */
  async setOutputVolume(
    deviceId: string,
    outputId: string,
    level: number,
  ): Promise<void> {
    await this.setOutputDevice({
      outputDevice: {
        id: deviceId,
        outputs: [{ id: outputId, level }],
      },
    });
  }

  /**
   * Switch output to different mix
   */
  async switchOutputMix(
    deviceId: string,
    outputId: string,
    mixId: string,
  ): Promise<void> {
    await this.setOutputDevice({
      outputDevice: {
        id: deviceId,
        outputs: [{ id: outputId, mixId }],
      },
    });
  }

  /**
   * Remove output from all mixes (sets mixId to empty string)
   */
  async removeOutputFromMix(
    deviceId: string,
    outputId: string,
  ): Promise<void> {
    await this.setOutputDevice({
      outputDevice: {
        id: deviceId,
        outputs: [{ id: outputId, mixId: "" }],
      },
    });
  }

  /**
   * Subscribe to focused app changes
   */
  async subscribeFocusedApp(enabled = true): Promise<void> {
    await this.setSubscription({
      focusedAppChanged: { isEnabled: enabled },
    });
  }

  /**
   * Subscribe to level meter changes
   */
  async subscribeLevelMeter(
    type: "input" | "output" | "channel" | "mix",
    id: string,
    enabled = true,
  ): Promise<void> {
    await this.setSubscription({
      levelMeterChanged: { type, id, isEnabled: enabled },
    });
  }
}
