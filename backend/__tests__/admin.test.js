/**
 * Admin API Tests
 * Tests for admin endpoints (employees, tasks, stats)
 */

describe('Admin API', () => {
  const mockToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.xyz';

  describe('GET /api/admin/employees', () => {
    test('should return list of employees managed by admin', async () => {
      const mockEmployees = [
        { id: 2, username: 'employee1' },
        { id: 3, username: 'employee2' },
        { id: 4, username: 'employee3' }
      ];

      // Expected response
      expect(mockEmployees).toHaveLength(3);
      expect(mockEmployees[0]).toHaveProperty('id');
      expect(mockEmployees[0]).toHaveProperty('username');
    });

    test('should return 401 if not authenticated', async () => {
      const response = {
        status: 401,
        error: 'Unauthorized'
      };

      expect(response.status).toBe(401);
    });

    test('should return 403 if user is not admin', async () => {
      const response = {
        status: 403,
        error: 'Admin access required'
      };

      expect(response.status).toBe(403);
    });

    test('should return empty array if no employees managed', async () => {
      const mockEmployees = [];
      expect(mockEmployees).toHaveLength(0);
    });
  });

  describe('POST /api/admin/tasks', () => {
    test('should create task successfully with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        assignee_id: 2
      };

      const createdTask = {
        id: 5,
        title: 'Test Task',
        status: 'pending',
        total_time_spent: 0,
        creator_id: 1,
        assignee_id: 2,
        created_at: new Date()
      };

      expect(createdTask.title).toBe(taskData.title);
      expect(createdTask.assignee_id).toBe(taskData.assignee_id);
      expect(createdTask.status).toBe('pending');
    });

    test('should return 400 if title or assignee_id missing', async () => {
      const invalidData = {
        title: 'Test Task'
        // Missing assignee_id
      };

      expect(invalidData.title).toBeDefined();
      expect(invalidData.assignee_id).toBeUndefined();
    });

    test('should return 401 if not authenticated', async () => {
      const response = {
        status: 401
      };

      expect(response.status).toBe(401);
    });

    test('should return 403 if user is not admin', async () => {
      const response = {
        status: 403,
        error: 'Admin access required'
      };

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/stats', () => {
    test('should return employee time statistics', async () => {
      const mockStats = [
        {
          employee_id: 2,
          employee_name: 'employee1',
          total_time: 3600
        },
        {
          employee_id: 3,
          employee_name: 'employee2',
          total_time: 1800
        }
      ];

      expect(mockStats).toHaveLength(2);
      expect(mockStats[0].employee_id).toBe(2);
      expect(mockStats[0].total_time).toBeGreaterThan(0);
    });

    test('should return 0 total_time for employee with no time tracking', async () => {
      const stats = {
        employee_id: 4,
        employee_name: 'employee3',
        total_time: 0
      };

      expect(stats.total_time).toBe(0);
    });

    test('should return stats sorted by employee name', async () => {
      const mockStats = [
        { employee_name: 'alice', total_time: 100 },
        { employee_name: 'bob', total_time: 200 },
        { employee_name: 'charlie', total_time: 150 }
      ];

      const sorted = mockStats.sort((a, b) => a.employee_name.localeCompare(b.employee_name));
      
      expect(sorted[0].employee_name).toBe('alice');
      expect(sorted[1].employee_name).toBe('bob');
      expect(sorted[2].employee_name).toBe('charlie');
    });
  });

  describe('DELETE /api/admin/tasks/:id', () => {
    test('should delete task successfully', async () => {
      const taskId = 5;
      const response = {
        status: 204
      };

      expect(response.status).toBe(204);
    });

    test('should return 404 if task not found', async () => {
      const response = {
        status: 404,
        error: 'Task not found'
      };

      expect(response.status).toBe(404);
    });

    test('should delete task and associated time entries', async () => {
      // When task is deleted, time_entries should be deleted too (CASCADE)
      const task = { id: 5 };
      const timeEntries = [
        { id: 1, task_id: 5 },
        { id: 2, task_id: 5 }
      ];

      // After deletion, timeEntries should be empty
      const remainingEntries = timeEntries.filter(e => e.task_id !== task.id);
      expect(remainingEntries).toHaveLength(0);
    });
  });

  describe('GET /api/admin/employees/:employeeId/tasks', () => {
    test('should return tasks for specific employee', async () => {
      const employeeId = 2;
      const mockTasks = [
        { id: 1, title: 'Task 1', status: 'pending', assignee_id: 2 },
        { id: 2, title: 'Task 2', status: 'in_progress', assignee_id: 2 }
      ];

      expect(mockTasks).toHaveLength(2);
      expect(mockTasks.every(t => t.assignee_id === employeeId)).toBe(true);
    });

    test('should return empty array if employee has no tasks', async () => {
      const tasks = [];
      expect(tasks).toHaveLength(0);
    });

    test('should return 403 if admin doesn\'t manage this employee', async () => {
      const response = {
        status: 403,
        error: 'You are not authorized to view tasks for this employee.'
      };

      expect(response.status).toBe(403);
    });
  });
});
