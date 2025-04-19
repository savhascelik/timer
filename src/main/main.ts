import {app, BrowserWindow, ipcMain, session, screen, Tray, Menu, nativeImage} from 'electron';
import {join} from 'path';
import * as path from 'path';
import * as fs from 'fs';

// Node-notifier'ı import et
const notifier = require('node-notifier');

// isQuitting özelliğini app nesnesine ekle
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

// Zamanlayıcıları saklamak için bir nesne
interface Zamanlayici {
  id: number;
  zaman: number;
  mesaj: string;
  timeoutId?: NodeJS.Timeout;
}

// Alarm geçmişi için arayüz
interface AlarmKaydi {
  id: number;
  mesaj: string;
  zaman: number;  // Gösterilme zamanı
}

// İlk olarak, isQuitting özelliğini tanımla
app.isQuitting = false;

const zamanlayicilar: Map<number, Zamanlayici> = new Map();
let enYuksekId = 0;
let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

// Alarm günlüğü için değişkenler
const alarmGunlugu: AlarmKaydi[] = [];
let alarmSayaci = 0;
const alarmGunluguDosyaYolu = path.join(app.getPath('userData'), 'alarm_gunlugu.json');

// Veri dosyasının yolu
const veriDosyasiYolu = path.join(app.getPath('userData'), 'zamanlayicilar.json');

// Uygulama ilk açılışta mı
let ilkAcilis = true;

// Zamanlayıcıları dosyadan yükle
function zamanlayicilariYukle() {
  try {
    if (fs.existsSync(veriDosyasiYolu)) {
      const veri = fs.readFileSync(veriDosyasiYolu, 'utf-8');
      const kaydedilenZamanlayicilar: Array<{id: number, zaman: number, mesaj: string}> = JSON.parse(veri);
      
      kaydedilenZamanlayicilar.forEach(z => {
        if (z.id > enYuksekId) {
          enYuksekId = z.id;
        }
        
        // Zamanlayıcıyı ayarla
        const simdi = new Date().getTime();
        if (z.zaman > simdi) {
          zamanlamaEkle(z);
        }
      });
      
      console.log(`${kaydedilenZamanlayicilar.length} zamanlayıcı yüklendi.`);
    }
  } catch (err) {
    console.error('Zamanlayıcılar yüklenirken hata oluştu:', err);
  }
}

// Alarm günlüğünü dosyadan yükle
function alarmGunlugunuYukle() {
  try {
    if (fs.existsSync(alarmGunluguDosyaYolu)) {
      const veri = fs.readFileSync(alarmGunluguDosyaYolu, 'utf-8');
      const kayitlar = JSON.parse(veri) as AlarmKaydi[];
      
      // Geçmiş alarmları yükle
      alarmGunlugu.push(...kayitlar);
      
      // En yüksek ID'yi bul
      if (kayitlar.length > 0) {
        alarmSayaci = Math.max(...kayitlar.map(k => k.id)) + 1;
      }
      
      console.log(`${kayitlar.length} alarm kaydı yüklendi.`);
    }
  } catch (err) {
    console.error('Alarm günlüğü yüklenirken hata oluştu:', err);
  }
}

// Alarm günlüğünü dosyaya kaydet
function alarmGunlugunuKaydet() {
  try {
    fs.writeFileSync(alarmGunluguDosyaYolu, JSON.stringify(alarmGunlugu), 'utf-8');
    console.log(`${alarmGunlugu.length} alarm kaydı kaydedildi.`);
  } catch (err) {
    console.error('Alarm günlüğü kaydedilirken hata oluştu:', err);
  }
}

// Alarm günlüğüne yeni bir kayıt ekle
function alarmGunluguneEkle(mesaj: string) {
  const yeniKayit: AlarmKaydi = {
    id: alarmSayaci++,
    mesaj,
    zaman: new Date().getTime()
  };
  
  alarmGunlugu.push(yeniKayit);
  alarmGunlugunuKaydet();
  
  // Ana pencereye bildir
  if (mainWindow) {
    mainWindow.webContents.send('alarm-gunlugu-guncellendi', alarmGunlugu);
  }
}

// Zamanlayıcıları dosyaya kaydet
function zamanlayicilariKaydet() {
  try {
    const kaydedilecekZamanlayicilar: Array<{id: number, zaman: number, mesaj: string}> = [];
    
    zamanlayicilar.forEach(z => {
      kaydedilecekZamanlayicilar.push({
        id: z.id,
        zaman: z.zaman,
        mesaj: z.mesaj
      });
    });
    
    fs.writeFileSync(veriDosyasiYolu, JSON.stringify(kaydedilecekZamanlayicilar), 'utf-8');
    console.log(`${kaydedilecekZamanlayicilar.length} zamanlayıcı kaydedildi.`);
  } catch (err) {
    console.error('Zamanlayıcılar kaydedilirken hata oluştu:', err);
  }
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#f9f9f9',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#333333',
      height: 40
    },
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Yükleme tamamlanana kadar gösterme
    frame: process.platform === 'darwin', // macOS'ta frame göster, Windows ve Linux'ta özel çerçeve kullan
    icon: path.join(__dirname, '../static/icon.png')
  });

  // Yükleme tamamlandığında pencereyi göster
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
    // Geliştirme modunda devtools'u aç
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }
  
  // Pencere kapatıldığında tamamen kapatma
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
    }
    return true;
  });
  
  return mainWindow;
}

function createTray() {
  // Tepsi ikonu oluştur
  const iconPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../static/icon.png')
    : path.join(process.resourcesPath, 'static/icon.png');
  
  // Eğer ikon yoksa varsayılan bir ikon oluştur
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch (error) {
    icon = nativeImage.createEmpty();
  }
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Aç',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Aktif Zamanlayıcılar',
      click: () => {
        // Aktif zamanlayıcı sayısını göster
        notifier.notify({
          title: 'Zamanlayıcı Durumu',
          message: `${zamanlayicilar.size} aktif zamanlayıcı bulunuyor.`
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Zamanlayıcı Uygulaması');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

function bildirimGoster(mainWindow: BrowserWindow | null, mesaj: string) {
  // Ekran boyutlarını al
  const {width, height} = screen.getPrimaryDisplay().workAreaSize;
  
  // Bildirim penceresi oluştur
  const bildirimPenceresi = new BrowserWindow({
    width: 300,
    height: 100,
    frame: false,
    transparent: true,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  });
  
  // Ses dosyasının yolunu belirle
  const sesDosyasi = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../static/notification.mp3')
    : path.join(process.resourcesPath, 'static/notification.mp3');
  
  // HTML içeriğini oluştur
  const bildirimHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          overflow: hidden;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 8px;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }
        .bildirim-icerik {
          padding: 15px;
          text-align: center;
        }
        .kapat-btn {
          position: absolute;
          top: 5px;
          right: 10px;
          background: none;
          border: none;
          color: #ccc;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          font-size: 18px;
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .kapat-btn:hover {
          color: white;
          background-color: rgba(255, 255, 255, 0.1);
        }
      </style>
    </head>
    <body>
      <button class="kapat-btn" id="kapat-btn">×</button>
      <div class="bildirim-icerik">
        <p>${mesaj}</p>
      </div>
      <script>
        // Kapanma düğmesini daha güvenilir hale getir
        document.getElementById('kapat-btn').addEventListener('click', () => {
          window.close();
        });
        
        // Ses çal
        try {
          const audio = new Audio('${sesDosyasi.replace(/\\/g, '/')}');
          audio.play().catch(e => console.error('Ses çalınamadı:', e));
        } catch (err) {
          console.error('Ses çalma hatası:', err);
        }
        
        // 10 saniye sonra otomatik kapat
        setTimeout(() => window.close(), 10000);
      </script>
    </body>
    </html>
  `;
  
  // Geçici HTML dosyası oluştur
  const tempPath = path.join(app.getPath('temp'), 'bildirim.html');
  fs.writeFileSync(tempPath, bildirimHTML);
  
  bildirimPenceresi.loadFile(tempPath);
  
  // IPC ile kapatma işlemleri için destek ekle
  ipcMain.once('bildirim-kapat', () => {
    if (!bildirimPenceresi.isDestroyed()) {
      bildirimPenceresi.close();
    }
  });
  
  // Sistem bildirimiyle birlikte ses çal
  notifier.notify({
    title: 'Zamanlayıcı Bildirimi',
    message: mesaj,
    sound: true
  });
  
  // Önceki bildirimi ana pencereye gönder
  if (mainWindow) {
    mainWindow.webContents.send('bildirim', mesaj);
  }
  
  // Alarm günlüğüne kaydet
  alarmGunluguneEkle(mesaj);
}

// Zamanlayıcı ekleme işlevi
function zamanlamaEkle(data: {id: number, zaman: number, mesaj: string}) {
  const {id, zaman, mesaj} = data;
  
  // Şu anki zaman ile hedef zaman arasındaki farkı hesapla (ms)
  const simdi = new Date().getTime();
  const kalanSure = zaman - simdi;
  
  // Eğer kalan süre pozitifse, zamanlayıcı ayarla
  if (kalanSure > 0) {
    // setTimeout ile zamanlayıcı ayarla
    const timeoutId = setTimeout(() => {
      // Bildirim göster
      bildirimGoster(mainWindow, mesaj);
      
      // Zamanlayıcıyı kaldır
      zamanlayicilar.delete(id);
      
      // Zamanlayıcıları kaydet
      zamanlayicilariKaydet();
      
      // Eğer ana pencere açıksa, zamanlayıcının silindiğine dair bildir
      if (mainWindow) {
        mainWindow.webContents.send('zamanlayici-silindi', id);
      }
    }, kalanSure);
    
    // Zamanlayıcıyı kaydet
    zamanlayicilar.set(id, {id, zaman, mesaj, timeoutId});
    
    // Zamanlayıcıları kaydet
    zamanlayicilariKaydet();
  }
}

// Sistem başlangıcında otomatik başlatma
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true
});

// Uygulama hazır olduğunda
app.whenReady().then(() => {
  // Tepsi ikonu oluştur
  createTray();
  
  // Pencere oluştur
  createWindow();
  
  // Zamanlayıcıları yükle
  zamanlayicilariYukle();
  
  // Alarm günlüğünü yükle
  alarmGunlugunuYukle();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'']
      }
    })
  })

  // Pencere kontrol işlevleri
  ipcMain.on('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('close-window', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  // Zamanlayıcı ekle
  ipcMain.on('zaman-ekle', (_event, data: Zamanlayici) => {
    // ID'yi güncelle
    enYuksekId++;
    const yeniData = {
      id: enYuksekId,
      zaman: data.zaman,
      mesaj: data.mesaj
    };
    
    zamanlamaEkle(yeniData);
    
    // Eklendiğine dair bildirim gönder
    if (mainWindow) {
      mainWindow.webContents.send('zamanlayici-eklendi', {
        id: enYuksekId,
        zaman: data.zaman,
        mesaj: data.mesaj
      });
    }
  });
  
  // Zamanlayıcı sil
  ipcMain.on('zamanlayici-sil', (_event, id: number) => {
    const zamanlayici = zamanlayicilar.get(id);
    if (zamanlayici && zamanlayici.timeoutId) {
      clearTimeout(zamanlayici.timeoutId);
      zamanlayicilar.delete(id);
      
      // Zamanlayıcıları kaydet
      zamanlayicilariKaydet();
    }
  });
  
  // Tüm zamanlayıcıları getir
  ipcMain.on('zamanlayicilari-getir', (event) => {
    const aktifZamanlayicilar: Array<{id: number, zaman: number, mesaj: string}> = [];
    
    zamanlayicilar.forEach(z => {
      aktifZamanlayicilar.push({
        id: z.id,
        zaman: z.zaman,
        mesaj: z.mesaj
      });
    });
    
    event.reply('zamanlayicilar', aktifZamanlayicilar);
  });
  
  // Alarm günlüğünü getir
  ipcMain.on('alarm-gunlugunu-getir', (event) => {
    event.reply('alarm-gunlugu', alarmGunlugu);
  });
  
  // Alarm günlüğünü temizle
  ipcMain.on('alarm-gunlugunu-temizle', () => {
    alarmGunlugu.length = 0;
    alarmGunlugunuKaydet();
    
    // Ana pencereye bildir
    if (mainWindow) {
      mainWindow.webContents.send('alarm-gunlugu-guncellendi', alarmGunlugu);
    }
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  // Uygulama çıkışında
  app.on('before-quit', () => {
    app.isQuitting = true;
  });
});

app.on('window-all-closed', function () {
  // Tüm pencereler kapandığında uygulamayı kapatma
  // Sistem tepsisinde çalışmaya devam edecek
  if (process.platform !== 'darwin') {
    // Sadece macOS'ta uygulamayı tamamen kapatma
    // app.quit()
  }
});

ipcMain.on('message', (event, message) => {
  console.log(message);
})