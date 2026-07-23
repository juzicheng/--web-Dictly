<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue";
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FieldTimeOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  ProfileOutlined,
} from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import type { DictlyProject } from "../../types/dictly";

const auth = useAuth();
const workspace = useWorkspace();
const editModalOpen = shallowRef(false);
const editingProjectId = shallowRef<string | null>(null);

const editForm = reactive({
  name: "",
  teamName: "",
  description: "",
  modulesText: "",
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 11) {
    return "早上好";
  }
  if (hour < 18) {
    return "下午好";
  }
  return "晚上好";
});

const roleLabel = computed(() => {
  const role = auth.user.value?.role;
  if (role === "admin") {
    return "管理员";
  }
  return "普通用户";
});

const metrics = computed(() => [
  {
    label: "可访问项目",
    value: workspace.dashboardStats.value.projectCount,
    icon: FolderOpenOutlined,
    color: "#1f6feb",
  },
  {
    label: "词条总数",
    value: workspace.dashboardStats.value.entryCount,
    icon: ProfileOutlined,
    color: "#8250df",
  },
  {
    label: "启用语种",
    value: workspace.dashboardStats.value.localeCount,
    icon: GlobalOutlined,
    color: "#0969da",
  },
  {
    label: "待处理",
    value: workspace.dashboardStats.value.pendingCount,
    icon: FieldTimeOutlined,
    color: "#bf8700",
  },
  {
    label: "已审核",
    value: workspace.dashboardStats.value.approvedCount,
    icon: CheckCircleOutlined,
    color: "#2da44e",
  },
]);

function openProject(projectId: string) {
  workspace.setProject(projectId);
  navigateTo("/workspace");
}

function parseModules(value: string) {
  const modules = value
    .split(/[\n,，、;；]+/)
    .map((module) => module.trim())
    .filter(Boolean);

  return Array.from(new Set(modules));
}

function duplicateProject(project: DictlyProject) {
  const copied = workspace.duplicateProject(project.id);
  if (copied) {
    message.success(`已创建「${copied.name}」`);
  }
}

function openProjectEditor(project: DictlyProject) {
  editingProjectId.value = project.id;
  editForm.name = project.name;
  editForm.teamName = project.teamName;
  editForm.description = project.description;
  editForm.modulesText = project.modules.join("，");
  editModalOpen.value = true;
}

function closeProjectEditor() {
  editModalOpen.value = false;
  editingProjectId.value = null;
}

function saveProjectEdit() {
  if (!editingProjectId.value) {
    return;
  }

  if (!editForm.name.trim()) {
    message.error("请输入项目名称");
    return;
  }

  if (!editForm.teamName.trim()) {
    message.error("请输入团队名称");
    return;
  }

  workspace.updateProject(editingProjectId.value, {
    name: editForm.name,
    teamName: editForm.teamName,
    description: editForm.description,
    modules: parseModules(editForm.modulesText),
  });
  message.success("项目已更新");
  closeProjectEditor();
}

function confirmDeleteProject(project: DictlyProject) {
  Modal.confirm({
    title: "删除项目",
    content: `确定删除「${project.name}」？项目下的词条、术语、成员和导出配置都会被移除。`,
    okText: "删除",
    cancelText: "取消",
    okButtonProps: { danger: true },
    onOk: () => {
      if (workspace.deleteProject(project.id)) {
        message.success("项目已删除");
      }
    },
  });
}

</script>

<template>
  <div class="page-stack">
    <section class="section-band hero-band">
      <div>
        <p class="eyebrow">{{ greeting }}，{{ auth.user.value?.displayName }}</p>
        <h1 class="section-title">翻译项目概览</h1>
        <p class="muted">当前身份：{{ roleLabel }} · {{ auth.user.value?.email }}</p>
      </div>
      <a-button type="primary" size="large" @click="navigateTo('/workspace')">
        进入工作台
      </a-button>
    </section>

    <section class="metric-grid">
      <a-card v-for="metric in metrics" :key="metric.label" class="metric-card" :bordered="false">
        <a-space align="start" :size="12">
          <span class="metric-icon" :style="{ backgroundColor: metric.color }">
            <component :is="metric.icon" />
          </span>
          <span>
            <span class="metric-value">{{ metric.value }}</span>
            <span class="metric-label">{{ metric.label }}</span>
          </span>
        </a-space>
      </a-card>
    </section>

    <section class="section-band">
      <div class="section-heading">
        <div>
          <h2 class="section-title">项目</h2>
          <p class="muted">团队 → 项目 → 模块分层管理，不同产品线词条相互隔离。</p>
        </div>
      </div>

      <div class="project-grid">
        <a-card
          v-for="project in workspace.projects.value"
          :key="project.id"
          class="project-card"
          hoverable
          @click="openProject(project.id)"
        >
          <a-space direction="vertical" :size="10" class="project-card-body">
            <div class="project-card-header">
              <a-space wrap>
                <a-tag color="blue">{{ project.teamName }}</a-tag>
                <a-tag>
                  {{ project.locales.filter((locale) => locale.enabled).length }} 语种
                </a-tag>
              </a-space>
              <span class="project-menu-wrap" @click.stop>
                <a-dropdown
                  :trigger="['click']"
                  placement="bottomRight"
                >
                  <a-button
                    type="text"
                    shape="circle"
                    class="project-menu-trigger"
                    aria-label="项目操作"
                  >
                    <template #icon>
                      <EllipsisOutlined />
                    </template>
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item key="duplicate" @click="duplicateProject(project)">
                        <CopyOutlined />
                        <span>创建副本</span>
                      </a-menu-item>
                      <a-menu-item key="edit" @click="openProjectEditor(project)">
                        <EditOutlined />
                        <span>编辑</span>
                      </a-menu-item>
                      <a-menu-item key="delete" danger @click="confirmDeleteProject(project)">
                        <DeleteOutlined />
                        <span>删除</span>
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </span>
            </div>
            <h3 class="project-name">{{ project.name }}</h3>
            <p class="muted project-description">{{ project.description }}</p>
            <div class="module-list">
              <a-tag v-for="module in project.modules" :key="module">{{ module }}</a-tag>
            </div>
          </a-space>
        </a-card>
      </div>
    </section>

    <a-modal
      v-model:open="editModalOpen"
      title="编辑项目"
      ok-text="保存"
      cancel-text="取消"
      :destroy-on-close="true"
      @ok="saveProjectEdit"
      @cancel="closeProjectEditor"
    >
      <a-form layout="vertical" :model="editForm">
        <a-form-item label="项目名称" required>
          <a-input v-model:value="editForm.name" placeholder="请输入项目名称" />
        </a-form-item>
        <a-form-item label="团队名称" required>
          <a-input v-model:value="editForm.teamName" placeholder="请输入团队名称" />
        </a-form-item>
        <a-form-item label="项目描述">
          <a-textarea
            v-model:value="editForm.description"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </a-form-item>
        <a-form-item label="模块">
          <a-textarea
            v-model:value="editForm.modulesText"
            :rows="3"
            placeholder="例如 Web端，APP安卓，后台管理"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.hero-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #1f6feb;
  font-weight: 600;
}

.metric-card {
  border: 1px solid #d8dee4;
}

.metric-icon {
  display: inline-grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #ffffff;
  border-radius: 8px;
}

.metric-value {
  display: block;
  color: #24292f;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}

.metric-label {
  display: block;
  margin-top: 6px;
  color: #6e7781;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.project-card {
  min-width: 0;
  height: 100%;
  border-radius: 8px;
}

.project-card-body {
  width: 100%;
}

.project-card-header {
  display: flex;
  min-height: 32px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.project-menu-trigger {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  color: #57606a;
}

.project-menu-wrap {
  display: inline-flex;
  flex: 0 0 auto;
}

.project-name {
  margin: 0;
  color: #24292f;
  font-size: 18px;
}

.project-description {
  min-height: 44px;
  margin: 0;
}

.module-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 760px) {
  .hero-band {
    align-items: stretch;
    flex-direction: column;
  }

  .project-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 761px) and (max-width: 1280px) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
