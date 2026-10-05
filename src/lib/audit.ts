import { prisma } from "./db";

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  detail?: string
) {
  await prisma.auditLog.create({
    data: { actorId, action, entity, entityId, detail },
  });
}
