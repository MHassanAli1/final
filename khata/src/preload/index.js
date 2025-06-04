// src/preload/index.js
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  auth: {
    register: (data) => ipcRenderer.invoke('auth:register', data),
    login: (data) => ipcRenderer.invoke('auth:login', data),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getSession: () => ipcRenderer.invoke('auth:getSession'),
    setSession: (session) => ipcRenderer.invoke('auth:setSession', session), // optional
  },
  transactions: {
    create: (data) => ipcRenderer.invoke('transactions:create', data),
    getLastEndingNumber: () => ipcRenderer.invoke('transactions:getLastEndingNumber'),
    getAll: () => ipcRenderer.invoke('transactions:getAll'),
    getById: (id) => ipcRenderer.invoke('transactions:getById', id),
    update: (payload) => ipcRenderer.invoke('transactions:update', payload),
    delete: (id) => ipcRenderer.invoke('transactions:delete', id),
    search: (query) => ipcRenderer.invoke('transactions:search', query),
    getOne: (id) => ipcRenderer.invoke('transaction:getOne', id),
  },
  akhrajat: {
    create: (data) => ipcRenderer.invoke('akhrajat:create', data),
    update: (data) => ipcRenderer.invoke('akhrajat:update', data),
    delete: (id) => ipcRenderer.invoke('akhrajat:delete', id),
  },
  trollies: {
    update: (data) => ipcRenderer.invoke('trollies:update', data),
    getByTransactionId: (id) => ipcRenderer.invoke('trollies:getByTransactionId', id),
  },
  sync: {
    transactions: () => ipcRenderer.invoke('sync:transactions'),
  },
  test: {
    ping: () => ipcRenderer.invoke('test:ping'),
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[Preload Error]', error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
