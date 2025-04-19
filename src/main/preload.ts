import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  zamanEkle: (data: {id: number, zaman: number, mesaj: string}) => 
    ipcRenderer.send('zaman-ekle', data),
  zamanlayiciSil: (id: number) => ipcRenderer.send('zamanlayici-sil', id),
  onBildirim: (callback: (mesaj: string) => void) => 
    ipcRenderer.on('bildirim', (_event, mesaj) => callback(mesaj)),
  zamanlayicilariGetir: () => ipcRenderer.send('zamanlayicilari-getir'),
  onZamanlayicilar: (callback: (zamanlayicilar: Array<{id: number, zaman: number, mesaj: string}>) => void) =>
    ipcRenderer.on('zamanlayicilar', (_event, zamanlayicilar) => callback(zamanlayicilar)),
  onZamanlayiciSilindi: (callback: (id: number) => void) =>
    ipcRenderer.on('zamanlayici-silindi', (_event, id) => callback(id)),
  onZamanlayiciEklendi: (callback: (zamanlayici: {id: number, zaman: number, mesaj: string}) => void) =>
    ipcRenderer.on('zamanlayici-eklendi', (_event, zamanlayici) => callback(zamanlayici)),
  bildirimKapat: () => ipcRenderer.send('bildirim-kapat'),
  alarmGunlugunuGetir: () => ipcRenderer.send('alarm-gunlugunu-getir'),
  alarmGunlugunuTemizle: () => ipcRenderer.send('alarm-gunlugunu-temizle'),
  onAlarmGunlugu: (callback: (gunluk: Array<{id: number, mesaj: string, zaman: number}>) => void) =>
    ipcRenderer.on('alarm-gunlugu', (_event, gunluk) => callback(gunluk)),
  onAlarmGunluguGuncellendi: (callback: (gunluk: Array<{id: number, mesaj: string, zaman: number}>) => void) =>
    ipcRenderer.on('alarm-gunlugu-guncellendi', (_event, gunluk) => callback(gunluk)),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window')
})

// Process bilgisini global olarak paylaş
contextBridge.exposeInMainWorld('process', {
  platform: process.platform
});
