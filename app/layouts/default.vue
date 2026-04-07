<!-- app/layouts/default.vue -->
<template>
  <div class="site-wrapper">
    <AppNav />
    <main>
      <slot />
    </main>
    <footer class="site-footer">
      <div class="footer-inner">
        <span class="footer-logo">📅 <strong>isworkday</strong>.io</span>
        <nav class="footer-links">
          <NuxtLink to="/docs">{{ t('landing.footer_links.docs') }}</NuxtLink>
          <a href="https://github.com" target="_blank" rel="noopener">{{ t('landing.footer_links.github') }}</a>
          <a href="mailto:hello@isworkday.io">{{ t('landing.footer_links.contact') }}</a>
        </nav>
        <span class="footer-copy">{{ t('landing.copyright') }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>

<style scoped>
.site-wrapper { display: flex; flex-direction: column; min-height: 100vh; }
main { flex: 1; }

.site-footer {
  border-top: 1px solid var(--border);
  padding: 20px 40px;
}
.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto;
}
.footer-logo { font-size: 13px; color: var(--text-primary); }
.footer-logo strong { color: var(--accent); }
.footer-links { display: flex; gap: 16px; }
.footer-links a { font-size: 11px; color: var(--text-muted); }
.footer-links a:hover { color: var(--text-secondary); }
.footer-copy { font-size: 11px; color: var(--border); }
</style>
