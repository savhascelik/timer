import ElectronApi from './electron';

declare global {
  interface Window {
    electronAPI?: ElectronApi;
    process?: {
      platform: string;
    };
  }
}

export {}; 