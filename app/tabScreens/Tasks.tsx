import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Timestamp, collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { FIREBASE_DB, auth } from '../../FirebaseConfig';
import TaskComponent from '../components/TaskComponent';
import { FontAwesome } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTitles, setProjectTitles] = useState<{ [key: string]: string }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);

  const fetchProjects = useCallback(async (uid: string): Promise<ProjectData[]> => {
    setLoadingProjects(true);
    try {
      const projectsData: ProjectData[] = [];
      const createdQuery = query(collection(FIREBASE_DB, 'project'), where('creatorId', '==', uid));
      const assignedQuery = query(collection(FIREBASE_DB, 'project'), where('assignedMembers', 'array-contains', uid));
  
      const [createdSnapshot, assignedSnapshot] = await Promise.all([
        getDocs(createdQuery),
        getDocs(assignedQuery),
      ]);
  
      createdSnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({ id: doc.id, projectName: data.projectName });
      });
  
      assignedSnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({ id: doc.id, projectName: data.projectName });
      });
  
      const titles: { [key: string]: string } = {};
      projectsData.forEach((project) => {
        titles[project.id] = project.projectName;
      });
  
      setProjectTitles(titles);
  
      return projectsData;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchTasks = useCallback(async (projectIds: string[]) => {
    setLoadingTasks(true);
    try {
      if (projectIds.length === 0) {
        setTasks([]);
        return;
      }

      const tasksQuery = query(collection(FIREBASE_DB, 'tasks'));
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData: Task[] = [];
      
      tasksSnapshot.forEach((doc) => {
        const taskData = doc.data() as Omit<Task, 'id'>;
        const isChecked = taskData.isChecked || false;
        const createdAt = taskData.createdAt ?? Timestamp.now();
        tasksData.push({ id: doc.id, ...taskData, isChecked, createdAt });
      });

      const filteredTasks = tasksData.filter(task => projectIds.includes(task.projectId));
      setTasks(filteredTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteDoc(doc(FIREBASE_DB, 'tasks', taskId));
      const projectIds = Object.keys(projectTitles);
      await fetchTasks(projectIds);
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
        const projectIds = Object.keys(projectTitles);
        await fetchTasks(projectIds);
      }
    } catch (error) {
      console.error('Failed to save checkbox state:', error);
    }
  };

  const fetchUserData = async (uid: string) => {
    try {
      const userRef = doc(collection(FIREBASE_DB, "users"), uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        await fetchProjects(uid);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        const fetchData = async () => {
          await fetchUserData(userId);
          const fetchedProjects = await fetchProjects(userId);
          setProjects(fetchedProjects);
          const projectIds = fetchedProjects.map(project => project.id);
          await fetchTasks(projectIds);
        };
        fetchData();
      }
    }, [userId, fetchProjects, fetchTasks])
  );

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserData(user.uid);
      } else {
        console.error("No user is logged in");
      }
    });
  }, []);

  useEffect(() => {
    if (Object.keys(projectTitles).length > 0) {
      const projectIds = Object.keys(projectTitles);
      fetchTasks(projectIds);
    }
  }, [projectTitles, fetchTasks]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>MANAGE{'\n'}YOUR TASKS</Text>
      </View>

      {/* <Button title="Sort / Filter" onPress={toggleModal} />

      {isModalVisible && (
        <View style={styles.modal}>
          <Button title="Recently Added" onPress={() => handleSortChange('recentlyAdded')} />
          <Button title="Close" onPress={toggleModal} />
        </View>
      )} */}

      {loadingTasks || loadingProjects ? (
        <ActivityIndicator size="large" color="#C9EF76" style={{ marginTop: 20 }} />
      ) : (
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
      )}
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
