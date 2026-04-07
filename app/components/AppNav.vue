<!-- app/components/AppNav.vue -->
<template>
  <header class="nav">
    <div class="nav-inner">
      <NuxtLink to="/" class="nav-logo"
        >📅 <strong>isworkday</strong>.io</NuxtLink
      >

      <nav class="nav-center">
        <NuxtLink to="/" class="nav-link">{{ t("nav.home") }}</NuxtLink>
        <NuxtLink to="/docs" class="nav-link">{{ t("nav.docs") }}</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/dashboard" class="nav-link">{{
          t("nav.dashboard")
        }}</NuxtLink>
      </nav>

      <div class="nav-right">
        <button class="lang-toggle" @click="toggleLang">
          {{ t("lang_toggle") }}
        </button>

        <template v-if="loggedIn">
          <div class="user-badge">
            <div class="user-avatar">{{ userInitial }}</div>
            <span class="user-name">{{ user?.name || user?.email }}</span>
          </div>
          <button class="nav-logout" @click="logout">
            {{ t("nav.logout") }}
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="nav-login">{{
            t("nav.login")
          }}</NuxtLink>
          <NuxtLink to="/register" class="nav-cta">{{
            t("nav.register")
          }}</NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { t, locale, setLocale } = useI18n();
const { loggedIn, user } = useUserSession();

const userInitial = computed(() => {
  const name = user.value?.name || user.value?.email || "?";
  return name.charAt(0).toUpperCase();
});

function toggleLang() {
  setLocale(locale.value === "zh" ? "en" : "zh");
}

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await navigateTo("/");
}
</script>

<style scoped>
.nav {
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 50;
}
.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 40px;
  max-width: 1100px;
  margin: 0 auto;
}
.nav-logo {
  font-size: 14px;
  font-weight: 900;
  color: var(--text-primary);
}
.nav-logo strong {
  color: var(--accent);
}

.nav-center {
  display: flex;
  gap: 20px;
}
.nav-link {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  transition: color 0.15s;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
  font-weight: 600;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-toggle {
  font-size: 11px;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 3px 10px;
  background: none;
  cursor: pointer;
}
.lang-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.nav-login {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
}
.nav-cta {
  font-size: 11px;
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius);
  padding: 6px 14px;
  font-weight: 600;
  transition: opacity 0.15s;
}
.nav-cta:hover {
  opacity: 0.9;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--bg-muted);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 12px 4px 5px;
}
.user-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.nav-logout {
  font-size: 11px;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
}
.nav-logout:hover {
  color: var(--danger);
}

@media (max-width: 640px) {
  .nav-inner {
    padding: 12px 16px;
  }
  .nav-center {
    display: none;
  }
}
</style>
