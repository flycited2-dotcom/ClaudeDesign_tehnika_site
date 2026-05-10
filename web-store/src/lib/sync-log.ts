import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function startSyncLog(type: string) {
  return prisma.syncLog.create({
    data: {
      type,
      status: "running",
    },
  });
}

export async function finishSyncLog(
  id: string,
  data: {
    status: "success" | "error";
    message?: string;
    total?: number;
    processed?: number;
    failed?: number;
    commandId?: number;
    payload?: Prisma.InputJsonValue;
  },
) {
  return prisma.syncLog.update({
    where: { id },
    data: {
      ...data,
      finishedAt: new Date(),
    },
  });
}

export async function updateSyncLogProgress(
  id: string,
  data: {
    message?: string;
    total?: number;
    processed?: number;
    failed?: number;
    payload?: Prisma.InputJsonValue;
  },
) {
  return prisma.syncLog.update({
    where: { id },
    data,
  });
}

export function sanitizePayload(payload: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(payload, (key, value) => {
      if (["password", "session"].includes(key.toLowerCase())) {
        return "[redacted]";
      }

      return value;
    }),
  ) as Prisma.InputJsonValue;
}
