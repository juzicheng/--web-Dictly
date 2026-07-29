<script setup lang="ts">
import { reactive, shallowRef } from "vue";
import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons-vue";

definePageMeta({
  layout: false,
});

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const form = reactive({
  username: "user",
  password: "user123",
});
const errorMessage = shallowRef("");

const signalBars = [38, 54, 45, 72, 63, 84, 70, 92, 78, 96, 82, 100];

async function submit() {
  errorMessage.value = "";
  try {
    await auth.login(form);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "登录失败";
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-frame">
      <div class="login-copy">
        <div class="brand-line">
          <span class="brand-mark">D</span>
          <span>Dictly</span>
        </div>

        <h1 class="login-title">多语言翻译管理平台</h1>
        <p class="login-subtitle">项目、词条、术语、成员和交付资源集中在一个清爽的工作台。</p>

        <div class="quality-panel">
          <div class="quality-head">
            <span>
              <SafetyCertificateOutlined />
              质量分
            </span>
            <strong>96/100</strong>
          </div>
          <div class="signal-chart" aria-hidden="true">
            <span
              v-for="(bar, index) in signalBars"
              :key="index"
              :style="{ blockSize: `${bar}%` }"
            />
          </div>
          <div class="quality-foot">
            <span>术语一致性</span>
            <span>高置信度</span>
          </div>
        </div>
      </div>

      <a-card class="login-card" :bordered="false">
        <div class="card-heading">
          <h2>登录</h2>
          <span>Dictly Premium</span>
        </div>

        <a-form layout="vertical" :model="form" @finish="submit">
          <a-form-item
            label="账号"
            name="username"
            :rules="[{ required: true, message: '请输入账号' }]"
          >
            <a-input v-model:value="form.username" size="large" autocomplete="username">
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
            label="密码"
            name="password"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input-password
              v-model:value="form.password"
              size="large"
              autocomplete="current-password"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>

          <a-alert
            v-if="errorMessage"
            class="login-alert"
            type="error"
            show-icon
            :message="errorMessage"
          />

          <a-button
            block
            size="large"
            type="primary"
            html-type="submit"
            :loading="auth.loading.value"
          >
            登录
          </a-button>
        </a-form>

        <div class="seed-accounts">
          <span>内置账号</span>
          <a-tag>user / user123</a-tag>
          <a-tag color="blue">admin / admin123</a-tag>
        </div>
      </a-card>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  padding: 24px;
  place-items: center;
  background: var(--dt-canvas);
}

.login-frame {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 12px;
  width: min(100%, 1040px);
  min-height: 620px;
  padding: 12px;
  overflow: hidden;
  background: var(--dt-app);
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: var(--dt-frame-radius);
  box-shadow: 0 20px 80px rgba(20, 20, 28, 0.14);
}

.login-copy {
  display: grid;
  align-content: center;
  gap: 20px;
  min-width: 0;
  padding: 46px;
  background:
    linear-gradient(135deg, rgba(116, 87, 244, 0.12), transparent 42%),
    linear-gradient(320deg, rgba(32, 201, 134, 0.14), transparent 34%),
    var(--dt-surface);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
}

.brand-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--dt-text);
  font-size: 1.1rem;
  font-weight: 800;
}

.brand-mark {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #ffffff;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.3), transparent),
    var(--dt-primary);
  border-radius: 8px;
  box-shadow: inset 0 -8px 16px rgba(63, 44, 176, 0.18);
}

.login-title {
  max-width: 600px;
  margin: 8px 0 0;
  color: var(--dt-text);
  font-size: 2.55rem;
  line-height: 1.12;
  letter-spacing: 0;
}

.login-subtitle {
  max-width: 560px;
  margin: 0;
  color: var(--dt-muted);
  font-size: 1rem;
  line-height: 1.8;
}

.quality-panel {
  display: grid;
  gap: 14px;
  width: min(100%, 500px);
  margin-top: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
  box-shadow: var(--dt-shadow-soft);
}

.quality-head,
.quality-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quality-head span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--dt-muted);
  font-weight: 700;
}

.quality-head strong {
  color: var(--dt-green);
  font-size: 1.45rem;
}

.signal-chart {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-items: end;
  gap: 5px;
  height: 90px;
}

.signal-chart span {
  min-height: 16px;
  background: linear-gradient(180deg, var(--dt-green), var(--dt-yellow));
  border-radius: 999px 999px 4px 4px;
}

.quality-foot {
  color: var(--dt-muted);
  font-size: 0.82rem;
}

.quality-foot span:last-child {
  color: #0d9d65;
  font-weight: 750;
}

.login-card {
  align-self: center;
  border: 1px solid var(--dt-border);
  box-shadow: var(--dt-shadow);
}

.login-card :deep(.ant-card-body) {
  display: grid;
  gap: 22px;
  padding: 28px;
}

.card-heading {
  display: grid;
  gap: 4px;
}

.card-heading h2 {
  margin: 0;
  color: var(--dt-text);
  font-size: 1.35rem;
  font-weight: 800;
}

.card-heading span {
  color: var(--dt-muted);
  font-size: 0.82rem;
}

.login-alert {
  margin-bottom: 18px;
}

.seed-accounts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--dt-muted);
  font-size: 0.82rem;
}

@media (max-width: 54em) {
  .login-page {
    padding: 0;
  }

  .login-frame {
    grid-template-columns: 1fr;
    min-height: 100vh;
    border: 0;
    border-radius: 0;
  }

  .login-copy {
    padding: 28px;
  }

  .login-title {
    font-size: 2rem;
  }

  .login-card {
    align-self: stretch;
  }
}
</style>
