import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import tasksRouter from './tasks-routes.js';
import { prisma } from '../../lib/prisma.js';
import type { Task, Prisma } from '@prisma/client';

// Mock Prisma
vi.mock('../../lib/prisma.js', () => ({
    prisma: {
        task: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
        },
    },
}));

describe('Tasks API', () => {
    const app = new Hono().route('/', tasksRouter);
    let mockTasks: Task[] = [];

    beforeEach(() => {
        mockTasks = [];
        vi.clearAllMocks();

        /* eslint-disable @typescript-eslint/no-explicit-any */
        // Setup mock implementations
        vi.mocked(prisma.task.findMany).mockImplementation((() => Promise.resolve(mockTasks)) as any);

        vi.mocked(prisma.task.findUnique).mockImplementation(((args: Prisma.TaskFindUniqueArgs) => {
            const task = mockTasks.find(t => t.id === args.where.id);
            return Promise.resolve(task || null);
        }) as any);

        vi.mocked(prisma.task.create).mockImplementation(((args: Prisma.TaskCreateArgs) => {
            const newTask: Task = {
                id: Math.random().toString(36).substring(7),
                ...args.data,
                completed: args.data.completed ?? false,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as Task;
            mockTasks.push(newTask);
            return Promise.resolve(newTask);
        }) as any);

        vi.mocked(prisma.task.update).mockImplementation(((args: Prisma.TaskUpdateArgs) => {
            const index = mockTasks.findIndex(t => t.id === args.where.id);
            if (index === -1) {
                return Promise.reject(new Error('Record to update not found.'));
            }
            mockTasks[index] = { ...mockTasks[index], ...args.data, updatedAt: new Date() } as Task;
            return Promise.resolve(mockTasks[index]);
        }) as any);

        vi.mocked(prisma.task.delete).mockImplementation(((args: Prisma.TaskDeleteArgs) => {
            const index = mockTasks.findIndex(t => t.id === args.where.id);
            if (index === -1) {
                return Promise.reject(new Error('Record to delete not found.'));
            }
            const deleted = mockTasks.splice(index, 1)[0];
            return Promise.resolve(deleted);
        }) as any);

        vi.mocked(prisma.task.deleteMany).mockImplementation((() => {
            mockTasks = [];
            return Promise.resolve({ count: 0 });
        }) as any);
        /* eslint-enable @typescript-eslint/no-explicit-any */
    });

    it('should return empty list initially', async () => {
        const res = await app.request('/');
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual([]);
    });

    it('should create a task', async () => {
        const res = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({ title: 'Test Task' }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.title).toBe('Test Task');
        expect(data.id).toBeDefined();
    });

    it('should get a task by id', async () => {
        // Create first
        const createRes = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({ title: 'Test Task' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const created = await createRes.json();

        // Get
        const res = await app.request(`/${created.id}`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.id).toBe(created.id);
        expect(data.title).toBe('Test Task');
    });

    it('should update a task', async () => {
        // Create first
        const createRes = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({ title: 'Test Task' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const created = await createRes.json();

        // Update
        const res = await app.request(`/${created.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ completed: true }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.completed).toBe(true);
    });

    it('should delete a task', async () => {
        // Create first
        const createRes = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({ title: 'Test Task' }),
            headers: { 'Content-Type': 'application/json' },
        });
        const created = await createRes.json();

        // Delete
        const res = await app.request(`/${created.id}`, {
            method: 'DELETE',
        });
        expect(res.status).toBe(204);

        // Verify deleted
        const getRes = await app.request(`/${created.id}`);
        expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent task', async () => {
        const res = await app.request('/non-existent-id');
        expect(res.status).toBe(404);
    });

    it('should validate task creation', async () => {
        const res = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({ title: '' }), // Invalid: empty title
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(400);
    });
});
