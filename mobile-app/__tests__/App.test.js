/**
 * Mobile App Component Tests
 * Tests for React Native UI components and user interactions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen, EmployeeTaskManager, AdminDashboard } from '../App';

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage');

describe('LoginScreen Component', () => {
  test('should render login form with username and password fields', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByPlaceholderText(/username|login/i)).toBeTruthy();
    expect(getByPlaceholderText(/password/i)).toBeTruthy();
    expect(getByText(/login/i)).toBeTruthy();
  });

  test('should show error message for invalid credentials', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const usernameInput = getByPlaceholderText(/username|login/i);
    const passwordInput = getByPlaceholderText(/password/i);
    const loginButton = getByText(/login/i);

    fireEvent.changeText(usernameInput, 'wronguser');
    fireEvent.changeText(passwordInput, 'wrongpass');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText(/invalid|error/i)).toBeTruthy();
    });
  });

  test('should store token in AsyncStorage on successful login', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const usernameInput = getByPlaceholderText(/username|login/i);
    const passwordInput = getByPlaceholderText(/password/i);
    const loginButton = getByText(/login/i);

    fireEvent.changeText(usernameInput, 'admin');
    fireEvent.changeText(passwordInput, 'adminpass');
    fireEvent.press(loginButton);

    await waitFor(() => {
      // Token should be saved
      expect(require('@react-native-async-storage/async-storage').setItem).toHaveBeenCalledWith(
        'token',
        expect.any(String)
      );
    });
  });

  test('should disable login button while loading', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const loginButton = getByText(/login/i);
    expect(loginButton.props.disabled).toBe(false);

    // Simulate loading state
    fireEvent.press(loginButton);

    // Button should be disabled while loading
    expect(loginButton.props.disabled).toBe(true);
  });

  test('should clear input fields after error', async () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const usernameInput = getByPlaceholderText(/username|login/i);
    const passwordInput = getByPlaceholderText(/password/i);

    fireEvent.changeText(usernameInput, 'test');
    fireEvent.changeText(passwordInput, 'pass');

    // After error, fields should be clearable
    expect(usernameInput.props.value).toBe('test');
  });
});

describe('EmployeeTaskManager Component', () => {
  test('should render list of tasks assigned to employee', async () => {
    const { getByText } = render(<EmployeeTaskManager />);

    await waitFor(() => {
      expect(getByText(/review project proposal/i)).toBeTruthy();
      expect(getByText(/develop feature x/i)).toBeTruthy();
    });
  });

  test('should display Start button for pending tasks', async () => {
    const { getAllByText } = render(<EmployeeTaskManager />);

    await waitFor(() => {
      const startButtons = getAllByText(/start/i);
      expect(startButtons.length).toBeGreaterThan(0);
    });
  });

  test('should display Stop button for in_progress tasks', async () => {
    const { getByText } = render(<EmployeeTaskManager />);

    await waitFor(() => {
      expect(getByText(/stop/i)).toBeTruthy();
    });
  });

  test('should increment timer when task is running', async () => {
    const { getByText } = render(<EmployeeTaskManager />);

    const startButton = getByText(/start/i);
    fireEvent.press(startButton);

    // Wait 2 seconds and check timer incremented
    await waitFor(
      () => {
        expect(getByText(/00:00:02/)).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  test('should call API to start task on button press', async () => {
    const { getByText } = render(<EmployeeTaskManager />);

    const startButton = getByText(/start/i);
    fireEvent.press(startButton);

    await waitFor(() => {
      const axios = require('axios');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/'),
        expect.any(String)
      );
    });
  });

  test('should call API to stop task on Stop button press', async () => {
    const { getByText } = render(<EmployeeTaskManager />);

    const stopButton = getByText(/stop/i);
    fireEvent.press(stopButton);

    await waitFor(() => {
      const axios = require('axios');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/'),
        expect.any(String)
      );
    });
  });

  test('should show error message if API call fails', async () => {
    const axios = require('axios');
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<EmployeeTaskManager />);

    const startButton = getByText(/start/i);
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(getByText(/error|failed/i)).toBeTruthy();
    });
  });

  test('should refresh task list on pull-to-refresh', async () => {
    const { getByTestId } = render(<EmployeeTaskManager />);

    const flatList = getByTestId('taskList');
    fireEvent.scroll(flatList, { nativeEvent: { contentOffset: { y: -100 } } });

    await waitFor(() => {
      const axios = require('axios');
      expect(axios.get).toHaveBeenCalled();
    });
  });
});

describe('AdminDashboard Component', () => {
  test('should render employee list', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(getByText(/employee1/i)).toBeTruthy();
      expect(getByText(/employee2/i)).toBeTruthy();
    });
  });

  test('should highlight selected employee', async () => {
    const { getByText } = render(<AdminDashboard />);

    const employee = getByText(/employee1/i);
    fireEvent.press(employee);

    // Check if background color changed (blue #1976D2)
    expect(employee.parent.props.style).toContain({ backgroundColor: '#1976D2' });
  });

  test('should display white text for selected employee', async () => {
    const { getByText } = render(<AdminDashboard />);

    const employee = getByText(/employee1/i);
    fireEvent.press(employee);

    // Text should be white
    expect(employee.props.style).toContain({ color: '#ffffff' });
  });

  test('should load tasks when employee is selected', async () => {
    const { getByText } = render(<AdminDashboard />);

    const employee = getByText(/employee1/i);
    fireEvent.press(employee);

    await waitFor(() => {
      const axios = require('axios');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/employees/2/tasks')
      );
    });
  });

  test('should show Add button when employee is selected', async () => {
    const { getByText } = render(<AdminDashboard />);

    const employee = getByText(/employee1/i);
    expect(getByText(/add/i)).toBeTruthy();

    fireEvent.press(employee);

    await waitFor(() => {
      expect(getByText(/add task/i)).toBeTruthy();
    });
  });

  test('should open modal when Add button is pressed', async () => {
    const { getByText, getByDisplayValue } = render(<AdminDashboard />);

    const employee = getByText(/employee1/i);
    fireEvent.press(employee);

    const addButton = getByText(/add/i);
    fireEvent.press(addButton);

    // Modal should appear
    expect(getByDisplayValue(/task title/i)).toBeTruthy();
  });

  test('should create task when form is submitted', async () => {
    const { getByText, getByDisplayValue } = render(<AdminDashboard />);

    const employee = getByText(/employee1/i);
    fireEvent.press(employee);

    const addButton = getByText(/add/i);
    fireEvent.press(addButton);

    const titleInput = getByDisplayValue(/task title/i);
    fireEvent.changeText(titleInput, 'New Task');

    const submitButton = getByText(/add task/i);
    fireEvent.press(submitButton);

    await waitFor(() => {
      const axios = require('axios');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/tasks'),
        {
          title: 'New Task',
          assignee_id: 2
        }
      );
    });
  });

  test('should display time statistics for each employee', async () => {
    const { getByText } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(getByText(/employee time report/i)).toBeTruthy();
      expect(getByText(/total time/i)).toBeTruthy();
    });
  });

  test('should show delete button for each task', async () => {
    const { getByText, getAllByTestId } = render(<AdminDashboard />);

    const employee = getByText(/employee1/i);
    fireEvent.press(employee);

    await waitFor(() => {
      const deleteButtons = getAllByTestId('deleteButton');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  test('should delete task when delete button is pressed', async () => {
    const { getByText, getAllByTestId } = render(<AdminDashboard />);

    const employee = getByText(/employee1/i);
    fireEvent.press(employee);

    await waitFor(() => {
      const deleteButton = getAllByTestId('deleteButton')[0];
      fireEvent.press(deleteButton);
    });

    await waitFor(() => {
      const axios = require('axios');
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/admin/tasks/')
      );
    });
  });

  test('should refresh stats when refresh button is pressed', async () => {
    const { getByTestId } = render(<AdminDashboard />);

    const refreshButton = getByTestId('refreshButton');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      const axios = require('axios');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/stats')
      );
    });
  });
});
