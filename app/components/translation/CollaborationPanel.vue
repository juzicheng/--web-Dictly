<script setup lang="ts">
import { reactive } from "vue";
import type { TableColumnsType } from "ant-design-vue";
import type { ProjectMember, UserRole } from "../../types/dictly";

const workspace = useWorkspace();

const memberColumns: TableColumnsType<ProjectMember> = [
  { title: "成员", key: "member" },
  { title: "角色", key: "role", width: 180 },
];

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "管理员", value: "admin" },
  { label: "维护者", value: "maintainer" },
  { label: "翻译", value: "translator" },
  { label: "审核", value: "reviewer" },
  { label: "只读", value: "viewer" },
];

const form = reactive({
  name: "",
  email: "",
  role: "translator" as UserRole,
});

function invite() {
  workspace.addMember({
    name: form.name || form.email,
    email: form.email,
    role: form.role,
  });
  form.name = "";
  form.email = "";
  form.role = "translator";
}
</script>

<template>
  <section class="collaboration-grid">
    <a-card class="dense-card collaboration-card" title="成员角色" :bordered="false">
      <div class="invite-shell">
        <a-form class="invite-form" layout="vertical" :model="form" @finish="invite">
          <a-row :gutter="8">
            <a-col :xs="24" :md="8">
              <a-form-item label="姓名">
                <a-input v-model:value="form.name" placeholder="姓名" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="10">
              <a-form-item
                label="邮箱"
                name="email"
                :rules="[{ required: true, message: '请输入邮箱' }]"
              >
                <a-input v-model:value="form.email" placeholder="name@company.com" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="6">
              <a-form-item label="角色">
                <a-select v-model:value="form.role" :options="roleOptions" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-button type="primary" html-type="submit">邀请成员</a-button>
        </a-form>
      </div>

      <a-table
        row-key="id"
        size="middle"
        :columns="memberColumns"
        :data-source="workspace.currentProject.value?.members ?? []"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'member'">
            <a-space>
              <a-avatar>{{ record.name.slice(0, 1).toUpperCase() }}</a-avatar>
              <span>
                <a-typography-text strong>{{ record.name }}</a-typography-text>
                <span class="member-email">{{ record.email }}</span>
              </span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'role'">
            <a-select
              :value="record.role"
              class="role-select"
              :options="roleOptions"
              @update:value="
                (value: unknown) => workspace.updateMemberRole(record.id, value as UserRole)
              "
            />
          </template>
        </template>
      </a-table>
    </a-card>

    <a-card class="dense-card collaboration-card" title="审计活动" :bordered="false">
      <a-timeline>
        <a-timeline-item
          v-for="activity in workspace.currentProject.value?.activities ?? []"
          :key="activity.id"
        >
          <a-typography-text strong>{{ activity.actor }}</a-typography-text>
          {{ activity.action }}
          <a-typography-text code>{{ activity.target }}</a-typography-text>
          <div class="muted">{{ new Date(activity.at).toLocaleString() }}</div>
        </a-timeline-item>
      </a-timeline>
    </a-card>
  </section>
</template>

<style scoped>
.collaboration-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 16px;
}

.invite-form {
  margin: 0;
}

.invite-shell {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
}

.member-email {
  display: block;
  color: var(--dt-muted);
  font-size: 12px;
}

.role-select {
  width: 140px;
}

.collaboration-card :deep(.ant-timeline-item-tail) {
  border-inline-start-color: var(--dt-border);
}

.collaboration-card :deep(.ant-timeline-item-head) {
  border-color: var(--dt-primary);
}

@media (max-width: 980px) {
  .collaboration-grid {
    grid-template-columns: 1fr;
  }
}
</style>
