<!-- app/pages/index.vue -->
<template>
  <div>
    <!-- HERO -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-left">
          <div class="hero-badge">{{ t("landing.badge") }}</div>
          <h1 class="hero-title" v-html="heroTitleHtml" />
          <p class="hero-subtitle">{{ t("landing.subtitle") }}</p>
          <div class="hero-actions">
            <NuxtLink to="/register" class="btn-primary">{{
              t("landing.cta_primary")
            }}</NuxtLink>
            <NuxtLink to="/docs" class="btn-secondary">{{
              t("landing.cta_docs")
            }}</NuxtLink>
          </div>
          <p class="hero-trust">{{ t("landing.trust") }}</p>
        </div>
        <div class="hero-right">
          <DemoWidget />
        </div>
      </div>
    </section>

    <!-- FEATURES STRIP -->
    <section class="features-section">
      <div class="features-inner">
        <div class="features-grid">
          <div class="feature">
            <div class="feature-icon">&#128197;</div>
            <div class="feature-title">
              {{ t("landing.features.holiday_title") }}
            </div>
            <div class="feature-desc">
              {{ t("landing.features.holiday_desc") }}
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">&#9889;</div>
            <div class="feature-title">
              {{ t("landing.features.endpoints_title") }}
            </div>
            <div class="feature-desc">
              {{ t("landing.features.endpoints_desc") }}
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">&#128273;</div>
            <div class="feature-title">
              {{ t("landing.features.instant_title") }}
            </div>
            <div class="feature-desc">
              {{ t("landing.features.instant_desc") }}
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">&#128737;</div>
            <div class="feature-title">
              {{ t("landing.features.verified_title") }}
            </div>
            <div class="feature-desc">
              {{ t("landing.features.verified_desc") }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CODE SNIPPET SECTION -->
    <section class="snippet-section">
      <div class="section-inner">
        <div class="section-label">{{ t("landing.snippet_label") }}</div>
        <h2 class="section-title">{{ t("landing.snippet_title") }}</h2>
        <p class="section-sub">{{ t("landing.snippet_subtitle") }}</p>
        <div class="code-card">
          <div class="code-tabs">
            <button
              v-for="tab in snippetTabs"
              :key="tab"
              :class="['code-tab', { active: activeTab === tab }]"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>
          <pre class="code-block"><code v-html="highlightedSnippet" /></pre>
        </div>
      </div>
    </section>

    <!-- CTA SECTION -->
    <section class="cta-section">
      <h2 class="cta-title">{{ t("landing.cta_title") }}</h2>
      <p class="cta-sub">{{ t("landing.cta_sub") }}</p>
      <NuxtLink to="/register" class="cta-btn">{{
        t("landing.cta_btn")
      }}</NuxtLink>
      <p class="cta-note">{{ t("landing.cta_note") }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import hljs from "highlight.js/lib/core";
import hljsBash from "highlight.js/lib/languages/bash";
import hljsJs from "highlight.js/lib/languages/javascript";
import hljsPython from "highlight.js/lib/languages/python";

hljs.registerLanguage("bash", hljsBash);
hljs.registerLanguage("javascript", hljsJs);
hljs.registerLanguage("python", hljsPython);

const { t } = useI18n();

const heroTitleHtml = computed(() => {
  const title = t("landing.title");
  return title.replace(/(工作日|workday)/i, "<em>$1</em>");
});

const snippetTabs = ["cURL", "JavaScript", "Python"] as const;
type Tab = (typeof snippetTabs)[number];
const activeTab = ref<Tab>("cURL");

const tabLang: Record<Tab, string> = {
  cURL: "bash",
  JavaScript: "javascript",
  Python: "python",
};

const highlightedSnippet = computed(
  () =>
    hljs.highlight(snippets[activeTab.value], {
      language: tabLang[activeTab.value],
    }).value,
);

const exampleDate = `${new Date().getFullYear()}-10-01`;

const snippets: Record<Tab, string> = {
  cURL: `# Check if ${exampleDate} is a workday in China \n
curl "https://isworkday.io/v1/check?country=CN&date=${exampleDate}" -H "X-API-Key: YOUR_API_KEY"

# Response
{ "is_working": false, "day_type": "holiday", "name_local": "国庆节" }`,
  JavaScript: `const res = await fetch(
  "https://isworkday.io/v1/check?country=CN&date=${exampleDate}",
  { headers: { "X-API-Key": "YOUR_API_KEY" } }
);
const data = await res.json();
// { is_working: false, day_type: "holiday", name_local: "国庆节" }`,
  Python: `import requests

r = requests.get(
    "https://isworkday.io/v1/check",
    params={"country": "CN", "date": "${exampleDate}"},
    headers={"X-API-Key": "YOUR_API_KEY"},
)
print(r.json())  
# {'is_working': False, 'day_type': 'holiday', ...}`,
};
</script>

<style scoped>
/* HERO */
.hero {
  background: linear-gradient(160deg, var(--bg-subtle) 0%, var(--bg) 60%);
  padding: 56px 40px 48px;
}
.hero-inner {
  display: flex;
  gap: 48px;
  align-items: center;
  max-width: 1100px;
  margin: 0 auto;
}
.hero-left {
  flex: 1.1;
}
.hero-right {
  flex: 1;
}

.hero-badge {
  display: inline-flex;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
  padding: 4px 12px;
  margin-bottom: 16px;
}
.hero-title {
  font-size: 36px;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1.15;
  letter-spacing: -0.5px;
  margin-bottom: 10px;
}
:deep(.hero-title em) {
  color: var(--accent);
  font-style: normal;
}

.hero-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 380px;
}
.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.btn-primary {
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: var(--radius);
  padding: 10px 20px;
  transition: opacity 0.15s;
}
.btn-primary:hover {
  opacity: 0.9;
}
.btn-secondary {
  border: 1.5px solid var(--border);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius);
  padding: 10px 18px;
  transition: border-color 0.15s;
}
.btn-secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.hero-trust {
  font-size: 11px;
  color: var(--text-muted);
}

/* FEATURES */
.features-section {
  padding: 0 40px 48px;
}
.features-inner {
  max-width: 1100px;
  margin: 0 auto;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.feature {
  padding: 20px 16px;
  text-align: center;
  border-radius: var(--radius);
  transition: background 0.15s;
}
.feature:hover {
  background: var(--bg-subtle);
}
.feature-icon {
  font-size: 22px;
  margin-bottom: 8px;
}
.feature-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.feature-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* SNIPPET */
.snippet-section {
  padding: 56px 40px;
  background: var(--bg-subtle);
}
.section-inner {
  max-width: 760px;
  margin: 0 auto;
}
.section-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.section-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.section-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}
.code-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}
.code-tabs {
  display: flex;
  background: #1e293b;
  padding: 4px 8px 0;
  gap: 2px;
}
.code-tab {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  padding: 6px 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s;
}
.code-tab.active {
  color: #e2e8f0;
  border-bottom-color: var(--accent);
}
.code-block {
  background: var(--code-bg);
  padding: 16px;
  margin: 0;
  overflow-x: auto;
}
.code-block code {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.8;
  color: #94a3b8;
  white-space: pre;
}

/* highlight.js tokens — tuned for dark code-bg */
:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: #475569;
  font-style: italic;
}
:deep(.hljs-keyword),
:deep(.hljs-selector-tag),
:deep(.hljs-built_in) {
  color: #f9a8d4;
}
:deep(.hljs-string),
:deep(.hljs-attr) {
  color: #86efac;
}
:deep(.hljs-number),
:deep(.hljs-literal) {
  color: #fbbf24;
}
:deep(.hljs-variable),
:deep(.hljs-template-variable) {
  color: #a5f3fc;
}
:deep(.hljs-title),
:deep(.hljs-section) {
  color: #93c5fd;
  font-weight: bold;
}
:deep(.hljs-name),
:deep(.hljs-tag) {
  color: #c4b5fd;
}
:deep(.hljs-params) {
  color: #94a3b8;
}

/* CTA */
.cta-section {
  padding: 64px 40px;
  text-align: center;
  background: linear-gradient(135deg, var(--accent-light) 0%, #f0fdf4 100%);
  border-top: 1px solid var(--border);
}
.cta-title {
  font-size: 26px;
  font-weight: 900;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.cta-sub {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}
.cta-btn {
  display: inline-block;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border-radius: var(--radius-lg);
  padding: 13px 28px;
  margin-bottom: 12px;
  transition: opacity 0.15s;
}
.cta-btn:hover {
  opacity: 0.9;
}
.cta-note {
  font-size: 11px;
  color: var(--text-muted);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero {
    padding: 40px 16px 32px;
  }
  .hero-inner {
    flex-direction: column;
    gap: 32px;
  }
  .hero-title {
    font-size: 28px;
  }
  .hero-subtitle {
    max-width: 100%;
  }
  .features-section {
    padding: 0 16px 40px;
  }
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .snippet-section,
  .cta-section {
    padding: 40px 16px;
  }
}
@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
