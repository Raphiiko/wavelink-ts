/**
 * Elgato Wave Link 3.0 API Types
 */

export interface JsonRpcRequest {
  id: number;
  jsonrpc: "2.0";
  method: string;
  params: unknown;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// Application Info
export interface ApplicationInfo {
  appID: string;
  name: string;
  interfaceRevision: number;
}

// Input Devices
export interface InputDevice {
  id: string;
  name: string;
  isWaveDevice: boolean;
  inputs: Input[];
}

export interface Input {
  id: string;
  name: string;
  isMuted: boolean;
  isGainLockOn?: boolean;
  gain: {
    value: number;
    min?: number;
    max?: number;
    maxRange?: number;
  };
  micPcMix?: {
    value: number;
    isInverted?: boolean;
  };
  effects?: Effect[];
  dspEffects?: Effect[];
}

export interface Effect {
  id: string;
  name: string;
  isEnabled: boolean;
}

export interface InputDevicesResult {
  inputDevices: InputDevice[];
}

// Output Devices
export interface OutputDevice {
  id: string;
  name: string;
  isWaveDevice: boolean;
  outputs: Output[];
}

export interface Output {
  id: string;
  name: string;
  level: number;
  isMuted: boolean;
  mixId: string;
}

export interface OutputDevicesResult {
  mainOutput: string;
  outputDevices: OutputDevice[];
}

// Channels
export interface Channel {
  id: string;
  name: string;
  type: "Software" | "Hardware";
  isMuted: boolean;
  level: number;
  image: {
    name: string;
    imgData?: string;
  };
  apps: App[];
  effects?: Effect[];
  mixes: ChannelMix[];
}

export interface App {
  id: string;
  name: string;
}

export interface ChannelMix {
  id: string;
  level: number;
  isMuted: boolean;
}

export interface ChannelsResult {
  channels: Channel[];
}

// Mixes
export interface Mix {
  id: string;
  name: string;
  level: number;
  isMuted: boolean;
  image: {
    name: string;
  };
}

export interface MixesResult {
  mixes: Mix[];
}

// Setter Params
export interface SetInputDeviceParams {
  id: string;
  inputs: Partial<Input>[];
}

export interface SetOutputDeviceParams {
  outputDevice: {
    id: string;
    outputs: Partial<Output>[];
  };
}

export interface SetChannelParams {
  id: string;
  isMuted?: boolean;
  level?: number;
  mixes?: Partial<ChannelMix>[];
  effects?: Effect[];
}

export interface SetMixParams {
  id: string;
  level?: number;
  isMuted?: boolean;
  mixId?: string;
}

export interface AddToChannelParams {
  appId: string;
  channelId: string;
}

// Subscriptions
export interface SetSubscriptionParams {
  focusedAppChanged?: {
    isEnabled: boolean;
  };
  levelMeterChanged?: {
    type: "input" | "output" | "channel" | "mix";
    id: string;
    subId?: string;
    isEnabled: boolean;
  };
}

// Notifications
export type NotificationCallback = (method: string, params: unknown) => void;

export interface FocusedAppChangedParams {
  appId: string;
  appName: string;
  channel: { id: string };
}

export interface LevelMeterChangedParams {
  inputs: unknown[];
  outputs: unknown[];
  channels: unknown[];
  mixes: unknown[];
}

// Connection Options
export interface WaveLinkClientOptions {
  host?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  origin?: string;
}

// Events
export type WaveLinkEventMap = {
  connected: [];
  disconnected: [];
  error: [Error];
  inputDevicesChanged: [InputDevicesResult];
  inputDeviceChanged: [Partial<InputDevice>];
  outputDevicesChanged: [{ mainOutput: string; outputDevices: OutputDevice[] }];
  outputDeviceChanged: [Partial<OutputDevice>];
  channelsChanged: [ChannelsResult];
  channelChanged: [Partial<Channel>];
  mixesChanged: [MixesResult];
  mixChanged: [Partial<Mix>];
  levelMeterChanged: [LevelMeterChangedParams];
  focusedAppChanged: [FocusedAppChangedParams];
  notification: [string, unknown];
};

export type EventName = keyof WaveLinkEventMap;
export type EventCallback<E extends EventName> = (...args: WaveLinkEventMap[E]) => void;
