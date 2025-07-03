// This is a custom resolver for @stellar/freighter-api
// It exports the CommonJS module as ESM-compatible exports
import freighterApi from '@stellar/freighter-api/build/index.js';

export const isConnected = freighterApi.isConnected;
export const requestAccess = freighterApi.requestAccess;
export const getAddress = freighterApi.getAddress;
export const signTransaction = freighterApi.signTransaction;
export const signAuthEntry = freighterApi.signAuthEntry;
export const signMessage = freighterApi.signMessage;
export const getNetwork = freighterApi.getNetwork; 