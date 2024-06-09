import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Button, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { Timestamp, collection, getDocs, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import TaskComponent from '../components/TaskComponent';
import { FontAwesome } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

interface Task {
  id: string;
  taskDetails: string;
  deadline?: Timestamp;
  isChecked: boolean;
  projectId: string;
  createdAt: Timestamp;
}

interface ProjectData {
  id: string;
  projectName: string;
}

const Tasks = ({ navigation }: RouterProps) => {
  const [selectedSortCriteria, setSelectedSortCriteria] = useState<'recentlyAdded' | 'highToLow' | 'lowToHigh'>('recentlyAdded');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTitles, setProjectTitles] = useState<{ [key: string]: string }>({});
  const [refreshing, setRefreshing] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const handleSortChange = (criteria: 'recentlyAdded' | 'highToLow' | 'lowToHigh') => {
    setSelectedSortCriteria(criteria);
    toggleModal();
  };

  const fetchProjects = async () => {
    try {
      const projectsData: ProjectData[] = [];
      const querySnapshot = await getDocs(collection(FIREBASE_DB, 'project'));

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({ id: doc.id, projectName: data.projectName });
      });

      const titles: { [key: string]: string } = {};
      projectsData.forEach((project) => {
        titles[project.id] = project.projectName;
      });

      setProjectTitles(titles);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async (projectIds: string[]) => {
    try {
      const tasksData: Task[] = [];

      for (const projectId of projectIds) {
        const tasksQuery = query(collection(FIREBASE_DB, 'tasks'), where('projectId', '==', projectId));
        const tasksSnapshot = await getDocs(tasksQuery);

        for (const doc of tasksSnapshot.docs) {
          const taskData = doc.data() as Omit<Task, 'id'>;
          const isChecked = taskData.isChecked || false;

          const createdAt = taskData.createdAt ?? Timestamp.now();

          tasksData.push({ id: doc.id, ...taskData, isChecked, createdAt });
        }
      }

      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteDoc(doc(FIREBASE_DB, 'tasks', taskId));
      fetchTasksData(); // Fetch tasks again after deletion
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskCheck = async (taskId: string) => {
    try {
      const taskDocRef = doc(FIREBASE_DB, 'tasks', taskId);
      const taskSnapshot = await getDoc(taskDocRef);

      if (taskSnapshot.exists()) {
        const taskData = taskSnapshot.data();
        const newCheckedState = !taskData.isChecked;
        await updateDoc(taskDocRef, { isChecked: newCheckedState });
        fetchTasksData(); // Fetch tasks again after checking
      }
    } catch (error) {
      console.error('Failed to save checkbox state:', error);
    }
  };

  const fetchTasksData = async () => {
    const tasksQuery = query(collection(FIREBASE_DB, 'tasks'));
    const snapshot = await getDocs(tasksQuery);
    const tasksData: Task[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const isChecked = data.isChecked || false;
      const createdAt = data.createdAt ?? Timestamp.now();
      tasksData.push({
        id: doc.id,
        taskDetails: data.taskDetails,
        deadline: data.deadline,
        projectId: data.projectId,
        isChecked: isChecked,
        createdAt: createdAt,
      });
    }
    setTasks(tasksData);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTasksData();
  }, []);

  useEffect(() => {
    const tasksQuery = query(collection(FIREBASE_DB, 'tasks'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const isChecked = data.isChecked || false;
        const createdAt = data.createdAt ?? Timestamp.now();
        tasksData.push({
          id: doc.id,
          taskDetails: data.taskDetails,
          deadline: data.deadline,
          projectId: data.projectId,
          isChecked: isChecked,
          createdAt: createdAt,
        });
      });

      setTasks(tasksData);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>MANAGE{'\n'}YOUR TASKS</Text>
      </View>

      <Button title="Sort / Filter" onPress={toggleModal} />

      {isModalVisible && (
        <View style={styles.modal}>
          <Button title="Recently Added" onPress={() => handleSortChange('recentlyAdded')} />
          <Button title="Close" onPress={toggleModal} />
        </View>
      )}

      <SwipeListView
        data={tasks}
        renderItem={({ item }) => (
          <TaskComponent
            id={item.id}
            taskDetails={item.taskDetails}
            deadline={item.deadline}
            onDelete={handleTaskDelete}
            isChecked={item.isChecked}
            onCheck={() => handleTaskCheck(item.id)}
            projectTitle={projectTitles[item.projectId]}
          />
        )}
        renderHiddenItem={({ item }) => (
          <View style={styles.rowBack}>
            <TouchableOpacity
              style={[styles.deleteButtonContainer]}
              onPress={() => handleTaskDelete(item.id)}
            >
              <FontAwesome style={styles.deleteButton} name="trash" color={'#fff'} size={24} />
            </TouchableOpacity>
          </View>
        )}
        rightOpenValue={-75}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
    textAlign: 'center',
  },
  scrollViewContent: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modal: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    zIndex: 1,
  },

  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DD2C00',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,
    margin: 10,
    borderRadius: 25,
    width: '90%',
    alignSelf: 'center',
  },

  deleteButtonContainer: {
    right: 10,
  },

  backTextWhite: {
    color: '#FFF',
  },

  deleteButton: {
    alignSelf: 'center',
  },
});

export default Tasks;
