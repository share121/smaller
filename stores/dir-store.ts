import { defineStore } from "pinia";
import { Child, Command } from "@tauri-apps/plugin-shell";

type Dir = {
  name: string;
  path: string;
  compactAlgorithm: CompactAlgorithm;
  output: OuputType[];
  process?: Child;
  showOutput: boolean;
};

type OuputType = {
  type: "success" | "error" | "info";
  message: string;
  time: Date;
};

type CompactAlgorithm = "XPRESS4K" | "XPRESS8K" | "XPRESS16K" | "LZX";

export const useMyDirStore = defineStore("myDirStore", () => {
  const dirList = ref([] as Dir[]);

  function addDir(...dirpath: string[]) {
    function addSingleDir(dirpath: string) {
      if (dirList.value.some((d) => d.path === dirpath)) return;
      dirList.value.push({
        name: dirpath.split(/\\|\//).pop() || dirpath,
        path: dirpath,
        compactAlgorithm: "LZX",
        output: [],
        showOutput: false,
      });
    }
    dirpath.forEach(addSingleDir);
  }

  const outputLength = ref(100);

  function addOutput(dir: Dir, output: OuputType) {
    if (!output.message.trim().length) return;
    dir.output.unshift(output);
    if (dir.output.length > outputLength.value) {
      dir.output.length = outputLength.value;
    }
  }

  async function removeDir(...dirpath: string[]) {
    async function removeSingleDir(dirpath: string) {
      const index = dirList.value.findIndex((d) => d.path === dirpath);
      if (index > -1) {
        const p = dirList.value[index].process?.kill();
        dirList.value.splice(index, 1);
        await p;
      }
    }
    await Promise.all(dirpath.map(removeSingleDir));
  }

  function clearDirs() {
    const p = Promise.all(dirList.value.map((dir) => dir.process?.kill()));
    dirList.value = [];
    return p;
  }

  async function compact(dir: Dir) {
    await dir.process?.kill();
    dir.output = [];
    dir.showOutput = true;

    // compact /c /s /i /f /exe LZX *
    const command = Command.create(
      "compact",
      ["/c", "/s", "/i", "/f", "/exe", dir.compactAlgorithm, "*"],
      { encoding: "gbk", cwd: dir.path }
    );
    command.on("close", (data) =>
      addOutput(dir, {
        type: "success",
        message: `压缩执行完毕，代码为 ${data.code}，信号为 ${data.signal}`,
        time: new Date(),
      })
    );
    command.on("error", (error) =>
      addOutput(dir, {
        type: "error",
        message: `压缩错误：${error}`,
        time: new Date(),
      })
    );
    command.stdout.on("data", (line) =>
      addOutput(dir, {
        type: "info",
        message: line,
        time: new Date(),
      })
    );
    command.stderr.on("data", (line) =>
      addOutput(dir, {
        type: "info",
        message: line,
        time: new Date(),
      })
    );

    const child = await command.spawn();
    dir.process = child;
    addOutput(dir, {
      type: "info",
      message: `压缩进程 pid：${child.pid}`,
      time: new Date(),
    });
  }

  function compactAll() {
    return Promise.all(dirList.value.map(compact));
  }

  async function uncompact(dir: Dir) {
    await dir.process?.kill();
    dir.output = [];
    dir.showOutput = true;

    // compact /u /s /i /f *
    const command = Command.create("uncompact", ["/u", "/s", "/i", "/f", "*"], {
      encoding: "gbk",
      cwd: dir.path,
    });
    command.on("close", (data) =>
      addOutput(dir, {
        type: "success",
        message: `解压执行完毕，代码为 ${data.code}，信号为 ${data.signal}`,
        time: new Date(),
      })
    );
    command.on("error", (error) =>
      addOutput(dir, {
        type: "error",
        message: `解压错误：${error}`,
        time: new Date(),
      })
    );
    command.stdout.on("data", (line) =>
      addOutput(dir, {
        type: "info",
        message: line,
        time: new Date(),
      })
    );
    command.stderr.on("data", (line) =>
      addOutput(dir, {
        type: "info",
        message: line,
        time: new Date(),
      })
    );

    const child = await command.spawn();
    dir.process = child;
    addOutput(dir, {
      type: "info",
      message: `解压进程 pid：${child.pid}`,
      time: new Date(),
    });
  }

  function uncompactAll() {
    return Promise.all(dirList.value.map(uncompact));
  }

  function hideOutputAll() {
    dirList.value.forEach((dir) => (dir.showOutput = false));
  }

  function showOutputAll() {
    dirList.value.forEach((dir) => (dir.showOutput = true));
  }

  return {
    dirList,
    addDir,
    removeDir,
    clearDirs,
    compact,
    uncompact,
    compactAll,
    uncompactAll,
    hideOutputAll,
    showOutputAll,
  };
});
