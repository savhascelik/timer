<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import TimerForm from './components/ZamanlayiciForm.vue';
import AlarmHistory from './components/AlarmGunlugu.vue';

const activeTab = ref('timer');
const isMaximized = ref(false);
const isPlatformDarwin = ref(false);

// ElectronAPI güvenlik kontrolü
const electronAPI = window.electronAPI;

// Pencere kontrolü işlevleri
function minimizeWindow() {
  if (electronAPI) {
    electronAPI.minimizeWindow();
  }
}

function maximizeWindow() {
  if (electronAPI) {
    electronAPI.maximizeWindow();
    isMaximized.value = !isMaximized.value;
  }
}

function closeWindow() {
  if (electronAPI) {
    electronAPI.closeWindow();
  }
}

// Şu anki zamanı göster
const currentTime = ref(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

// Her saniye zamanı güncelle
onMounted(() => {
  // Platform kontrolü
  if (window.process) {
    isPlatformDarwin.value = window.process.platform === 'darwin';
  }

  // Bildirim aldığında ekranda göster
  if (electronAPI) {
    electronAPI.onBildirim((mesaj: string) => {
      console.log('Notification received:', mesaj);
    });
    
    // Uygulama başlatma bildirimi
    electronAPI.sendMessage('App loaded!');
  }
  
  // Her saniye saati güncelle
  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, 1000);
});
</script>

<template>
  <div class="app-container">
    <!-- Pencere kontrol çubuğu -->
   
    
    <div class="sidebar">
      <div class="brand">
        <div class="logo">
          <div class="clock-icon">
            <div class="clock-face"></div>
            <div class="hour-hand"></div>
            <div class="minute-hand"></div>
          </div>
        </div>
        <h1 class="app-title">T<span class="highlight">imer</span></h1>
      </div>
      
      <nav class="menu">
        <button 
          class="menu-item" 
          :class="{ active: activeTab === 'timer' }" 
          @click="activeTab = 'timer'"
        >
          <span class="icon">⏰</span>
          <span class="text">Timer</span>
        </button>
        <button 
          class="menu-item" 
          :class="{ active: activeTab === 'history' }" 
          @click="activeTab = 'history'"
        >
          <span class="icon">📋</span>
          <span class="text">History</span>
        </button>
      </nav>
      
      <div class="sidebar-footer">
        <p>Version 1.0.0</p>
      </div>
    </div>
    
    <div class="content">
      <header class="content-header">
        <h2>{{ activeTab === 'timer' ? 'Set Timer' : 'Alarm History' }}</h2>
        <div class="current-time">
          {{ currentTime }}
        </div>
      </header>
      
      <main class="content-main">
        <transition name="fade" mode="out-in">
          <div v-if="activeTab === 'timer'" key="timer">
            <TimerForm />
          </div>
          <div v-else-if="activeTab === 'history'" key="history">
            <AlarmHistory />
          </div>
        </transition>
      </main>
    </div>
  </div>
</template>

<style>
:root {
  --primary-color: #4361ee;
  --primary-light: #4895ef;
  --secondary-color: #3f37c9;
  --text-color: #333;
  --text-light: #666;
  --bg-color: #f9f9f9;
  --sidebar-bg: #4361ee;
  --sidebar-text: #fff;
  --card-bg: #fff;
  --border-radius: 10px;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  flex-direction: column;
}

/* Pencere Kontrol Çubuğu */
.window-controls {
  display: flex;
  justify-content: space-between;
  height: 40px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  -webkit-app-region: drag; /* Sürüklenebilir alan */
  user-select: none;
  z-index: 1000;
}

.app-draggable-area {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 15px;
}

.window-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.window-buttons {
  display: flex;
  -webkit-app-region: no-drag; /* Sürüklenemez düğmeler */
}

.window-button {
  width: 46px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  outline: none;
}

.window-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.window-button.close:hover {
  background-color: #e81123;
  color: white;
}

.window-button .icon {
  font-size: 14px;
}

/* Ana İçerik */
.app-container {
  display: flex;
  flex-direction: row;
  height: calc(100vh - 40px);
  margin-top: 40px;
}

/* Kenar çubuğu stilleri */
.sidebar {
  width: 250px;
  background: linear-gradient(145deg, var(--primary-color), var(--secondary-color));
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-shadow: var(--shadow);
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
}

.logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clock-icon {
  position: relative;
  width: 32px;
  height: 32px;
  background-color: #fff;
  border-radius: 50%;
}

.clock-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.hour-hand, .minute-hand {
  position: absolute;
  background-color: #333;
  transform-origin: center bottom;
  border-radius: 10px;
}

.hour-hand {
  width: 2px;
  height: 10px;
  top: 6px;
  left: 15px;
  transform: rotate(45deg);
}

.minute-hand {
  width: 2px;
  height: 12px;
  top: 4px;
  left: 15px;
  transform: rotate(90deg);
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
}

.highlight {
  font-weight: 300;
}

.menu {
  margin-top: 30px;
  padding: 0 15px;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 8px;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  font-size: 16px;
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-item.active {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
}

.icon {
  margin-right: 10px;
  font-size: 18px;
}

.sidebar-footer {
  margin-top: auto;
  text-align: center;
  padding: 20px;
  font-size: 12px;
  opacity: 0.7;
}

/* Ana içerik alanı stilleri */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.content-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
}

.current-time {
  font-size: 24px;
  font-weight: 300;
  color: var(--primary-color);
}

.content-main {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* Bileşenleri güncelle */
.zamanlayici-form, .alarm-gunlugu {
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 25px;
}

.zamanlayici-form h2, .alarm-gunlugu h2 {
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
  color: var(--primary-color);
}

.form-group label {
  color: var(--text-light);
  font-size: 15px;
}

.ekle-btn, .temizle-btn {
  border-radius: 50px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: var(--transition);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.ekle-btn {
  background: linear-gradient(to right, var(--primary-color), var(--primary-light));
}

.ekle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Geçiş animasyonları */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive tasarım için medya sorguları */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    padding: 10px 0;
  }
  
  .menu {
    display: flex;
    overflow-x: auto;
    margin-top: 10px;
    padding: 0 10px;
  }
  
  .menu-item {
    flex-shrink: 0;
    width: auto;
    margin-right: 10px;
    margin-bottom: 0;
  }
  
  .sidebar-footer {
    display: none;
  }
}
</style>
