import { AppRegistry } from 'react-native';
import * as React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import { FlatList, View, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  Provider as PaperProvider,
  Appbar,
  TextInput,
  Button,
  Card,
  Text,
  IconButton,
  Chip,
  ActivityIndicator,
  Title,
  List,
  Modal,
  Portal,
  Provider,
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { name as appName } from './app.json';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';


// --- CONFIGURATION ---
// IMPORTANT: Replace with your computer's IP address on the local network.
const API_BASE_URL = 'http://192.168.0.17:3001/api'; // <--- REPLACE THIS IP

// --- API CLIENT ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});


// --- AUTHENTICATION CONTEXT ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decodedUser = jwtDecode(token);
        setAuthState({ token, user: decodedUser, isLoading: false });
      } else {
        setAuthState({ token: null, user: null, isLoading: false });
      }
    };
    loadToken();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      setAuthState({ token, user, isLoading: false });
      return true;
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed', 'Invalid username or password.');
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setAuthState({ token: null, user: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- HELPER FUNCTIONS ---
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '00:00:00';
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// --- SCREENS AND COMPONENTS ---

// --- Login Screen ---
function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  return (
    <View style={styles.loginContainer}>
      <Card style={styles.loginCard}>
        <Card.Content>
          <Title style={{ textAlign: 'center', marginBottom: 20 }}>Work Tracker Login</Title>
          <TextInput label="Username" value={username} onChangeText={setUsername} mode="outlined" style={styles.input} />
          <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleLogin} disabled={loading} loading={loading}>
            Login
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

// --- Employee's Task Manager Screen ---
function EmployeeTaskManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskInfo, setActiveTaskInfo] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/employee/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const activeTask = tasks.find(t => t.status === 'in_progress');
    let timerId = null;
    if (activeTask) {
      if (!activeTaskInfo || activeTask.id !== activeTaskInfo.id) {
        setActiveTaskInfo({ id: activeTask.id, initialTime: activeTask.total_time_spent });
        setElapsedTime(0);
      }
      timerId = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    } else {
      setActiveTaskInfo(null);
      setElapsedTime(0);
    }
    return () => clearInterval(timerId);
  }, [tasks]);

  const handleApiResponse = () => fetchTasks();

  const startTask = async (id) => {
    try {
      await apiClient.post(`/tasks/${id}/start`);
      handleApiResponse();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to start task.');
    }
  };

  const stopTask = async (id) => {
    try {
      setElapsedTime(0);
      await apiClient.post(`/tasks/${id}/stop`);
      handleApiResponse();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to stop task.');
    }
  };

  const renderTask = ({ item }) => {
    const isRunning = activeTaskInfo && activeTaskInfo.id === item.id;
    const timeToDisplay = isRunning ? activeTaskInfo.initialTime + elapsedTime : item.total_time_spent;

    return (
      <Card style={styles.taskCard}>
        <Card.Title
          title={item.title}
          subtitle={`Time spent: ${formatTime(timeToDisplay)}`}
          right={() => (
            <Chip icon={item.status === 'in_progress' ? 'play-circle' : 'pause-circle'} style={item.status === 'in_progress' ? styles.chipInProgress : styles.chipPending}>
              {item.status}
            </Chip>
          )}
        />
        <Card.Actions>
          {item.status !== 'in_progress' && <Button icon="play" mode="contained" onPress={() => startTask(item.id)}>Start</Button>}
          {item.status === 'in_progress' && <Button icon="stop" mode="contained" color="#E53935" onPress={() => stopTask(item.id)}>Stop</Button>}
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          onRefresh={fetchTasks}
          refreshing={loading}
          ListEmptyComponent={() => <Text style={styles.emptyText}>No tasks assigned to you.</Text>}
        />
      )}
    </View>
  );
}


// --- Admin Dashboard Screen ---
function AdminDashboard() {
  const [stats, setStats] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch statistics.');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await apiClient.get('/admin/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch employees.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchTasksForEmployee = async (employee) => {
    setSelectedEmployee(employee);
    try {
      setLoadingTasks(true);
      const response = await apiClient.get(`/admin/employees/${employee.id}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', `Failed to fetch tasks for ${employee.username}.`);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedEmployee) return;
    try {
      const response = await apiClient.post('/admin/tasks', {
        title: newTaskTitle.trim(),
        assignee_id: selectedEmployee.id,
      });
      setTasks([response.data, ...tasks]);
      setNewTaskTitle('');
      setIsModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await apiClient.delete(`/admin/tasks/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete task.');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchEmployees();
  }, []);
  
  const refreshAll = () => {
      fetchStats();
      fetchEmployees();
      setSelectedEmployee(null);
      setTasks([]);
  }

  return (
    <Provider>
      <ScrollView style={styles.container}>
        <Portal>
          <Modal visible={isModalVisible} onDismiss={() => setIsModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            <Title>Add New Task</Title>
            <TextInput label="Task Title" value={newTaskTitle} onChangeText={setNewTaskTitle} mode="outlined" style={styles.input} />
            <Button mode="contained" onPress={handleAddTask} style={{ marginTop: 10 }}>
              Add Task for {selectedEmployee?.username}
            </Button>
          </Modal>
        </Portal>

        <Card>
          <Card.Content>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Title>Employee Time Report</Title>
                <IconButton icon="refresh" onPress={refreshAll} />
            </View>
            {loadingStats ? <ActivityIndicator /> : (
              <List.Section>
                {stats.map(item => (
                  <List.Item
                    key={item.employee_id.toString()}
                    title={item.employee_name}
                    description={`Total time: ${formatTime(item.total_time)}`}
                    left={props => <List.Icon {...props} icon="account-clock" />}
                  />
                ))}
              </List.Section>
            )}
          </Card.Content>
        </Card>

        <Card style={{ marginTop: 20 }}>
          <Card.Content>
            <Title>Task Management</Title>
            {loadingEmployees ? <ActivityIndicator /> : (
              <List.Section title="Select an employee to manage tasks">
                {employees.map(employee => {
                  const isSelected = selectedEmployee?.id === employee.id;
                  return (
                    <List.Item
                      key={employee.id.toString()}
                      title={
                        <Text style={isSelected ? styles.selectedEmployeeText : null}>
                          {employee.username}
                        </Text>
                      }
                      left={props => <List.Icon {...props} icon="account" />}
                      onPress={() => fetchTasksForEmployee(employee)}
                      style={isSelected ? styles.selectedEmployee : null}
                    />
                  );
                })}
              </List.Section>
            )}
          </Card.Content>
        </Card>

        {selectedEmployee && (
          <Card style={{ marginTop: 20, marginBottom: 20 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title>Tasks for {selectedEmployee.username}</Title>
                <Button mode="contained" icon="plus" onPress={() => setIsModalVisible(true)}>
                  Add
                </Button>
              </View>
              {loadingTasks ? <ActivityIndicator /> : (
                <FlatList
                  data={tasks}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <List.Item
                      title={item.title}
                      description={`Status: ${item.status} | Time: ${formatTime(item.total_time_spent)}`}
                      right={() => <IconButton icon="delete" onPress={() => handleDeleteTask(item.id)} />}
                    />
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>No tasks found.</Text>}
                />
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </Provider>
  );
}


// --- Main Application Logic ---
function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const [title, setTitle] = useState('Work Tracker');

  useEffect(() => {
    if (user) {
      setTitle(user.role === 'admin' ? `Admin: ${user.username}` : `Employee: ${user.username}`);
    } else {
      setTitle('Work Tracker');
    }
  }, [user]);

  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={title} />
        {user && <Appbar.Action icon="logout" onPress={logout} />}
      </Appbar.Header>
      {user ? (
        user.role === 'admin' ? <AdminDashboard /> : <EmployeeTaskManager />
      ) : (
        <LoginScreen />
      )}
    </>
  );
}


// --- Root Component ---
export default function Main() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  loginContainer: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    width: '90%',
    maxWidth: 400,
  },
  input: {
    marginBottom: 10,
  },
  taskCard: {
    marginVertical: 4,
  },
  list: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  chip: {
    marginRight: 16,
  },
  chipInProgress: {
    backgroundColor: '#4CAF50',
  },
  chipPending: {
    backgroundColor: '#FFC107',
  },
  selectedEmployee: {
    backgroundColor: '#1976D2',
  },
  selectedEmployeeText: {
    color: '#ffffff',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
});

AppRegistry.registerComponent(appName, () => Main);
