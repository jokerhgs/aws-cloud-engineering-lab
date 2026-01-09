import type { User } from './users-schema.js';

/**
 * Data Access Layer for Users
 * Mock data implementation (no database)
 */

// Mock data store
let mockUsers: User[] = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'user',
        createdAt: new Date('2024-01-02T00:00:00Z').toISOString(),
    },
    {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'user',
        createdAt: new Date('2024-01-03T00:00:00Z').toISOString(),
    },
    {
        id: '4',
        name: 'Alice Williams',
        email: 'alice.williams@example.com',
        role: 'guest',
        createdAt: new Date('2024-01-04T00:00:00Z').toISOString(),
    },
];

let nextId = 5;

/**
 * Find all users
 */
export async function findAll(): Promise<User[]> {
    return [...mockUsers];
}

/**
 * Find user by ID
 */
export async function findById(id: string): Promise<User | null> {
    const user = mockUsers.find(u => u.id === id);
    return user || null;
}

/**
 * Create a new user
 */
export async function create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
        id: String(nextId++),
        ...data,
        createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return newUser;
}

/**
 * Update a user by ID
 */
export async function update(
    id: string,
    data: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User | null> {
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
        return null;
    }

    mockUsers[index] = {
        ...mockUsers[index],
        ...data,
    };

    return mockUsers[index];
}

/**
 * Delete a user by ID
 */
export async function deleteById(id: string): Promise<boolean> {
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
        return false;
    }

    mockUsers.splice(index, 1);
    return true;
}

/**
 * Count all users
 */
export async function count(): Promise<number> {
    return mockUsers.length;
}

/**
 * Find users by role
 */
export async function findByRole(role: 'admin' | 'user' | 'guest'): Promise<User[]> {
    return mockUsers.filter(u => u.role === role);
}

/**
 * Reset mock data (useful for testing)
 */
export function resetMockData(): void {
    mockUsers = [
        {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'admin',
            createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
        },
        {
            id: '2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'user',
            createdAt: new Date('2024-01-02T00:00:00Z').toISOString(),
        },
        {
            id: '3',
            name: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            role: 'user',
            createdAt: new Date('2024-01-03T00:00:00Z').toISOString(),
        },
        {
            id: '4',
            name: 'Alice Williams',
            email: 'alice.williams@example.com',
            role: 'guest',
            createdAt: new Date('2024-01-04T00:00:00Z').toISOString(),
        },
    ];
    nextId = 5;
}
