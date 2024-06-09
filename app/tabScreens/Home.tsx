import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import ProjectComponent from '../components/ProjectComponent';
import TaskComponent from '../components/TaskComponent';
import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { FIREBASE_DB, auth } from '../../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

interface AssignedMember {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
}

interface ProjectData {
  id: string;
  projectName: string;
  projectDescription: string;
  startDate: any;
  endDate: any;
  priority: string;
  assignedMembers: AssignedMember[];
  creatorId: any;
}

interface UserData extends AssignedMember {}

interface Task {
  id: string;
  taskDetails: string;
  deadline: Timestamp;
  projectId: string;
  isChecked: boolean;
  createdAt: Timestamp;
}

const Home = ({ navigation }: RouterProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userName, setUserName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [projectTitles, setProjectTitles] = useState<{ [key: string]: string }>({});

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const fetchProjects = async (uid: string) => {
    try {
      const createdQuery = query(collection(FIREBASE_DB, 'project'), where('creatorId', '==', uid));
      const assignedQuery = query(collection(FIREBASE_DB, 'project'), where('assignedMembers', 'array-contains', uid));
      
      const [createdSnapshot, assignedSnapshot] = await Promise.all([
        getDocs(createdQuery),
        getDocs(assignedQuery),
      ]);
      
      const projectsData: ProjectData[] = [];
      const userIds = new Set<string>();
      const titles: { [key: string]: string } = {};
      
      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          data.assignedMembers.forEach((memberId: string) => {
            userIds.add(memberId);
          });
          titles[doc.id] = data.projectName;
        });
      };
      
      processSnapshot(createdSnapshot);
      processSnapshot(assignedSnapshot);
      
      const userDocs = await Promise.all(Array.from(userIds).map(userId => getDoc(doc(FIREBASE_DB, 'users', userId))));
      const usersMap: { [key: string]: UserData } = {};

      userDocs.forEach(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          usersMap[userDoc.id] = { id: userDoc.id, ...userData };
        }
      });

      const populateProjectsData = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          const assignedMembersDetailed = data.assignedMembers.map((memberId: string) => {
            return usersMap[memberId] || { id: memberId, name: 'Unknown', email: 'Unknown' };
          });

          projectsData.push({
            id: doc.id,
            projectName: data.projectName,
            projectDescription: data.projectDescription,
            startDate: data.startDate,
            endDate: data.endDate,
            priority: data.priority,
            assignedMembers: assignedMembersDetailed,
            creatorId: data.creatorId,
          });
        });
      };

      populateProjectsData(createdSnapshot);
      populateProjectsData(assignedSnapshot);

      setProjectTitles(titles);
      return projectsData;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
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

          // Ensure createdAt is present, otherwise use a fallback Timestamp
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
      console.error("Error deleting task:", error);
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
        createdAt: createdAt
      });
    }
    setTasks(tasksData);
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
    }, [userId])
  );

  const fetchUserData = async (uid: string) => {
    try {
      const userRef = doc(collection(FIREBASE_DB, "users"), uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(data.name || '');
        setProfilePhoto(data.profilePhoto || null);
        const fetchedProjects = await fetchProjects(uid);
        setProjects(fetchedProjects);
        const projectIds = fetchedProjects.map(project => project.id);
        await fetchTasks(projectIds);
      }
    } catch (error) {
      // console.error("Error fetching user data:", error);
    }
  };

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
          createdAt: createdAt
        });
      });
      setTasks(tasksData);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Text style={styles.welcomeText}>Welcome{'\n'}{userName ? userName : 'User'} &#x1F44B;</Text>
        <View style={styles.iconContainer}>
          {/* <TouchableOpacity style={styles.settingsIcon} onPress={toggleModal}>
            <FontAwesome name="gear" size={24} color="black" />
          </TouchableOpacity> */}
          <View>
            <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={styles.profilePicture}
                  onError={(e) => {
                    // console.error('Failed to load profile photo', e.nativeEvent.error);
                    setProfilePhoto(null); // Clear the profile photo state if there's an error
                  }}
                />
              ) : (
                <FontAwesome name="user" size={24} color="black" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollViewContent}
        snapToInterval={410}
        decelerationRate="fast"
      >
        <View style={styles.slider}>
          {projects.length > 0 ? projects.map((project, index) => (
            <ProjectComponent
              key={index}
              projectId={project.id}
              projectName={project.projectName}
              projectDescription={project.projectDescription}
              startDate={project.startDate}
              endDate={project.endDate}
              priority={project.priority.toString()}
              assignedMembers={project.assignedMembers}
              navigation={navigation}
            />
          )) : (
            <Text style={{ color: 'white' }}>No projects available</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.TaskHeaderContainer}>
        <Text style={styles.TaskHeaderText}>Your Tasks</Text>

        <TouchableOpacity style={styles.ShowAllButton} onPress={() => navigation.navigate('Tasks')}>
          <Text style={styles.showAllText}>Show All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tasksContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  topContainer: {
    top: 0,
    flexDirection: 'row',
    width: "100%",
    justifyContent: 'space-between',
    alignItems: "center",
    height: 120,
    paddingHorizontal: 40,
    backgroundColor: '#C9EF76',
    borderRadius: 45,
  },
  scrollViewContent: {
    flexGrow: 1,
    marginTop: 120,
    borderRadius: 35,
  },
  slider: {
    flexDirection: 'row',
  },
  welcomeText: {
    color: 'black',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 30,
  },
  iconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  settingsIcon: {},
  profileIcon: {},
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  TaskHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 40,
    marginTop: 20,
  },
  TaskHeaderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  ShowAllButton: {
    padding: 5,
    backgroundColor: '#C9EF76',
    borderRadius: 5,
  },
  showAllText: {
    color: '#0d0d0d',
    fontSize: 14,
    fontWeight: '600',
  },
  tasksContainer: {
    marginBottom: 95,
    borderRadius: 45,
    height: 375,
    padding: 20,
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

export default Home;
