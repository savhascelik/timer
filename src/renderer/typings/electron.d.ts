/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface ElectronApi {
  sendMessage: (message: string) => void,
  zamanEkle: (data: {id: number, zaman: number, mesaj: string}) => void,
  zamanlayiciSil: (id: number) => void, 
  onBildirim: (callback: (mesaj: string) => void) => void,
  zamanlayicilariGetir: () => void,
  onZamanlayicilar: (callback: (zamanlayicilar: Array<{id: number, zaman: number, mesaj: string}>) => void) => void,
  onZamanlayiciSilindi: (callback: (id: number) => void) => void,
  onZamanlayiciEklendi: (callback: (zamanlayici: {id: number, zaman: number, mesaj: string}) => void) => void,
  bildirimKapat: () => void,
  alarmGunlugunuGetir: () => void,
  alarmGunlugunuTemizle: () => void,
  onAlarmGunlugu: (callback: (gunluk: Array<{id: number, mesaj: string, zaman: number}>) => void) => void,
  onAlarmGunluguGuncellendi: (callback: (gunluk: Array<{id: number, mesaj: string, zaman: number}>) => void) => void,
  minimizeWindow: () => void,
  maximizeWindow: () => void,
  closeWindow: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronApi,
    process: {
      platform: string
    }
  }
}
