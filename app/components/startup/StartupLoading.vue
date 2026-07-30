<script setup lang="ts">
withDefaults(
  defineProps<{
    leaving?: boolean;
  }>(),
  {
    leaving: false,
  },
);

const beams = ["one", "two"] as const;
const dots = ["primary", "cyan", "green"] as const;
const cards = [
  { key: "source", label: "source", text: "Launch copy" },
  { key: "zh", label: "zh-CN", text: "发布文案" },
  { key: "en", label: "en-US", text: "Launch copy" },
  { key: "ja", label: "ja-JP", text: "公開コピー" },
] as const;
</script>

<template>
  <div
    id="dictly-startup-loading"
    class="dictly-startup-loading"
    :class="{ 'dictly-startup-loading--leaving': leaving }"
    role="status"
    aria-live="polite"
    aria-label="页面加载中"
  >
    <div class="dictly-startup-loading__shell">
      <div class="dictly-startup-loading__scene" aria-hidden="true">
        <div class="dictly-startup-loading__mesh"></div>
        <div
          v-for="beam in beams"
          :key="beam"
          class="dictly-startup-loading__beam"
          :class="`dictly-startup-loading__beam--${beam}`"
        ></div>
        <div class="dictly-startup-loading__orbit">
          <span
            v-for="dot in dots"
            :key="dot"
            class="dictly-startup-loading__dot"
            :class="`dictly-startup-loading__dot--${dot}`"
          ></span>
        </div>
        <div class="dictly-startup-loading__logo">
          <span>D</span>
        </div>
        <div
          v-for="card in cards"
          :key="card.key"
          class="dictly-startup-loading__card"
          :class="`dictly-startup-loading__card--${card.key}`"
        >
          <b>{{ card.label }}</b>
          <span>{{ card.text }}</span>
        </div>
      </div>
      <div class="dictly-startup-loading__copy">
        <strong>Dictly</strong>
        <span>同步多语言工作台</span>
      </div>
      <div class="dictly-startup-loading__progress" aria-hidden="true"></div>
    </div>
  </div>
</template>
