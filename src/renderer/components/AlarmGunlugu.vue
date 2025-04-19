<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface AlarmKaydi {
  id: number;
  mesaj: string;
  zaman: number;
}

const alarmKayitlari = ref<AlarmKaydi[]>([]);
const yukleniyor = ref(true);
const filtreMetni = ref('');

onMounted(() => {
  // Alarm günlüğünü getir
  window.electronAPI.alarmGunlugunuGetir();
  
  // Alarm günlüğü geldiğinde
  window.electronAPI.onAlarmGunlugu((gunluk) => {
    alarmKayitlari.value = gunluk.sort((a, b) => b.zaman - a.zaman); // En son alarmlar üstte
    yukleniyor.value = false;
  });
  
  // Alarm günlüğü güncellendiğinde
  window.electronAPI.onAlarmGunluguGuncellendi((gunluk) => {
    alarmKayitlari.value = gunluk.sort((a, b) => b.zaman - a.zaman); // En son alarmlar üstte
  });
});

function gunluguTemizle() {
  if (confirm('Are you sure you want to clear the alarm history?')) {
    window.electronAPI.alarmGunlugunuTemizle();
  }
}

// Tarih formatını düzenle
function tarihFormatla(timestamp: number): string {
  const tarih = new Date(timestamp);
  return tarih.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Filtreleme işlevi
function filtrelenmisKayitlar() {
  if (!filtreMetni.value.trim()) {
    return alarmKayitlari.value;
  }
  
  const aranan = filtreMetni.value.trim().toLowerCase();
  return alarmKayitlari.value.filter(kayit => 
    kayit.mesaj.toLowerCase().includes(aranan) || 
    tarihFormatla(kayit.zaman).toLowerCase().includes(aranan)
  );
}
</script>

<template>
  <div>
    <div class="alarm-gunlugu">
      <div class="gunluk-header">
        <div class="baslik-bolumu">
          <h3>Alarm History</h3>
          <div class="rozet" v-if="alarmKayitlari.length > 0">{{ alarmKayitlari.length }}</div>
        </div>
        
        <div class="toolbar">
          <div class="arama-kutusu">
            <span class="arama-ikonu">🔍</span>
            <input 
              type="text" 
              v-model="filtreMetni"
              placeholder="Search alarms..." 
              class="arama-girdi"
            />
          </div>
          
          <button 
            v-if="alarmKayitlari.length > 0" 
            @click="gunluguTemizle" 
            class="temizle-btn"
            title="Clear all alarm history"
          >
            <span class="btn-icon">🗑️</span>
            <span class="btn-text">Clear</span>
          </button>
        </div>
      </div>
      
      <div class="gunluk-content">
        <div v-if="yukleniyor" class="yukleniyor">
          <div class="spinner"></div>
          <p>Loading history...</p>
        </div>
        
        <div v-else-if="alarmKayitlari.length === 0" class="bos-gunluk">
          <div class="bos-ikon">📅</div>
          <p class="bos-mesaj">No alarm records yet.</p>
          <p class="bos-aciklama">When you create your first alarm, it will be listed here.</p>
        </div>
        
        <div v-else-if="filtrelenmisKayitlar().length === 0" class="bos-gunluk">
          <div class="bos-ikon">🔍</div>
          <p class="bos-mesaj">No search results</p>
          <p class="bos-aciklama">Search term: "<strong>{{ filtreMetni }}</strong>"</p>
        </div>
        
        <div v-else class="gunluk-liste">
          <div 
            v-for="kayit in filtrelenmisKayitlar()" 
            :key="kayit.id" 
            class="gunluk-item"
          >
            <div class="kayit-content">
              <div class="kayit-ust">
                <div class="kayit-zaman">{{ tarihFormatla(kayit.zaman) }}</div>
              </div>
              <div class="kayit-mesaj">{{ kayit.mesaj }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alarm-gunlugu {
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.gunluk-header {
  padding: 20px;
  border-bottom: 1px solid #f1f1f1;
}

.baslik-bolumu {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.rozet {
  background-color: var(--primary-color);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  padding: 2px 8px;
  margin-left: 10px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.arama-kutusu {
  position: relative;
  flex: 1;
  margin-right: 15px;
}

.arama-ikonu {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  font-size: 14px;
}

.arama-girdi {
  width: 100%;
  padding: 10px 15px 10px 35px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.arama-girdi:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1);
}

.temizle-btn {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  background-color: #f8f9fa;
  color: #718096;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.temizle-btn:hover {
  background-color: #f1f1f1;
  color: #dc3545;
}

.btn-icon {
  margin-right: 6px;
}

.gunluk-content {
  padding: 0;
  max-height: 500px;
  overflow-y: auto;
}

.yukleniyor {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.bos-gunluk {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.bos-ikon {
  font-size: 50px;
  margin-bottom: 15px;
  color: #a0aec0;
}

.bos-mesaj {
  font-size: 18px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 10px;
}

.bos-aciklama {
  font-size: 14px;
  color: #718096;
  max-width: 300px;
}

.gunluk-liste {
  padding: 10px 0;
}

.gunluk-item {
  position: relative;
  transition: all 0.2s;
  border-bottom: 1px solid #f7fafc;
}

.gunluk-item:hover {
  background-color: #f8f9fa;
}

.kayit-content {
  padding: 15px 20px;
}

.kayit-ust {
  margin-bottom: 8px;
}

.kayit-zaman {
  font-size: 12px;
  color: #718096;
}

.kayit-mesaj {
  font-size: 16px;
  color: #2d3748;
  font-weight: 500;
}
</style> 