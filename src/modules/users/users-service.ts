import {
    findAll,
    findById,
    create,
    update,
    deleteById,
    findByRole,
} from './users-repository.js';
import type { CreateUserDTO, UpdateUserDTO, User } from './users-schema.js';


/**
 * Service Layer for Users
 * Business logic and orchestration
 */

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
    return findAll();
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
    return findById(id);
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserDTO): Promise<User> {
    return create({
        name: data.name,
        email: data.email,
        role: data.role ?? 'user',
    });
}

/**
 * Update an existing user
 */
export async function updateUser(
    id: string,
    data: UpdateUserDTO
): Promise<User | null> {
    return update(id, data);
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
    return deleteById(id);
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: 'admin' | 'user' | 'guest'): Promise<User[]> {
    return findByRole(role);
}
