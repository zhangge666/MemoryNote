<template>
  <div class="settings-section">
    <div class="about-info">
      <div class="about-logo">📝</div>
      <h2>{{ t('app.name') }}</h2>
      <p class="about-version">Version 0.1.0</p>
      <p class="about-desc">{{ t('app.description') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.about-info {
  text-align: center;
  padding: 2rem;
}

.about-logo {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.about-info h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  color: var(--theme-text);
}

.about-version {
  color: var(--theme-text-secondary);
  margin: 0 0 1rem;
}

.about-desc {
  color: var(--theme-text-secondary);
  line-height: 1.6;
}
</style>