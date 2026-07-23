<script setup lang="ts">
import { reactive, shallowRef } from "vue";
import { LockOutlined, UserOutlined } from "@ant-design/icons-vue";

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
    <section class="login-panel">
      <div class="login-copy">
        <div class="brand-line">
          <span class="brand-mark">D</span>
          <span>Dictly</span>
        </div>
        <h1 class="login-title">多语言翻译管理平台</h1>
        <p class="login-subtitle">统一维护产品词条、协作翻译、审核流转、资源导入导出和术语规范。</p>
      </div>

      <a-card class="login-card" :bordered="false">
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

        <a-divider />

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
  background:
    linear-gradient(135deg, rgba(31, 111, 235, 0.08), transparent 38%),
    linear-gradient(315deg, rgba(45, 164, 78, 0.1), transparent 34%), #f6f8fa;
}

.login-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 36px;
  width: min(100%, 980px);
  align-items: center;
}

.login-copy {
  min-width: 0;
}

.brand-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #24292f;
  font-size: 18px;
  font-weight: 700;
}

.brand-mark {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #ffffff;
  background: #1f6feb;
  border-radius: 6px;
}

.login-title {
  margin: 26px 0 12px;
  color: #24292f;
  font-size: 42px;
  line-height: 1.18;
}

.login-subtitle {
  max-width: 560px;
  margin: 0;
  color: #57606a;
  font-size: 17px;
  line-height: 1.8;
}

.login-card {
  border: 1px solid #d8dee4;
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(27, 31, 36, 0.08);
}

.login-alert {
  margin-bottom: 18px;
}

.seed-accounts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: #6e7781;
}

@media (max-width: 860px) {
  .login-panel {
    grid-template-columns: 1fr;
  }

  .login-title {
    font-size: 32px;
  }
}
</style>
