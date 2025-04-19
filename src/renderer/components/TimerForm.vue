<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const zaman = ref('');
const mesaj = ref('');
const hataMesaji = ref('');
const zamanlayicilar = ref<Array<{id: number, zaman: string, mesaj: string, kalan: string, yuzdeTamamlanan: number}>>([]);
let sayacId = 0;

// Sayfa yüklendiğinde zamanlayıcıları getir
onMounted(() => {
  // Kaydedilmiş zamanlayıcıları getir
  window.electronAPI.zamanlayicilariGetir();
  
  // Zamanlayıcıları al
  window.electronAPI.onZamanlayicilar((aktifZamanlayicilar) => {
    // Mevcut zamanlayıcıları temizle
    zamanlayicilar.value = [];
    
    // Yeni gelen zamanlayıcıları ekle
    aktifZamanlayicilar.forEach(z => {
      const zamanStr = new Date(z.zaman).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      const hedefZaman = new Date(z.zaman);
      zamanlayicilar.value.push({
        id: z.id,
        zaman: zamanStr,
        mesaj: z.mesaj,
        kalan: kalanZamanHesapla(hedefZaman),
        yuzdeTamamlanan: ilerlemeDurumuHesapla(hedefZaman)
      });
    });
  });
  
  // Zamanlayıcı silindiğinde
  window.electronAPI.onZamanlayiciSilindi((id) => {
    zamanlayicilar.value = zamanlayicilar.value.filter(item => item.id !== id);
  });
  
  // Yeni zamanlayıcı eklendiğinde
  window.electronAPI.onZamanlayiciEklendi((zamanlayici) => {
    const zamanStr = new Date(zamanlayici.zaman).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const hedefZaman = new Date(zamanlayici.zaman);
    zamanlayicilar.value.push({
      id: zamanlayici.id,
      zaman: zamanStr,
      mesaj: zamanlayici.mesaj,
      kalan: kalanZamanHesapla(hedefZaman),
      yuzdeTamamlanan: ilerlemeDurumuHesapla(hedefZaman)
    });
  });
  
  // Her saniyede bir kalan süreyi güncelle
  setInterval(() => {
    zamanlayicilar.value.forEach((z, index) => {
      const hedefZamanStr = z.zaman;
      
      // Zamanı ayrıştır (HH:MM AM/PM formatı veya 24 saat formatı)
      const amPmFormatKontrol = hedefZamanStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      const saatFormatKontrol = hedefZamanStr.match(/^(\d{1,2}):(\d{2})$/);
      
      const hedefZaman = new Date();
      
      if (amPmFormatKontrol) {
        // AM/PM formatı
        let saat = parseInt(amPmFormatKontrol[1]);
        const dakika = parseInt(amPmFormatKontrol[2]);
        const amPm = amPmFormatKontrol[3].toUpperCase();
        
        if (amPm === 'PM' && saat < 12) {
          saat += 12;
        } else if (amPm === 'AM' && saat === 12) {
          saat = 0;
        }
        
        hedefZaman.setHours(saat);
        hedefZaman.setMinutes(dakika);
        hedefZaman.setSeconds(0);
      } else if (saatFormatKontrol) {
        // 24 saat formatı
        const saat = parseInt(saatFormatKontrol[1]);
        const dakika = parseInt(saatFormatKontrol[2]);
        
        hedefZaman.setHours(saat);
        hedefZaman.setMinutes(dakika);
        hedefZaman.setSeconds(0);
      } else {
        // Tanımlanamayan format, bu satırı atla
        return;
      }
      
      // Eğer hedef zaman geçmişte kaldıysa, bir sonraki güne ayarla
      const simdi = new Date();
      if (hedefZaman < simdi) {
        hedefZaman.setDate(hedefZaman.getDate() + 1);
      }
      
      // Kalan zamanı ve ilerleme durumunu güncelle
      zamanlayicilar.value[index].kalan = kalanZamanHesapla(hedefZaman);
      zamanlayicilar.value[index].yuzdeTamamlanan = ilerlemeDurumuHesapla(hedefZaman);
    });
  }, 1000);
});

function zamanEkle() {
  // Form validasyonu
  if (!zaman.value || !mesaj.value) {
    hataMesaji.value = 'Please enter time and message!';
    return;
  }
  
  hataMesaji.value = '';
  const simdi = new Date();
  const hedefZaman = new Date();
  
  // İki farklı formatta kontrolü dene (HH:MM AM/PM veya HH:MM 24 saat formatı)
  const amPmFormatKontrol = zaman.value.match(/(\d+):(\d+)\s*(AM|PM)/i);
  const saatFormatKontrol = zaman.value.match(/^(\d{1,2}):(\d{2})$/);
  
  if (amPmFormatKontrol) {
    // AM/PM formatı
    let saat = parseInt(amPmFormatKontrol[1]);
    const dakika = parseInt(amPmFormatKontrol[2]);
    const amPm = amPmFormatKontrol[3].toUpperCase();
    
    if (saat < 1 || saat > 12 || dakika < 0 || dakika > 59) {
      hataMesaji.value = 'Invalid time value! Hours must be between 1-12, minutes between 0-59.';
      return;
    }
    
    if (amPm === 'PM' && saat < 12) {
      saat += 12;
    } else if (amPm === 'AM' && saat === 12) {
      saat = 0;
    }
    
    hedefZaman.setHours(saat);
    hedefZaman.setMinutes(dakika);
    hedefZaman.setSeconds(0);
  } else if (saatFormatKontrol) {
    // 24 saat formatı
    const saat = parseInt(saatFormatKontrol[1]);
    const dakika = parseInt(saatFormatKontrol[2]);
    
    if (saat < 0 || saat > 23 || dakika < 0 || dakika > 59) {
      hataMesaji.value = 'Invalid time value! Hours must be between 0-23, minutes between 0-59.';
      return;
    }
    
    hedefZaman.setHours(saat);
    hedefZaman.setMinutes(dakika);
    hedefZaman.setSeconds(0);
  } else {
    hataMesaji.value = 'Invalid time format! Enter as HH:MM (24-hour) or HH:MM AM/PM.';
    return;
  }
  
  // Eğer hedef zaman geçmişte kaldıysa, bir sonraki güne ayarla
  if (hedefZaman < simdi) {
    hedefZaman.setDate(hedefZaman.getDate() + 1);
  }
  
  // Ana sürece bildirim gönder
  window.electronAPI.zamanEkle({
    id: 0, // ID ana süreçte atanacak
    zaman: hedefZaman.getTime(),
    mesaj: mesaj.value
  });
  
  // Formu temizle
  zaman.value = '';
  mesaj.value = '';
}

function kalanZamanHesapla(hedefZaman: Date): string {
  const simdi = new Date();
  const fark = hedefZaman.getTime() - simdi.getTime();
  
  if (fark <= 0) {
    return "Time's up!";
  }
  
  const saatler = Math.floor(fark / (1000 * 60 * 60));
  const dakikalar = Math.floor((fark % (1000 * 60 * 60)) / (1000 * 60));
  const saniyeler = Math.floor((fark % (1000 * 60)) / 1000);
  
  if (saatler > 0) {
    return `${saatler} hours, ${dakikalar} minutes left`;
  } else if (dakikalar > 0) {
    return `${dakikalar} minutes, ${saniyeler} seconds left`;
  } else {
    return `${saniyeler} seconds left`;
  }
}

// İlerleme durumunu hesapla (yüzde olarak)
function ilerlemeDurumuHesapla(hedefZaman: Date): number {
  const simdi = new Date();
  const fark = hedefZaman.getTime() - simdi.getTime();
  
  if (fark <= 0) {
    return 100;
  }
  
  // 24 saatlik bir periyot için maksimum değer
  const maksimumSure = 24 * 60 * 60 * 1000; // 24 saat
  
  // Kalan sürenin yüzdesini hesapla (ters orantılı)
  const kalanYuzde = (fark / maksimumSure) * 100;
  const tamamlananYuzde = 100 - Math.min(kalanYuzde, 100);
  
  return Math.max(tamamlananYuzde, 0);
}

function zamanlayiciSil(id: number) {
  // Ana sürece zamanlayıcıyı silme isteği gönder
  window.electronAPI.zamanlayiciSil(id);
  
  // UI'dan hemen kaldır (ana süreçten yanıt beklemeden)
  zamanlayicilar.value = zamanlayicilar.value.filter(item => item.id !== id);
}
</script>

<template>
  <div>
    <div class="zamanlayici-form">
      <div class="form-card">
        <h3>New Timer</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="zaman">
              <span class="input-icon">🕒</span>
              Time
            </label>
            <input 
              id="zaman" 
              v-model="zaman" 
              type="text" 
              placeholder="3:30 PM or 14:30"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="mesaj">
              <span class="input-icon">📝</span>
              Message
            </label>
            <input 
              id="mesaj" 
              v-model="mesaj" 
              type="text" 
              placeholder="Meeting time!"
              class="form-input"
            />
          </div>
        </div>
        
        <div class="action-row">
          <button @click="zamanEkle" class="ekle-btn">
            <span class="btn-icon">+</span>
            Add Timer
          </button>
        </div>
        
        <div v-if="hataMesaji" class="hata-mesaji">
          <span class="hata-icon">⚠️</span>
          {{ hataMesaji }}
        </div>
      </div>
      
      <div v-if="zamanlayicilar.length > 0" class="zamanlayicilar-listesi">
        <h3>Active Timers</h3>
        <div class="zamanlayici-kartlari">
          <div v-for="zamanlayici in zamanlayicilar" :key="zamanlayici.id" class="zamanlayici-karti">
            <div class="zamanlayici-detay">
              <div class="zamanlayici-zaman">{{ zamanlayici.zaman }}</div>
              <div class="zamanlayici-mesaj">{{ zamanlayici.mesaj }}</div>
              <div class="progress-bar">
                <div class="progress-inner" :style="{ width: zamanlayici.yuzdeTamamlanan + '%' }"></div>
              </div>
              <div class="zamanlayici-kalan">{{ zamanlayici.kalan }}</div>
            </div>
            <button @click="zamanlayiciSil(zamanlayici.id)" class="sil-btn" title="Delete timer">
              <span class="sil-icon">🗑️</span>
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="bos-mesaj">
        <div class="bos-icon">⏰</div>
        <p>No active timers. Add a new one!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.zamanlayici-form {
  margin-bottom: 30px;
}

.form-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  padding: 25px;
}

.form-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: var(--primary-color);
  text-align: center;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.input-icon {
  margin-right: 8px;
  font-size: 16px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
}

.action-row {
  display: flex;
  justify-content: center;
}

.ekle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 25px;
  background: linear-gradient(to right, var(--primary-color), var(--primary-light));
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.3);
}

.ekle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(67, 97, 238, 0.4);
}

.btn-icon {
  margin-right: 8px;
  font-size: 18px;
}

.hata-mesaji {
  display: flex;
  align-items: center;
  margin-top: 15px;
  padding: 10px 15px;
  background-color: #fff5f5;
  color: #e53e3e;
  border-left: 3px solid #e53e3e;
  border-radius: 4px;
}

.hata-icon {
  margin-right: 8px;
}

.zamanlayicilar-listesi {
  margin-top: 30px;
}

.zamanlayicilar-listesi h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.zamanlayici-kartlari {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.zamanlayici-karti {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s;
}

.zamanlayici-karti:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.zamanlayici-detay {
  padding: 20px;
}

.zamanlayici-zaman {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
}

.zamanlayici-mesaj {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 500;
}

.zamanlayici-kalan {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.progress-bar {
  height: 6px;
  background-color: #edf2f7;
  border-radius: 10px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(to right, var(--primary-color), var(--primary-light));
  border-radius: 10px;
  transition: width 0.5s ease;
}

.sil-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.sil-btn:hover {
  background: rgba(220, 53, 69, 0.2);
  transform: scale(1.1);
}

.sil-icon {
  font-size: 16px;
}

.bos-mesaj {
  text-align: center;
  padding: 30px;
  color: #718096;
}

.bos-icon {
  font-size: 40px;
  margin-bottom: 20px;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
}
</style> 