<!-- app/layouts/auth.vue -->
<template>
  <div class="auth-wrapper">
    <NuxtLink to="/" class="auth-logo">📅 <strong>isworkday</strong>.io</NuxtLink>
    <slot />
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: linear-gradient(160deg, var(--bg-subtle) 0%, var(--bg) 60%);
}
.auth-logo {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-primary);
  margin-bottom: 24px;
}
.auth-logo strong { color: var(--accent); }
</style>
