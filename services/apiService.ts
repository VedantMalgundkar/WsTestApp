// ledApi.ts
import { request } from "./apiInstance";

export type LedResponse = Record<string, any>;

// Get current LED brightness
export const getLedBrightness = (): Promise<LedResponse> =>
  request("/led/get-brightness", "GET");

// Get available LED effects
export const getLedEffects = (): Promise<LedResponse> =>
  request("/led/get-effects", "GET");

// Get current active input
export const getCurrentActiveInput = (): Promise<LedResponse> =>
  request("/led/get-active-signal", "GET");

// Apply a specific effect
export const applyEffect = (effect: string): Promise<LedResponse> =>
  request("/led/apply-effect", "POST", { effect: effect.trim() });

// Apply a custom color
export const applyColor = (colorArray: number[]): Promise<LedResponse> =>{
    console.log({colorArray});
    return request("/led/apply-color", "POST", { color: colorArray });
}

// Stop an effect by priority
export const stopEffect = (priority: number): Promise<LedResponse> =>
  request("/led/stop-effect", "POST", { priority });

// Adjust LED brightness
export const adjustLedBrightness = (brightness: number): Promise<LedResponse> =>
  request("/led/adjust-brightness", "POST", { brightness });
