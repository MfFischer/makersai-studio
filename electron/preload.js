// Preload script for Electron
// This file runs in the renderer process before web content loads
// It has access to both DOM APIs and Node.js APIs

const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,
});

