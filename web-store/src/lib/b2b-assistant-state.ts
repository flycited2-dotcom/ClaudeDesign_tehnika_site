import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { b2bAssistantStateFile } from "@/lib/b2b-assistant-config";

type BotState = {
  lastUpdateId: number;
  updatedAt: string;
};

function statePath(): string {
  return resolve(process.cwd(), b2bAssistantStateFile());
}

export async function readB2bAssistantOffset(): Promise<number | undefined> {
  try {
    const state = JSON.parse(await readFile(statePath(), "utf8")) as Partial<BotState>;
    return Number.isSafeInteger(state.lastUpdateId) && Number(state.lastUpdateId) >= 0
      ? Number(state.lastUpdateId) + 1
      : undefined;
  } catch {
    return undefined;
  }
}

export async function saveB2bAssistantUpdateId(updateId: number): Promise<void> {
  if (!Number.isSafeInteger(updateId) || updateId < 0) return;
  const target = statePath();
  const temporary = `${target}.${process.pid}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(
    temporary,
    JSON.stringify({ lastUpdateId: updateId, updatedAt: new Date().toISOString() } satisfies BotState),
    "utf8",
  );
  await rename(temporary, target);
}
