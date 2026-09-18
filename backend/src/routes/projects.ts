import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).default('active'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  parentId: z.string().optional(),
  isLocked: z.boolean().optional(),
  contactIds: z.array(z.string()).optional().default([]),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  parentId: z.string().optional().nullable(),
  isLocked: z.boolean().optional(),
  contactIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  const { status, flat } = req.query;
  const where: any = {};
  if (status) where.status = status;

  // Не-админ видит только проекты, к которым привязан
  if (req.user?.role !== 'admin') {
    where.users = { some: { userId: req.user!.id } };
  }

  if (flat === 'true') {
    const projects = await prisma.project.findMany({
      where,
      select: { id: true, name: true, status: true, parentId: true, isLocked: true },
      orderBy: { name: 'asc' },
    });
    return res.json(projects);
  }

  // Return ALL projects (not just root) for tree view
  const projects = await prisma.project.findMany({
    where,
    include: {
      _count: { select: { tasks: true, deals: true } },
      tasks: { select: { status: true } },
      contacts: { include: { contact: { select: { id: true, name: true, kind: true } } } },
      users: { include: { user: { select: { id: true, name: true, avatar: true, role: { select: { label: true } } } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const calcProgress = (p: any) => {
    const total = p.tasks?.length || 0;
    const done = p.tasks?.filter((t: any) => t.status === 'win').length || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const enriched = projects.map(p => ({
    ...p,
    progress: calcProgress(p),
    tasks: undefined,
  }));
  res.json(enriched);
});

router.get('/:id', async (req: AuthRequest, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      tasks: { select: { id: true, title: true, status: true, priority: true } },
      deals: { select: { id: true, title: true, value: true, stage: true } },
      contacts: { include: { contact: { select: { id: true, name: true, kind: true, company: true } } } },
      users: { include: { user: { select: { id: true, name: true, avatar: true, role: { select: { label: true } } } } } },
      children: {
        include: {
          _count: { select: { tasks: true, deals: true } },
          tasks: { select: { status: true } },
        },
      },
      parent: { select: { id: true, name: true } },
    },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  // Не-админ может открыть только свой проект
  if (req.user?.role !== 'admin' && !project.users.some((u: any) => u.userId === req.user!.id)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  const total = (project.tasks?.length || 0) + (project.children || []).reduce((sum, c) => sum + (c.tasks?.length || 0), 0);
  const done = (project.tasks?.filter(t => t.status === 'win').length || 0) + (project.children || []).reduce((sum, c) => sum + (c.tasks?.filter(t => t.status === 'win').length || 0), 0);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  res.json({ ...project, progress, tasks: undefined });
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createSchema.parse(req.body);
    const { contactIds, userIds, ...rest } = data;
    const project = await prisma.project.create({
      data: {
        ...rest,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        parentId: data.parentId || undefined,
        contacts: contactIds?.length ? {
          create: contactIds.map(cid => ({ contact: { connect: { id: cid } } })),
        } : undefined,
        // Создатель автоматически становится участником своего проекта
        users: {
          create: [
            { userId: req.user!.id },
            ...userIds.filter(uid => uid !== req.user!.id).map(uid => ({ userId: uid })),
          ],
        },
      },
      include: {
        contacts: { include: { contact: { select: { id: true, name: true, kind: true } } } },
        users: { include: { user: { select: { id: true, name: true, avatar: true, role: { select: { label: true } } } } } },
      },
    });
    res.status(201).json(project);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);
    if (data.parentId) {
      if (data.parentId === req.params.id) {
        return res.status(400).json({ error: 'Project cannot be its own parent' });
      }
      const isDescendant = async (parentId: string, targetId: string): Promise<boolean> => {
        const children = await prisma.project.findMany({ where: { parentId }, select: { id: true } });
        for (const child of children) {
          if (child.id === targetId) return true;
          if (await isDescendant(child.id, targetId)) return true;
        }
        return false;
      };
      if (await isDescendant(req.params.id, data.parentId)) {
        return res.status(400).json({ error: 'Cannot set a descendant as parent' });
      }
    }
    const { contactIds, userIds, ...restData } = data;
    const updateData: any = {
      ...restData,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      parentId: data.parentId === null ? null : data.parentId || undefined,
    };

    if (contactIds !== undefined) {
      await prisma.contactProject.deleteMany({ where: { projectId: req.params.id } });
      if (contactIds.length > 0) {
        await prisma.contactProject.createMany({
          data: contactIds.map((cid: string) => ({ contactId: cid, projectId: req.params.id })),
          skipDuplicates: true,
        });
      }
    }

    if (userIds !== undefined) {
      // Создатель проекта не может быть отвязан — иначе потеряет к нему доступ
      const protectedIds = new Set([req.user!.id]);
      await prisma.projectUser.deleteMany({
        where: { projectId: req.params.id, userId: { notIn: [...protectedIds] } },
      });
      const newUserIds = userIds.filter(uid => uid !== req.user!.id);
      if (newUserIds.length > 0) {
        await prisma.projectUser.createMany({
          data: newUserIds.map((uid: string) => ({ userId: uid, projectId: req.params.id })),
          skipDuplicates: true,
        });
      }
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        contacts: { include: { contact: { select: { id: true, name: true, kind: true } } } },
        users: { include: { user: { select: { id: true, name: true, avatar: true, role: { select: { label: true } } } } } },
      },
    });
    res.json(project);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
