<script setup lang="ts">
import { computed, shallowRef } from "vue";
import {
  CopyOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  FolderOpenOutlined,
  RobotOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const workspace = useWorkspace();
const groupModalOpen = shallowRef(false);
const targetGroup = shallowRef("");

const selectedCount = computed(() => workspace.selectedEntryIds.value.length);

function confirmMigrate() {
  workspace.migrateGroup(workspace.selectedEntryIds.value, targetGroup.value);
  targetGroup.value = "";
  groupModalOpen.value = false;
}

async function handleAutoTranslate() {
  const result = await workspace.autoTranslateSelected();

  if (result.changedCount) {
    message.success(`已填充 ${result.changedCount} 处译文`);
    return;
  }

  message.info("已选词条没有空白译文需要填充");
}
</script>

<template>
  <a-alert v-if="selectedCount" class="batch-bar" type="info" show-icon>
    <template #message>
      <div class="batch-content">
        <span>已选 {{ selectedCount }} 条词条</span>
        <a-space wrap>
          <a-button
            size="small"
            @click="workspace.duplicateEntries(workspace.selectedEntryIds.value)"
          >
            <template #icon>
              <CopyOutlined />
            </template>
            批量复制
          </a-button>
          <a-button size="small" @click="groupModalOpen = true">
            <template #icon>
              <FolderOpenOutlined />
            </template>
            迁移分组
          </a-button>
          <a-button
            size="small"
            :loading="workspace.machineBusy.value"
            @click="handleAutoTranslate"
          >
            <template #icon>
              <RobotOutlined />
            </template>
            自动翻译
          </a-button>
          <a-button
            size="small"
            @click="workspace.deprecateEntries(workspace.selectedEntryIds.value)"
          >
            <template #icon>
              <DisconnectOutlined />
            </template>
            作废下线
          </a-button>
          <a-popconfirm
            title="确定删除已选词条？"
            ok-text="删除"
            cancel-text="取消"
            @confirm="workspace.deleteEntries(workspace.selectedEntryIds.value)"
          >
            <a-button danger size="small">
              <template #icon>
                <DeleteOutlined />
              </template>
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </div>
    </template>
  </a-alert>

  <a-modal
    v-model:open="groupModalOpen"
    title="批量迁移分组"
    ok-text="迁移"
    cancel-text="取消"
    @ok="confirmMigrate"
  >
    <a-input v-model:value="targetGroup" placeholder="例如 order.list" />
  </a-modal>
</template>

<style scoped>
.batch-bar {
  border: 1px solid color-mix(in srgb, var(--dt-primary) 20%, var(--dt-border));
  border-radius: var(--dt-radius);
  background: var(--dt-primary-soft);
}

.batch-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--dt-primary-strong);
  font-weight: 750;
}

@media (max-width: 760px) {
  .batch-content {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
