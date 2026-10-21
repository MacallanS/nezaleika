<template>
  <div class="profile-section-card">
    <div v-if="filledUserData?.individual_enterepreneur" class="profile-row">
      <span class="profile-label">Данные ИП:</span>
      <table class="profile-table">
        <tbody>
          <tr>
            <td>ФИО</td>
            <td>{{ filledUserData.individual_enterepreneur.name }}</td>
          </tr>
          <tr>
            <td>ИНН</td>
            <td>{{ filledUserData.individual_enterepreneur.inn }}</td>
          </tr>
          <tr>
            <td>ОГРНИП</td>
            <td>
              <div class="photos-grid">
                <div class="photo-block">
                  <img 
                    :src="getFileUrl(filledUserData.individual_enterepreneur.file_ogrnip)" 
                    alt="ОГРНИП"
                    class="photo-preview"
                    data-fancybox="gallery"
                    :data-src="getFileUrl(filledUserData.individual_enterepreneur.file_ogrnip)"
                    data-caption="ОГРНИП"
                  />
                  <div class="photo-label">ОГРНИП</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>Банк</td>
            <td>{{ filledUserData.individual_enterepreneur.bank }}</td>
          </tr>
          <tr>
            <td>БИК</td>
            <td>{{ filledUserData.individual_enterepreneur.bank_bik }}</td>
          </tr>
          <tr>
            <td>ИНН банка</td>
            <td>{{ filledUserData.individual_enterepreneur.bank_inn }}</td>
          </tr>
          <tr>
            <td>Расчётный счёт</td>
            <td>{{ filledUserData.individual_enterepreneur.payment_account }}</td>
          </tr>
          <tr>
            <td>Корр. счёт</td>
            <td>{{ filledUserData.individual_enterepreneur.correspondent_account }}</td>
          </tr>
          <tr v-if="filledUserData.individual_enterepreneur.file_banking_details">
            <td>Банковские реквизиты</td>
            <td>
              <div class="photos-grid">
                <div class="photo-block">
                  <img 
                    :src="getFileUrl(filledUserData.individual_enterepreneur.file_banking_details)" 
                    alt="Банковские реквизиты"
                    class="photo-preview"
                    data-fancybox="gallery"
                    :data-src="getFileUrl(filledUserData.individual_enterepreneur.file_banking_details)"
                    data-caption="Банковские реквизиты"
                  />
                  <div class="photo-label">Банковские реквизиты</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="filledUserData?.self_employed" class="profile-row">
      <span class="profile-label">Данные самозанятого:</span>
      <table class="profile-table">
        <tbody>
          <tr v-if="filledUserData.self_employed.file_self_employed">
            <td>Справка о самозанятости</td>
            <td>
              <div class="photos-grid">
                <div class="photo-block">
                  <img 
                    :src="getFileUrl(filledUserData.self_employed.file_self_employed)" 
                    alt="Справка о самозанятости"
                    class="photo-preview"
                    data-fancybox="gallery"
                    :data-src="getFileUrl(filledUserData.self_employed.file_self_employed)"
                    data-caption="Справка о самозанятости"
                  />
                  <div class="photo-label">Справка о самозанятости</div>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="filledUserData.self_employed.file_income_statement">
            <td>Справка о доходах</td>
            <td>
              <div class="photos-grid">
                <div class="photo-block">
                  <img 
                    :src="getFileUrl(filledUserData.self_employed.file_income_statement)" 
                    alt="Справка о доходах"
                    class="photo-preview"
                    data-fancybox="gallery"
                    :data-src="getFileUrl(filledUserData.self_employed.file_income_statement)"
                    data-caption="Справка о доходах"
                  />
                  <div class="photo-label">Справка о доходах</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { onMounted, nextTick } from 'vue';

const props = defineProps(["filledUserData", "getAccountTypeName", "getFileUrl"]);

function loadFancybox() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/@fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css';
  document.head.appendChild(link);
  
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js';
  script.onload = () => {
    initFancybox();
  };
  document.head.appendChild(script);
}

function initFancybox() {
  if (window.$ && window.$.fancybox) {
    window.$('[data-fancybox="gallery"]').fancybox({
      buttons: [
        "zoom",
        "slideShow",
        "thumbs",
        "close"
      ],
      loop: true,
      protect: true,
      animationEffect: "fade",
      transitionEffect: "slide",
      thumbs: {
        autoStart: false
      },
      touch: {
        vertical: true,
        momentum: true
      }
    });
  }
}

onMounted(async () => {
  await nextTick();
  
  if (!window.$ || !window.$.fancybox) {
    if (!window.$) {
      const jqueryScript = document.createElement('script');
      jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
      jqueryScript.onload = () => {
        loadFancybox();
      };
      document.head.appendChild(jqueryScript);
    } else {
      loadFancybox();
    }
  } else {
    initFancybox();
  }
});
</script>
<style scoped>
.profile-section-card {
  background: none;
  padding: 0;
}
.profile-row {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  font-size: 1.08rem;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--russ-border);
}
.profile-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.profile-label {
  color: var(--russ-text-secondary);
  min-width: 120px;
  font-weight: 600;
  font-size: 1.05em;
}
.profile-value {
  color: var(--russ-text-primary);
  font-weight: 500;
  word-break: break-word;
}
.profile-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.profile-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--russ-border);
  font-size: 1rem;
}
.photos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
}
.photo-block {
  flex: 0 0 180px;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
}
.photo-label {
  font-size: 1rem;
  font-weight: 500;
  margin-top: 0.5rem;
  color: var(--russ-text-secondary);
  text-align: center;
}
.photo-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  box-shadow: 0 1px 4px var(--russ-shadow-color);
  margin: 0.2rem 0.5rem 0.2rem 0;
  object-fit: cover;
  transition: transform 0.18s;
  border: 1px solid var(--russ-border);
}
.photo-preview:hover {
  box-shadow: 0 2px 12px var(--russ-shadow-color);
  transform: scale(1.05);
}
@media (max-width: 600px) {
  .profile-section-card {
    padding: 0;
    gap: 0.3rem;
  }
  .profile-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font-size: 0.95rem;
    padding-bottom: 0.1rem;
  }
  .profile-label {
    min-width: 0;
    font-size: 0.95em;
  }
  .profile-table td {
    font-size: 0.92em;
    padding: 0.2rem 0.3rem;
  }
  .photos-grid {
    gap: 0.4rem;
  }
  .photo-block {
    flex: 0 0 70px;
  }
  .photo-preview {
    width: 50px;
    height: 50px;
  }
  .photo-label {
    font-size: 0.89rem;
    margin-bottom: 0.2rem;
  }
}
</style>
