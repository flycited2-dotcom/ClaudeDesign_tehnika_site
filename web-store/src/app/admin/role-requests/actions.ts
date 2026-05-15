"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { buildRoleApprovedEmail, buildRoleRejectedEmail, sendMail } from "@/lib/mailer";

const reviewSchema = z.object({
  requestId: z.string().min(5).max(80),
  reviewNote: z.string().trim().max(2000).optional(),
});

function adminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "admin";
}

export async function approveRoleUpgradeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = reviewSchema.parse({
    requestId: String(formData.get("requestId") ?? ""),
    reviewNote: formData.get("reviewNote") ? String(formData.get("reviewNote")) : undefined,
  });

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.roleUpgradeRequest.findUnique({ where: { id: parsed.requestId } });
    if (!request) throw new Error("Request not found");
    if (request.status !== "PENDING") return { transitioned: false as const };

    await tx.user.update({
      where: { id: request.userId },
      data: {
        role: request.requestedRole,
        orgName: request.orgName,
        inn: request.inn,
        phone: request.phone,
      },
    });
    const updated = await tx.roleUpgradeRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: adminEmail(),
        reviewNote: parsed.reviewNote || null,
      },
    });
    return { transitioned: true as const, request: updated };
  });

  if (result.transitioned) {
    const user = await prisma.user.findUnique({ where: { id: result.request.userId } });
    if (user) {
      const mail = buildRoleApprovedEmail({
        role: result.request.requestedRole === "B2B" ? "b2b" : "gov",
        orgName: result.request.orgName,
      });
      await sendMail({ to: user.email, subject: mail.subject, text: mail.text, html: mail.html });
    }
  }

  revalidatePath("/admin/role-requests");
}

export async function rejectRoleUpgradeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = reviewSchema.parse({
    requestId: String(formData.get("requestId") ?? ""),
    reviewNote: formData.get("reviewNote") ? String(formData.get("reviewNote")) : undefined,
  });

  const updated = await prisma.roleUpgradeRequest.update({
    where: { id: parsed.requestId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedBy: adminEmail(),
      reviewNote: parsed.reviewNote || null,
    },
    include: { user: true },
  });

  if (updated.user) {
    const mail = buildRoleRejectedEmail({
      role: updated.requestedRole === "B2B" ? "b2b" : "gov",
      orgName: updated.orgName,
      note: updated.reviewNote,
    });
    await sendMail({ to: updated.user.email, subject: mail.subject, text: mail.text, html: mail.html });
  }

  revalidatePath("/admin/role-requests");
}
