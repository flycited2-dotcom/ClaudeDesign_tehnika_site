"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  leadId: z.string().min(5).max(80),
  status: z.enum(["NEW", "HANDLED"]),
});

const deleteSchema = z.object({
  leadId: z.string().min(5).max(80),
});

export async function setLeadStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = schema.parse({
    leadId: String(formData.get("leadId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  await prisma.lead.update({
    where: { id: parsed.leadId },
    data: { status: parsed.status },
  });

  revalidatePath("/admin/leads");
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = deleteSchema.parse({
    leadId: String(formData.get("leadId") ?? ""),
  });

  await prisma.lead.delete({
    where: { id: parsed.leadId },
  });

  revalidatePath("/admin/leads");
}
