<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ask } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

check().then(async (update) => {
  if (update) {
    const answer = await ask(
      `${update.currentVersion} --> ${update.version}
发布日期：${update.date}
更新内容：${update.body ?? "修复了一些已知问题"}
rid：${update.rid}`,
      {
        title: "检测到新版本",
        kind: "warning",
        cancelLabel: "取消",
        okLabel: "更新",
      }
    );
    if (answer) {
      await update.downloadAndInstall();
      await relaunch();
    }
  }
});
</script>
