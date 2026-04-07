<!-- app/components/DemoWidget.vue -->
<template>
  <div class="demo-panel">
    <div class="demo-header">
      <span class="demo-title">{{ t('landing.demo_title') }}</span>
      <span class="demo-live">{{ t('landing.demo_live') }}</span>
    </div>
    <div class="demo-body">
      <div class="demo-row">
        <div class="demo-country">&#127464;&#127475; CN</div>
        <input
          v-model="date"
          class="demo-input"
          type="date"
          :placeholder="t('landing.demo_placeholder')"
          @keydown.enter="query"
        />
        <button class="demo-btn" :disabled="loading" @click="query">
          {{ loading ? t('landing.demo_loading') : t('landing.demo_query') }}
        </button>
      </div>

      <div v-if="error" class="demo-error">{{ error }}</div>

      <div v-if="result" class="demo-result">
        <pre><code v-html="highlightedResult" /></pre>
      </div>
      <div v-else-if="!error" class="demo-placeholder">
        <pre><code v-html="highlightedHint" /></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

const date = ref(`${new Date().getFullYear()}-10-01`);
const result = ref<Record<string, unknown> | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const hintJson = `{
  "date": "...",
  "is_working": false,
  "day_type": "holiday",
  "name_en": "...",
  "name_local": "..."
}`;

function highlightJson(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // key
          return `<span class="hl-key">${match}</span>`;
        }
        // string value
        return `<span class="hl-string">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span class="hl-bool">${match}</span>`;
      if (/null/.test(match)) return `<span class="hl-null">${match}</span>`;
      // number
      return `<span class="hl-number">${match}</span>`;
    }
  );
}

const highlightedResult = computed(() =>
  result.value ? highlightJson(JSON.stringify(result.value, null, 2)) : ''
);

const highlightedHint = computed(() => highlightJson(hintJson));

async function query() {
  if (!date.value) return;
  loading.value = true;
  error.value = null;
  try {
    result.value = await $fetch(`/api/demo/check?country=CN&date=${date.value}`);
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message ?? 'Error';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.demo-panel {
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(79, 70, 229, 0.08);
}
.demo-header {
  background: var(--bg-muted);
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.demo-title { font-size: 11px; font-weight: 700; color: var(--text-secondary); }
.demo-live {
  font-size: 10px;
  color: var(--success);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}
.demo-live::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}
.demo-body { padding: 16px; }
.demo-row { display: flex; gap: 8px; margin-bottom: 12px; }
.demo-country {
  flex-shrink: 0;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg);
}
.demo-input {
  flex: 1;
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
  font-size: 12px;
  color: var(--text-primary);
  font-family: monospace;
  min-width: 0;
}
.demo-input:focus { outline: none; box-shadow: 0 0 0 3px var(--accent-light); }
.demo-btn {
  flex-shrink: 0;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.demo-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.demo-btn:hover:not(:disabled) { opacity: 0.9; }

.demo-result, .demo-placeholder {
  background: var(--code-bg);
  border-radius: var(--radius);
  padding: 14px;
}
.demo-result pre, .demo-placeholder pre {
  margin: 0;
}
.demo-result code, .demo-placeholder code {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.7;
  color: #94a3b8;
  white-space: pre-wrap;
  word-break: break-all;
}

/* JSON syntax highlight tokens */
:deep(.hl-key)    { color: #93c5fd; }  /* blue  — keys */
:deep(.hl-string) { color: #86efac; }  /* green — string values */
:deep(.hl-number) { color: #fbbf24; }  /* amber — numbers */
:deep(.hl-bool)   { color: #f9a8d4; }  /* pink  — true/false */
:deep(.hl-null)   { color: #f9a8d4; }  /* pink  — null */

.demo-error { font-size: 11px; color: var(--danger); margin-bottom: 8px; }
</style>
