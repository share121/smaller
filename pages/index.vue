<template>
  <button class="pick-btn" @click="pickDirs">选择压缩的文件</button>
  <div class="dir-list-container">
    <div class="dir-list" v-for="dir in myDirStore.dirList" :key="dir.path">
      <div class="dir-info">
        <div class="dir-name">{{ dir.name }}</div>
        <div class="dir-path">{{ dir.path }}</div>
      </div>
      <div class="dir-actions">
        <button class="dir-btn" @click="() => myDirStore.removeDir(dir.path)">
          删除
        </button>
        <button class="dir-btn" @click="() => myDirStore.compact(dir)">
          压缩
        </button>
        <button class="dir-btn" @click="() => myDirStore.uncompact(dir)">
          解压
        </button>
        <button
          class="dir-btn"
          @click="() => (dir.showOutput = !dir.showOutput)"
        >
          详情
        </button>
      </div>
      <Transition name="dir-actions-output">
        <div v-if="dir.showOutput" class="dir-actions-output">
          <div
            v-for="output in dir.output"
            :key="output.time.getTime()"
            class="output-item"
          >
            <span class="output-time" :class="[output.type]">{{
              output.time.toLocaleTimeString()
            }}</span>
            {{ output.message }}
          </div>
        </div>
      </Transition>
    </div>
  </div>
  <div class="dir-batch-actions">
    <button class="dir-btn" @click="myDirStore.clearDirs">清空</button>
    <button class="dir-btn" @click="myDirStore.compactAll">压缩</button>
    <button class="dir-btn" @click="myDirStore.uncompactAll">解压</button>
    <button class="dir-btn" @click="myDirStore.hideOutputAll">收起</button>
    <button class="dir-btn" @click="myDirStore.showOutputAll">展开</button>
  </div>
  <Transition name="fade">
    <div class="drag-area" v-if="dragging">拖动到此处</div>
  </Transition>
</template>

<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";
import { useMyDirStore } from "~/stores/dir-store";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { stat } from "@tauri-apps/plugin-fs";

const myDirStore = useMyDirStore();
const dragging = ref(false);

async function pickDirs() {
  const dirs = await open({
    multiple: true,
    directory: true,
  });
  if (!dirs) return;
  myDirStore.addDir(...dirs);
}

getCurrentWebview().listen("tauri://drag-drop", async (event) => {
  dragging.value = false;
  const paths = (event.payload as { paths: string[] }).paths;
  for (const path of paths) {
    const fileStat = await stat(path);
    if (fileStat.isDirectory) myDirStore.addDir(path);
  }
});
getCurrentWebview().listen("tauri://drag-enter", () => {
  dragging.value = true;
});
getCurrentWebview().listen("tauri://drag-leave", () => {
  dragging.value = false;
});
</script>

<style>
.pick-btn {
  display: block;
  margin: 16px;
  margin-bottom: 0;
  padding: 32px 16px;
  border: #2b2b2b dashed 8px;
  border-radius: 4px;
  width: calc(100% - 32px);
  font-size: 24px;
  color: #fff;
  background-color: #181818;
  transition: background-color 0.2s ease-out;
  cursor: pointer;
}

.pick-btn:hover {
  background-color: #242424;
}

.dir-list-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  min-height: 100px;
  overflow: auto;
}

.dir-list {
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.2s ease-out;
  background-color: #1f1f1f;
}

.dir-list:hover {
  background-color: #242424;
}

.dir-name {
  font-size: 18px;
  font-weight: bold;
}

.dir-path {
  color: #ccc;
}

.dir-actions {
  display: flex;
  flex-wrap: wrap;
  margin-top: 4px;
  gap: 4px;
}

.dir-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: #2d2e2e;
  cursor: pointer;
  color: #fff;
  transition: background-color 0.2s ease-out;
}

.dir-actions > .dir-btn {
  flex: 1;
}

.dir-btn:hover {
  background-color: #3a3b3b;
}

.dir-actions-output {
  margin-top: 8px;
  padding: 12px;
  height: 150px;
  border-radius: 8px;
  overflow: auto;
  background-color: #181818;
  font-family: "FiraCode Nerd Font", ui-monospace, "Menlo", "Monaco", "Consolas",
    "Liberation Mono", "Courier New", "HarmonyOS Sans SC", "Punctuation SC",
    "Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu,
    Cantarell, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol", "Noto Color Emoji";
}
.dir-actions-output-enter-active,
.dir-actions-output-leave-active {
  transition: height 0.5s ease, padding-top 0.5s ease, padding-bottom 0.5s ease,
    margin-top 0.5s ease;
}
.dir-actions-output-enter-from,
.dir-actions-output-leave-to {
  overflow: hidden;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
  height: 0;
}

.output-time {
  color: #b4b4b4;
}
.output-time.error {
  color: rgb(182, 0, 0);
}
.output-time.success {
  color: rgb(0, 163, 0);
}
.dir-batch-actions {
  padding: 16px;
  padding-top: 0;
  display: flex;
  gap: 4px;
  min-height: fit-content;
  overflow: auto;
}
.dir-batch-actions > .dir-btn {
  flex: 1;
}

.drag-area {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #1818189f;
  z-index: 999;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
