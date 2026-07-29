<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue";
import {
  ApiOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FieldTimeOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  ProfileOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  TranslationOutlined,
} from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import type { AuditActivity, DictlyProject } from "../../types/dictly";

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

const trendBars = [42, 54, 48, 66, 62, 78, 71, 86, 79, 94, 88, 100];

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

const entryCount = computed(() => workspace.dashboardStats.value.entryCount);
const approvedRatio = computed(() => {
  if (!entryCount.value) {
    return 0;
  }
  return Math.round((workspace.dashboardStats.value.approvedCount / entryCount.value) * 100);
});
const insightScore = computed(() => Math.min(99, 84 + Math.round(approvedRatio.value / 6)));

const metrics = computed(() => [
  {
    label: "可访问项目",
    value: workspace.dashboardStats.value.projectCount,
    icon: FolderOpenOutlined,
    color: "purple",
    delta: "+2",
  },
  {
    label: "词条总数",
    value: workspace.dashboardStats.value.entryCount,
    icon: ProfileOutlined,
    color: "cyan",
    delta: "+18.6%",
  },
  {
    label: "启用语种",
    value: workspace.dashboardStats.value.localeCount,
    icon: GlobalOutlined,
    color: "green",
    delta: "+4",
  },
  {
    label: "待处理",
    value: workspace.dashboardStats.value.pendingCount,
    icon: FieldTimeOutlined,
    color: "orange",
    delta: "需关注",
  },
  {
    label: "已审核",
    value: workspace.dashboardStats.value.approvedCount,
    icon: CheckCircleOutlined,
    color: "yellow",
    delta: `${approvedRatio.value}%`,
  },
]);

const projectCards = computed(() =>
  workspace.projects.value.map((project) => {
    const targetLocales = project.locales.filter((locale) => locale.enabled && !locale.source);
    const approved = project.entries.filter((entry) => entry.status === "approved").length;
    const pending = project.entries.filter((entry) =>
      ["draft", "reviewing", "outdated"].includes(entry.status),
    ).length;
    const totalSlots = project.entries.length * targetLocales.length;
    const filledSlots = project.entries.reduce(
      (sum, entry) =>
        sum +
        targetLocales.filter((locale) => entry.translations[locale.code]?.trim()).length,
      0,
    );

    return {
      ...project,
      approved,
      pending,
      completion: totalSlots ? Math.round((filledSlots / totalSlots) * 100) : 0,
      localeCount: project.locales.filter((locale) => locale.enabled).length,
    };
  }),
);

const localeCoverage = computed(() => {
  const coverage = new Map<string, { code: string; name: string; count: number }>();
  for (const project of workspace.projects.value) {
    for (const locale of project.locales.filter((item) => item.enabled)) {
      const current = coverage.get(locale.code);
      coverage.set(locale.code, {
        code: locale.code,
        name: locale.name,
        count: (current?.count ?? 0) + 1,
      });
    }
  }
  return Array.from(coverage.values()).sort((left, right) => right.count - left.count);
});

const recentActivities = computed<Array<AuditActivity & { projectName: string }>>(() =>
  workspace.projects.value
    .flatMap((project) =>
      project.activities.map((activity) => ({
        ...activity,
        projectName: project.name,
      })),
    )
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 5),
);

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
  <div class="page-stack dashboard-page">
    <section class="dashboard-hero-grid">
      <article class="section-band portfolio-panel">
        <div class="portfolio-copy">
          <p class="eyebrow">{{ greeting }}，{{ auth.user.value?.displayName }}</p>
          <h1 class="section-title">翻译项目概览</h1>
          <p class="muted">当前身份：{{ roleLabel }} · {{ auth.user.value?.email }}</p>

          <div class="portfolio-value">
            <strong>{{ workspace.dashboardStats.value.entryCount }}</strong>
            <span>活跃词条资产</span>
          </div>

          <dl class="portfolio-facts">
            <div>
              <dt>项目</dt>
              <dd>{{ workspace.dashboardStats.value.projectCount }}</dd>
            </div>
            <div>
              <dt>通过率</dt>
              <dd>{{ approvedRatio }}%</dd>
            </div>
          </dl>
        </div>

        <div class="chart-card" aria-label="交付趋势">
          <div class="chart-head">
            <span>Localization Trend</span>
            <a-space :size="4">
              <a-tag>1M</a-tag>
              <a-tag color="blue">1Y</a-tag>
            </a-space>
          </div>
          <div class="bar-chart" aria-hidden="true">
            <span
              v-for="(bar, index) in trendBars"
              :key="index"
              :style="{ blockSize: `${bar}%` }"
            />
          </div>
          <div class="chart-axis">
            <span>Q1</span>
            <span>Q2</span>
            <span>Q3</span>
            <span>Q4</span>
          </div>
        </div>
      </article>

      <aside class="section-band insight-panel">
        <div class="insight-head">
          <span>
            <ApiOutlined />
            AI Insight
          </span>
          <a-tag color="green">High Confidence</a-tag>
        </div>

        <p class="insight-copy">
          当前项目组合覆盖 {{ workspace.dashboardStats.value.localeCount }} 个语言节点，审核通过词条占比
          {{ approvedRatio }}%，待办内容主要集中在移动端和风控类文案。
        </p>

        <div class="score-row">
          <div>
            <span>Portfolio Score</span>
            <strong>{{ insightScore }}<small>/100</small></strong>
          </div>
          <div class="score-ring" :style="{ '--score': `${insightScore}%` }" aria-hidden="true">
            <SafetyCertificateOutlined />
          </div>
        </div>

        <a-button block @click="navigateTo('/workspace')">
          进入工作台
          <TranslationOutlined />
        </a-button>
      </aside>
    </section>

    <section class="metric-grid dashboard-metrics">
      <a-card v-for="metric in metrics" :key="metric.label" class="metric-card" :bordered="false">
        <div class="metric-card-body">
          <div class="metric-top">
            <span class="metric-icon" :class="`tone-${metric.color}`">
              <component :is="metric.icon" />
            </span>
            <span class="metric-delta" :class="`tone-${metric.color}`">
              <RiseOutlined />
              {{ metric.delta }}
            </span>
          </div>
          <strong class="metric-value">{{ metric.value }}</strong>
          <span class="metric-label">{{ metric.label }}</span>
          <div class="dot-spark" :class="`tone-${metric.color}`" aria-hidden="true">
            <span v-for="index in 24" :key="index" />
          </div>
        </div>
      </a-card>
    </section>

    <section class="dashboard-content-grid">
      <section class="section-band project-section">
        <div class="section-heading">
          <div>
            <h2 class="section-title">项目</h2>
            <p class="muted">团队项目、模块边界和交付健康度。</p>
          </div>
          <a-button type="primary" @click="navigateTo('/workspace')">
            进入工作台
            <TranslationOutlined />
          </a-button>
        </div>

        <div class="project-grid">
          <article
            v-for="project in projectCards"
            :key="project.id"
            class="project-card"
            role="button"
            tabindex="0"
            @click="openProject(project.id)"
            @keydown.enter.prevent="openProject(project.id)"
          >
            <div class="project-card-header">
              <a-space wrap :size="[6, 6]">
                <a-tag color="blue">{{ project.teamName }}</a-tag>
                <a-tag>{{ project.localeCount }} 语种</a-tag>
              </a-space>
              <span class="project-menu-wrap" @click.stop>
                <a-dropdown :trigger="['click']" placement="bottomRight">
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

            <div class="project-progress">
              <div>
                <span>交付完整度</span>
                <strong>{{ project.completion }}%</strong>
              </div>
              <span class="progress-track">
                <span :style="{ inlineSize: `${project.completion}%` }" />
              </span>
            </div>

            <div class="project-meta-row">
              <span>{{ project.entries.length }} 词条</span>
              <span>{{ project.pending }} 待办</span>
              <span>{{ project.approved }} 已审</span>
            </div>

            <div class="module-list">
              <a-tag v-for="module in project.modules" :key="module">{{ module }}</a-tag>
            </div>
          </article>
        </div>
      </section>

      <aside class="dashboard-side-stack">
        <section class="section-band compact-panel">
          <div class="panel-head">
            <h2 class="section-title">语种覆盖</h2>
            <GlobalOutlined />
          </div>
          <div class="locale-list">
            <div v-for="locale in localeCoverage" :key="locale.code" class="locale-row">
              <span>
                <strong>{{ locale.code }}</strong>
                <small>{{ locale.name }}</small>
              </span>
              <em>{{ locale.count }} 项目</em>
            </div>
          </div>
        </section>

        <section class="section-band compact-panel">
          <div class="panel-head">
            <h2 class="section-title">最近审计</h2>
            <FieldTimeOutlined />
          </div>
          <div class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-row">
              <span class="activity-dot" />
              <span>
                <strong>{{ activity.actor }} {{ activity.action }}</strong>
                <small>{{ activity.target }}</small>
              </span>
            </div>
          </div>
        </section>
      </aside>
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
.dashboard-page {
  gap: 12px;
}

.dashboard-hero-grid,
.dashboard-content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 12px;
}

.portfolio-panel {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
  gap: 24px;
  align-items: stretch;
  min-height: 292px;
}

.portfolio-copy {
  display: grid;
  align-content: center;
  gap: 12px;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  color: var(--dt-primary-strong);
  font-weight: 750;
}

.portfolio-value {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 10px;
}

.portfolio-value strong {
  color: var(--dt-text);
  font-size: 3rem;
  line-height: 1;
  letter-spacing: 0;
}

.portfolio-value span {
  color: var(--dt-muted);
  font-weight: 650;
}

.portfolio-facts {
  display: flex;
  gap: 28px;
  margin: 16px 0 0;
}

.portfolio-facts div {
  display: grid;
  gap: 4px;
}

.portfolio-facts dt,
.portfolio-facts dd {
  margin: 0;
}

.portfolio-facts dt {
  color: var(--dt-muted);
  font-size: 0.82rem;
}

.portfolio-facts dd {
  color: var(--dt-text);
  font-size: 1.05rem;
  font-weight: 750;
}

.chart-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  background:
    linear-gradient(180deg, rgba(32, 201, 134, 0.22), rgba(255, 217, 73, 0.18) 44%, transparent),
    var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
}

.chart-head,
.chart-axis {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--dt-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.bar-chart {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-items: end;
  gap: 8px;
  min-height: 168px;
  padding-top: 16px;
  border-bottom: 1px dashed rgba(112, 113, 125, 0.28);
}

.bar-chart span {
  min-height: 20px;
  background: linear-gradient(180deg, var(--dt-green), var(--dt-yellow));
  border-radius: 999px 999px 4px 4px;
  box-shadow: 0 8px 18px rgba(32, 201, 134, 0.2);
}

.insight-panel {
  display: grid;
  align-content: space-between;
  gap: 20px;
  min-height: 292px;
}

.insight-head,
.panel-head,
.score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.insight-head span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--dt-text);
  font-size: 1rem;
  font-weight: 800;
}

.insight-copy {
  margin: 0;
  color: var(--dt-text);
  line-height: 1.7;
}

.score-row span {
  display: block;
  color: var(--dt-muted);
  font-size: 0.82rem;
}

.score-row strong {
  display: block;
  margin-top: 6px;
  color: var(--dt-green);
  font-size: 2rem;
  line-height: 1;
  letter-spacing: 0;
}

.score-row small {
  color: var(--dt-muted);
  font-size: 1rem;
  font-weight: 600;
}

.score-ring {
  display: grid;
  width: 86px;
  height: 86px;
  place-items: center;
  color: var(--dt-primary);
  background:
    radial-gradient(circle, var(--dt-surface) 55%, transparent 57%),
    conic-gradient(var(--dt-green) var(--score), var(--dt-yellow-soft) 0);
  border-radius: 50%;
}

.metric-card :deep(.ant-card-body) {
  padding: 0;
}

.metric-card-body {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.metric-icon {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #ffffff;
  border-radius: 8px;
}

.metric-delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 750;
}

.metric-value {
  color: var(--dt-text);
  font-size: 1.8rem;
  line-height: 1;
  letter-spacing: 0;
}

.metric-label {
  color: var(--dt-muted);
  font-size: 0.84rem;
}

.dot-spark {
  display: grid;
  grid-template-columns: repeat(12, 4px);
  gap: 4px;
  min-height: 18px;
  align-items: end;
  justify-content: end;
}

.dot-spark span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  opacity: 0.88;
}

.dot-spark span:nth-child(3n) {
  transform: translateY(-6px);
}

.dot-spark span:nth-child(4n) {
  transform: translateY(-11px);
}

.tone-purple.metric-icon,
.dot-spark.tone-purple span {
  background: var(--dt-primary);
}

.tone-cyan.metric-icon,
.dot-spark.tone-cyan span {
  background: var(--dt-cyan);
}

.tone-green.metric-icon,
.dot-spark.tone-green span {
  background: var(--dt-green);
}

.tone-orange.metric-icon,
.dot-spark.tone-orange span {
  background: var(--dt-orange);
}

.tone-yellow.metric-icon,
.dot-spark.tone-yellow span {
  background: var(--dt-yellow);
}

.metric-delta.tone-purple,
.metric-delta.tone-cyan,
.metric-delta.tone-green,
.metric-delta.tone-orange,
.metric-delta.tone-yellow {
  background: transparent;
}

.metric-delta.tone-purple {
  color: var(--dt-primary-strong);
}

.metric-delta.tone-cyan {
  color: #168fb0;
}

.metric-delta.tone-green {
  color: #0d9d65;
}

.metric-delta.tone-orange {
  color: #c56b11;
}

.metric-delta.tone-yellow {
  color: #9a7500;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-heading p {
  margin: 6px 0 0;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.project-card {
  display: grid;
  gap: 12px;
  min-width: 0;
  min-height: 232px;
  padding: 16px;
  cursor: pointer;
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;
}

.project-card:hover,
.project-card:focus-visible {
  border-color: color-mix(in srgb, var(--dt-primary) 32%, var(--dt-border));
  box-shadow: var(--dt-shadow);
  transform: translateY(-2px);
}

.project-card-header {
  display: flex;
  min-height: 32px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.project-menu-trigger {
  width: 32px;
  height: 32px;
  color: var(--dt-muted);
  background: var(--dt-surface);
  border: 1px solid var(--dt-border);
}

.project-menu-wrap {
  display: inline-flex;
  flex: 0 0 auto;
}

.project-name {
  margin: 0;
  color: var(--dt-text);
  font-size: 1.05rem;
  font-weight: 800;
}

.project-description {
  min-height: 42px;
  margin: 0;
  line-height: 1.6;
}

.project-progress {
  display: grid;
  gap: 8px;
}

.project-progress div,
.project-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.project-progress span,
.project-meta-row {
  color: var(--dt-muted);
  font-size: 0.78rem;
  font-weight: 650;
}

.project-progress strong {
  color: var(--dt-text);
}

.progress-track {
  display: block;
  height: 8px;
  overflow: hidden;
  background: #ecebf2;
  border-radius: 999px;
}

.progress-track span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--dt-green), var(--dt-yellow));
  border-radius: inherit;
}

.module-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: end;
}

.dashboard-side-stack {
  display: grid;
  gap: 12px;
  align-content: start;
}

.compact-panel {
  display: grid;
  gap: 14px;
}

.panel-head :deep(.anticon) {
  color: var(--dt-primary);
  font-size: 1.1rem;
}

.locale-list,
.activity-list {
  display: grid;
  gap: 10px;
}

.locale-row,
.activity-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
}

.locale-row {
  justify-content: space-between;
}

.locale-row span,
.activity-row span:last-child {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.locale-row strong,
.activity-row strong {
  overflow: hidden;
  color: var(--dt-text);
  font-size: 0.86rem;
  font-style: normal;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.locale-row small,
.activity-row small {
  overflow: hidden;
  color: var(--dt-muted);
  font-size: 0.74rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.locale-row em {
  flex: 0 0 auto;
  color: #0d9d65;
  font-size: 0.78rem;
  font-style: normal;
  font-weight: 750;
}

.activity-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  background: var(--dt-primary);
  border-radius: 50%;
}

@media (max-width: 86em) {
  .dashboard-hero-grid,
  .dashboard-content-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-side-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 62em) {
  .portfolio-panel {
    grid-template-columns: 1fr;
  }

  .project-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 44em) {
  .portfolio-value {
    align-items: flex-start;
    flex-direction: column;
  }

  .portfolio-value strong {
    font-size: 2.35rem;
  }

  .portfolio-facts,
  .section-heading,
  .project-meta-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-side-stack {
    grid-template-columns: 1fr;
  }
}
</style>
