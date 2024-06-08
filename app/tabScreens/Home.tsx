import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView, Image } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import ProjectComponent from '../components/ProjectComponent';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FIREBASE_DB, auth } from '../../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

interface AssignedMember {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string; // Add profilePhoto property
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

const Home = ({ navigation }: RouterProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [sortCriteria, setSortCriteria] = useState<'recentlyAdded' | 'highToLow' | 'lowToHigh'>('recentlyAdded');
  const [userId, setUserId] = useState<string | null>(null);

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
      
      console.log("befropre");
      console.log(userIds);
      
      const userDocs = await Promise.all(Array.from(userIds).map(userId => getDoc(doc(FIREBASE_DB, 'users', userId))));
      console.log("after");
      const usersMap: { [key: string]: UserData } = {};

      userDocs.forEach(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          usersMap[userDoc.id] = { id: userDoc.id, ...userData };
        } else {
          // console.log(`User document with ID ${userDoc.id} does not exist`);
        }
      });
      console.log("userDocs",userDocs);
      console.log("usersMap",usersMap);

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
      console.log("projectsData",projectsData);
      
      populateProjectsData(createdSnapshot);
      populateProjectsData(assignedSnapshot);

      return projectsData;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      try {
        // Fetch all documents in the users collection
        const userRef = doc(collection(FIREBASE_DB, "users"), uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("User data:", data);
          setUserName(data.name || '');
          setProfilePicture(data.profilePhoto || null); // Set profile picture URL
          const fetchedProjects = await fetchProjects(uid);

          setProjects(fetchedProjects);
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
  }, [sortCriteria]);

  const handleSortChange = (criteria: 'recentlyAdded' | 'highToLow' | 'lowToHigh') => {
    setSortCriteria(criteria);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Text style={styles.welcomeText}>Welcome{'\n'}{userName ? userName : 'User'} &#x1F44B;</Text>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.settingsIcon} onPress={toggleModal}>
            <FontAwesome name="th-large" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
              ) : (
                <FontAwesome name="user" size={24} color="black" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Picker
        selectedValue={sortCriteria}
        style={styles.picker}
        onValueChange={(itemValue) => handleSortChange(itemValue)}
      >
        <Picker.Item label="Recently Added" value="recentlyAdded" />
        <Picker.Item label="High to Low Priority" value="highToLow" />
        <Picker.Item label="Low to High Priority" value="lowToHigh" />
      </Picker>

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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <Pressable style={styles.centeredView} onPress={toggleModal}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate('Projects'); toggleModal(); }}>
              <Text style={styles.buttonText}>Projects</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate('Tasks'); toggleModal(); }}>
              <Text style={styles.buttonText}>Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate('Settings'); toggleModal(); }}>
              <Text style={styles.buttonText}>Settings</Text>
            </TouchableOpacity>
            <Pressable style={styles.downIcon} onPress={toggleModal}>
              <FontAwesome name="arrow-down" size={24} color="#C9EF76" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  picker: {
    height: 50,
    width: 250,
    color: 'white',
    marginVertical: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 22,
    flexDirection: 'column',
  },
  modalView: {
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    width: "100%",
    height: "65%",
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    width: 200,
    height: 40,
    backgroundColor: '#C9EF76',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 5,
    marginTop: 30,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  downIcon: {
    position: 'absolute',
    top: 10,
    padding: 15,
  },
});

export default Home;
