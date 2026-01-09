import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import usersRouter from './users-routes.js';
import { resetMockData } from './users-repository.js';

describe('Users API', () => {
    const app = new Hono().route('/', usersRouter);

    // Reset mock data before each test
    beforeEach(() => {
        resetMockData();
    });

    it('should return list of users', async () => {
        const res = await app.request('/');
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(4);
    });

    it('should create a user', async () => {
        const res = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com'
            }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.name).toBe('Test User');
        expect(data.email).toBe('test@example.com');
        expect(data.id).toBeDefined();
        expect(data.role).toBe('user');
    });

    it('should create a user with custom role', async () => {
        const res = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'admin'
            }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.role).toBe('admin');
    });

    it('should get a user by id', async () => {
        const res = await app.request('/1');
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.id).toBe('1');
        expect(data.name).toBe('John Doe');
        expect(data.email).toBe('john.doe@example.com');
    });

    it('should update a user', async () => {
        const res = await app.request('/1', {
            method: 'PATCH',
            body: JSON.stringify({ name: 'Updated Name' }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.name).toBe('Updated Name');
        expect(data.email).toBe('john.doe@example.com'); // Should remain unchanged
    });

    it('should update user email', async () => {
        const res = await app.request('/2', {
            method: 'PATCH',
            body: JSON.stringify({ email: 'newemail@example.com' }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.email).toBe('newemail@example.com');
        expect(data.name).toBe('Jane Smith'); // Should remain unchanged
    });

    it('should delete a user', async () => {
        const res = await app.request('/1', {
            method: 'DELETE',
        });
        expect(res.status).toBe(204);

        // Verify deleted
        const getRes = await app.request('/1');
        expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent user', async () => {
        const res = await app.request('/999');
        expect(res.status).toBe(404);
    });

    it('should validate user creation - missing name', async () => {
        const res = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(400);
    });

    it('should validate user creation - invalid email', async () => {
        const res = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test User',
                email: 'invalid-email'
            }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(400);
    });

    it('should validate user creation - empty name', async () => {
        const res = await app.request('/', {
            method: 'POST',
            body: JSON.stringify({
                name: '',
                email: 'test@example.com'
            }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(400);
    });

    it('should return 404 when updating non-existent user', async () => {
        const res = await app.request('/999', {
            method: 'PATCH',
            body: JSON.stringify({ name: 'Updated Name' }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(404);
    });

    it('should return 404 when deleting non-existent user', async () => {
        const res = await app.request('/999', {
            method: 'DELETE',
        });
        expect(res.status).toBe(404);
    });
});
