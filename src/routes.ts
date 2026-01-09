import { Hono } from 'hono';
import tasksRouter from './modules/tasks/tasks-routes.js';
import usersRouter from './modules/users/users-routes.js';

const router = new Hono();

router.route('/tasks', tasksRouter);
router.route('/users', usersRouter);

export default router;
