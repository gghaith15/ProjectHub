import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button } from 'react-native';
import ProjectComponent from '../components/ProjectComponent';
import { NavigationProp } from '@react-navigation/native';
import { DocumentReference, collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { FIREBASE_DB, auth } from '../../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

interface AssignedMember {
  name: string;
  initial: string;
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

interface UserData {
  id: string;
  name: string;
  email: string;
}

const Projects = ({ navigation }: RouterProps) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedSortCriteria, setSelectedSortCriteria] = useState<'recentlyAdded' | 'highToLow' | 'lowToHigh'>('recentlyAdded');
  const [userId, setUserId] = useState<string | null>(null);
  const db = FIREBASE_DB;

  const fetchProjects = async (uid: string) => {
    try {
      const createdQuery = query(collection(db, 'project'), where('creatorId', '==', uid));
      const assignedQuery = query(collection(db, 'project'), where('assignedMembers', 'array-contains', uid));

      const [createdSnapshot, assignedSnapshot] = await Promise.all([
        getDocs(createdQuery),
        getDocs(assignedQuery),
      ]);

      const projectsData: ProjectData[] = [];
      const userIds = new Set<string>();

      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          data.assignedMembers.forEach((memberId: string) => {
            userIds.add(memberId);
          });
        });
      };

      processSnapshot(createdSnapshot);
      processSnapshot(assignedSnapshot);

      const userDocs = await Promise.all(Array.from(userIds).map(userId => getDoc(doc(db, 'users', userId))));
      const usersMap: { [key: string]: UserData } = {};

      userDocs.forEach(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          usersMap[userDoc.id] = { id: userDoc.id, ...userData };
        } else {
          console.log(`User document with ID ${userDoc} does not exist`);
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

      // Sort projects based on the selected criteria
      let sortedProjects = [...projectsData];
      if (selectedSortCriteria === 'recentlyAdded') {
        sortedProjects = sortedProjects.sort((a, b) => b.startDate.seconds - a.startDate.seconds);
      } else if (selectedSortCriteria === 'highToLow') {
        sortedProjects = sortedProjects.sort((a, b) => {
          const priorityOrder = ['High', 'Medium', 'Low'];
          return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        });
      } else if (selectedSortCriteria === 'lowToHigh') {
        sortedProjects = sortedProjects.sort((a, b) => {
          const priorityOrder = ['Low', 'Medium', 'High'];
          return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        });
      }

      setProjects(sortedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      try {
        const userRef = doc(collection(db, "users"), uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("User data:", data);
          fetchProjects(uid);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserData(user.uid);
      } else {
        console.error("No user is logged in");
      }
    });

    return () => unsubscribe();
  }, [selectedSortCriteria]);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const handleSortChange = (criteria: 'recentlyAdded' | 'highToLow' | 'lowToHigh') => {
    setSelectedSortCriteria(criteria);
    toggleModal(); // Close the modal after selecting an option
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>MANAGE{'\n'}YOUR PROJECTS</Text>
      </View>

      <Button title="Sort / Filter" onPress={toggleModal} />

      {isModalVisible && (
        <View style={styles.modal}>
          <Button title="Recently Added" onPress={() => handleSortChange('recentlyAdded')} />
          <Button title="High to Low Priority" onPress={() => handleSortChange('highToLow')} />
          <Button title="Low to High Priority" onPress={() => handleSortChange('lowToHigh')} />
          <Button title="Close" onPress={toggleModal} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {projects.map((project, index) => (
          <TouchableOpacity
            key={index}
            style={styles.projectContainer}
            onPress={() => {
              // Handle press event
            }}
          >
            <ProjectComponent
              projectId={project.id}
              projectName={project.projectName}
              projectDescription={project.projectDescription}
              startDate={project.startDate}
              endDate={project.endDate}
              priority={project.priority.toString()}
              assignedMembers={project.assignedMembers}
              navigation={navigation}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  },
  scrollViewContent: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 70,
    paddingBottom: 100,
  },
  projectContainer: {
    padding: 55,
    marginBottom: 10,
  },
  modal: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    zIndex: 1, // Ensure modal appears above other content
  },
});

export default Projects;
