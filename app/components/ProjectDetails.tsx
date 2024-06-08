import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Modal, Image, Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { FIREBASE_DB } from '../../FirebaseConfig';
import { Timestamp, doc, getDoc, updateDoc, collection, addDoc, query, where, onSnapshot, deleteDoc, arrayRemove, getDocs, arrayUnion } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SwipeListView } from 'react-native-swipe-list-view';
import TaskComponent from './TaskComponent';
import MemberModal from '../modals/MemberModal';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

interface ProjectData {
  projectName: string;
  projectDescription: string;
  startDate: Timestamp;
  endDate: Timestamp;
  priority: string;
  assignedMembers: AssignedMember[];
  creatorId: string;
}

interface AssignedMember {
  memberId: string;
  name: string;
  profilePhoto?: string;
  email: string;
}

interface Task {
  id: string;
  taskDetails: string;
  deadline?: string;
}

const ProjectDetails: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  const { project } = route.params;
  const [editing, setEditing] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState(new Date());
  const [newProjectEndDate, setNewProjectEndDate] = useState(new Date());
  const [newPriority, setNewPriority] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [assignedMembers, setAssignedMembers] = useState<AssignedMember[]>([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [projectData, setProjectData] = useState<ProjectData>({
    projectName: '',
    projectDescription: '',
    startDate: new Timestamp(0, 0),
    endDate: new Timestamp(0, 0),
    priority: '',
    assignedMembers: [],
    creatorId: '',
  });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskDetails, setTaskDetails] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);


  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectDocRef = doc(FIREBASE_DB, 'project', project.projectId);
        const docSnapshot = await getDoc(projectDocRef);
        if (docSnapshot.exists()) {
          const projectData = docSnapshot.data() as ProjectData;
    
          // Ensure assignedMembers is an array of strings (member IDs)
          const assignedMemberIds = Array.isArray(projectData.assignedMembers) ? projectData.assignedMembers : [];
          const memberPromises = assignedMemberIds.map(async (memberId: any) => {
            console.log('Fetching member details for memberId:', memberId);
            const memberDocRef = doc(FIREBASE_DB, 'users', memberId);
            const memberDoc = await getDoc(memberDocRef);
            if (memberDoc.exists()) {
              const memberData = memberDoc.data() as Omit<AssignedMember, 'memberId'>;
              return {
                ...memberData,
                memberId: memberId,
              };
            }
            console.error('Member document does not exist for memberId:', memberId);
            return { memberId: memberId, name: 'Unknown', email: 'Unknown', profilePhoto: undefined };
          });
    
          const detailedMembers = await Promise.all(memberPromises);
    
          setProjectData({
            ...projectData,
            assignedMembers: detailedMembers,
          });
          setNewProjectTitle(projectData.projectName);
          setNewProjectDescription(projectData.projectDescription);
          setNewProjectStartDate(projectData.startDate.toDate());
          setNewProjectEndDate(projectData.endDate.toDate());
          setNewPriority(projectData.priority);
        } else {
          console.log('Project not found');
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };
    
    
    const fetchTasks = () => {
      const q = query(collection(FIREBASE_DB, 'tasks'), where('projectId', '==', project.projectId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedTasks: Task[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTasks.push({
            id: doc.id,
            taskDetails: data.taskDetails,
            deadline: data.deadline ? data.deadline.toDate().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No deadline',
          });
        });
        console.log('Fetched tasks:', fetchedTasks);
        setTasks(fetchedTasks);
      });
      return unsubscribe;
    };

    const authInstance = getAuth();
    onAuthStateChanged(authInstance, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });

    fetchProjectData();
    const unsubscribe = fetchTasks();

    return () => {
      unsubscribe();
    };
  }, [project.projectId]);

  const handleSaveEdits = async () => {
    const projectDocRef = doc(FIREBASE_DB, 'project', project.projectId);
    console.log('Saving Start Date:', newProjectStartDate);
    console.log('Saving End Date:', newProjectEndDate);

    try {
      await updateDoc(projectDocRef, {
        projectName: newProjectTitle,
        projectDescription: newProjectDescription,
        startDate: Timestamp.fromDate(newProjectStartDate),
        endDate: Timestamp.fromDate(newProjectEndDate),
        priority: newPriority,
      });

      // Fetch the updated project data to verify the changes
      const updatedDocSnapshot = await getDoc(projectDocRef);
      if (updatedDocSnapshot.exists()) {
        const updatedProjectData = updatedDocSnapshot.data() as ProjectData;
        setProjectData({
          ...updatedProjectData,
          assignedMembers: projectData.assignedMembers, // Preserve existing assigned members
        });
      }

      setEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setNewProjectTitle(projectData.projectName);
    setNewProjectDescription(projectData.projectDescription);
    setNewProjectStartDate(projectData.startDate.toDate());
    setNewProjectEndDate(projectData.endDate.toDate());
    setNewPriority(projectData.priority);
  };

  const handleAddTask = () => {
    setIsAddingTask(true);
  };

  const handleConfirmAddTask = async () => {
    try {
      if (!taskDetails) {
        console.error('Task details are required');
        return;
      }

      const taskData: { projectId: any; taskDetails: string; deadline?: Timestamp } = {
        projectId: project.projectId,
        taskDetails: taskDetails,
      };

      if (taskDeadline) {
        taskData.deadline = Timestamp.fromDate(new Date(taskDeadline)); // Add deadline if it's provided
      }

      await addDoc(collection(FIREBASE_DB, 'tasks'), taskData);

      setTaskDetails('');
      setTaskDeadline('');
      setSelectedDate(new Date());  // Reset selected date
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleCancelTask = () => {
    setIsAddingTask(false);
    setTaskDetails('');
    setTaskDeadline('');
    setSelectedDate(new Date());  // Reset selected date
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(FIREBASE_DB, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddMember = async () => {
    try {
      const normalizedEmail = newMemberEmail.toLowerCase(); // Convert email to lowercase
      const isEmailAlreadyAdded = projectData.assignedMembers.some(member => member.email.toLowerCase() === normalizedEmail);
  
      if (isEmailAlreadyAdded) {
        Alert.alert("This email is already added.");
        return;
      }
  
      const q = query(collection(FIREBASE_DB, 'users'), where('email', '==', normalizedEmail));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userName = userData.name || ''; // Assuming 'name' field exists in user document
        const newMember: AssignedMember = {
          memberId: userDoc.id,
          name: userName,
          email: normalizedEmail,
          profilePhoto: userData.profilePhoto || '', // Assuming 'profilePhoto' field exists
        };
  
        // Update the Firestore document to add the new member
        const projectDocRef = doc(FIREBASE_DB, 'project', project.projectId);
        await updateDoc(projectDocRef, {
          assignedMembers: arrayUnion(newMember),
        });
  
        // Update local state
        setProjectData((prevData) => ({
          ...prevData,
          assignedMembers: [...prevData.assignedMembers, newMember],
        }));
  
        setNewMemberEmail('');
        Alert.alert('Member added successfully');
      } else {
        Alert.alert('Email does not exist');
      }
    } catch (error) {
      Alert.alert('Error checking email:', error.message);
    }
  };
  
  

  const handleRemoveMember = async (memberId: string) => {
  const projectDocRef = doc(FIREBASE_DB, 'project', project.projectId);

  // Find the member object to remove
  const memberToRemove = projectData.assignedMembers.find(member => member.memberId === memberId);
  
  if (!memberToRemove) {
    console.error('Member not found');
    return;
  }

  try {
    // Update the Firestore document to remove the member by their object
    await updateDoc(projectDocRef, {
      assignedMembers: arrayRemove(memberToRemove),
    });

    // Update local state
    setProjectData((prevData) => ({
      ...prevData,
      assignedMembers: prevData.assignedMembers.filter(member => member.memberId !== memberId),
    }));

    console.log('Member removed successfully');
  } catch (error) {
    console.error('Error removing member:', error);
  }
};

  

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF6347'; // Red color for High priority
      case 'medium':
        return '#FFC047'; // Yellow color for Medium priority
      case 'low':
        return '#62CF2F'; // Green color for Low priority
      default:
        return '#C5C2FF'; // Default color
    }
  };

  const getPriorityContainerWidth = (priority: string): number => {
    const textLength = priority.length * 10.8; // Assuming 10.8 is the average width of a character
    const minWidth = 30; // Minimum width
    return textLength + 20; // Adding some extra padding for better visibility
  };

  const handleChangePriority = (newPriority: string) => {
    setNewPriority(newPriority);
    setPriorityModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.top}>
          <TouchableOpacity style={styles.arrowLeft} onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={22} color="#0d0d0d" />
          </TouchableOpacity>
          <Text style={styles.stackTitle}>Project Details</Text>
          {currentUserId === projectData.creatorId && (
            <>
              {!editing ? (
                <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                  <FontAwesome name="pencil-square" size={22} color="#0d0d0d" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.editButton} onPress={handleSaveEdits}>
                  <FontAwesome name="save" size={22} color="#0d0d0d" />
                </TouchableOpacity>
              )}
            </>
          )}
          {editing && (
            <TouchableOpacity style={styles.editCancelButton} onPress={handleCancelEdit}>
              <FontAwesome name="times" size={22} color="#0d0d0d" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.projectTitleContainer}>
          {/* <Text style={styles.projectTitle}>Project Title</Text> */}
        </View>
        <View style={styles.mid}>
          {editing ? (
            <TextInput
              style={styles.editProjectTitle}
              value={newProjectTitle}
              onChangeText={setNewProjectTitle}
            />
          ) : (
            <Text style={styles.userProjectTitle}>{projectData?.projectName || 'no name'}</Text>
          )}
        </View>

        <View style={styles.date}>
          <View style={styles.calendarIcon}>
            <FontAwesome name="calendar" size={16} color={'#0d0d0d'} />
          </View>
          {editing ? (
            <>
              <DateTimePicker
                value={newProjectStartDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (date) {
                    setNewProjectStartDate(date);
                    console.log('Start Date Changed:', date.toISOString());
                  }
                }}
              />
              <DateTimePicker
                value={newProjectEndDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (date) {
                    setNewProjectEndDate(date);
                    console.log('End Date Changed:', date.toISOString());
                  }
                }}
              />
            </>
          ) : (
            <>
              <Text style={styles.startDate}>
                {projectData?.startDate?.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) || 'no date'}
              </Text>
              <Text style={styles.endDate}>
                {projectData?.endDate?.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) || 'no date'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.low}>
          <View style={[styles.priorityContainer, { 
            backgroundColor: getPriorityColor(editing ? newPriority : projectData.priority), 
            width: getPriorityContainerWidth(editing ? newPriority : projectData.priority) 
            }]}>
            <Text style={styles.priorityText}>{(editing ? newPriority : projectData.priority).toUpperCase()}</Text>
          </View>
          {editing && (
            <TouchableOpacity style={styles.changePriorityButton} onPress={() => setPriorityModalVisible(true)}>
              <Text>Change</Text>
            </TouchableOpacity>
          )}

          <View style={styles.assignedMembers}>
            {projectData.assignedMembers.slice(0, 2).map((member, index) => (
              <TouchableOpacity key={index} style={styles.memberCircle} onPress={() => setMemberModalVisible(true)}>
                {member.profilePhoto ? (
                  <Image source={{ uri: member.profilePhoto }} style={styles.profilePhoto} />
                ) : (
                  <Text style={styles.memberInitial}>{member.name?.charAt(0).toUpperCase() ?? ''}</Text>
                )}
              </TouchableOpacity>
            ))}
            {projectData.assignedMembers.length > 2 && (
              <View style={[styles.memberCircle, styles.memberCountCircle]}>
                <Text style={styles.memberCountText}>+{projectData.assignedMembers.length - 2}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.midContainer}>
        <View style={styles.midContainerTitle}>
          <Text style={styles.projectDescription}>Description</Text>
        </View>
        {editing ? (
          <TextInput
            style={styles.editProjectDescription}
            value={newProjectDescription}
            onChangeText={setNewProjectDescription}
          />
        ) : (
          <View style={styles.descriptionBox}>
            <Text style={styles.userProjectDescription}>
              {projectData?.projectDescription || 'no description'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomContainerTitle}>
        <Text style={styles.projectTasks}>Project Tasks</Text>
        {currentUserId === projectData.creatorId && (
          <TouchableOpacity style={styles.taskAddButton} onPress={handleAddTask}>
            <FontAwesome name="plus" size={20} color={'#fff'} />
          </TouchableOpacity>
        )}
      </View>

      <SwipeListView
        data={tasks}
        renderItem={({ item }) => (
          <TaskComponent
            id={item.id}
            taskDetails={item.taskDetails}
            deadline={item.deadline}
            onDelete={handleDeleteTask}
          />
        )}
        renderHiddenItem={({ item }) => (
          <View style={styles.rowBack}>
            <TouchableOpacity
              style={[styles.deleteButtonContainer]}
              onPress={() => handleDeleteTask(item.id)}
            >
              <Text style={styles.backTextWhite}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        rightOpenValue={-75}
      />

      <Modal visible={isAddingTask} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            placeholder="Task Details"
            value={taskDetails}
            onChangeText={setTaskDetails}
          />
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              if (date) {
                setSelectedDate(date);
                setTaskDeadline(date.toISOString());
              } else {
                console.error('No date selected');
              }
            }}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleConfirmAddTask}>
            <Text>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelTask}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={priorityModalVisible} animationType="slide" transparent={true}>
        <View style={styles.priorityModalContainer}>
          <View style={styles.priorityModalContent}>
            <Text style={styles.priorityModalTitle}>Change Priority</Text>
              <View style={styles.priorityOptionsContainer}>
                <TouchableOpacity style={styles.priorityOption} onPress={() => handleChangePriority('High')}>
                  <Text style={styles.priorityText}>High</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.priorityOption} onPress={() => handleChangePriority('Medium')}>
                  <Text style={styles.priorityText}>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.priorityOption} onPress={() => handleChangePriority('Low')}>
                  <Text style={styles.priorityText}>Low</Text>
                </TouchableOpacity>
              </View>
            <TouchableOpacity style={styles.priorityModalCancelButton} onPress={() => setPriorityModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MemberModal
        visible={memberModalVisible}
        members={projectData.assignedMembers}
        currentUserId={currentUserId}
        creatorId={projectData.creatorId}
        onClose={() => setMemberModalVisible(false)}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  topContainer: {
    zIndex: 1,
    height: 300,
    paddingHorizontal: 40,
    backgroundColor: '#F5FFDF',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 50,
  },
  arrowLeft: {},
  stackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {},
  editCancelButton: {},
  projectTitleContainer: {
    marginTop: 10,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '300',
    marginLeft: 5,
  },
  mid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userProjectTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    margin: 5,
  },
  editProjectTitle: {
    width: 260,
    fontSize: 20,
    fontWeight: 'bold',
    margin: 5,
    borderWidth: 1,
    borderColor: 'black',
    padding: 5,
  },
  low: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
  },
  date: {
    flexDirection: 'row',
  },
  calendarIcon: {
    margin: 5,
  },
  startDate: {
    margin: 5,
  },
  endDate: {
    margin: 5,
  },
  priorityContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    minWidth: 50,
  },
  priorityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  changePriorityButton: {
    padding: 4,
    marginRight: 100,
    borderRadius: 45,
    borderWidth: 1.5, 
  },
  assignedMembers: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 5,
    paddingHorizontal: 10,
    minWidth: 50,
  },
  memberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C9EF76',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 2,
    marginBottom: 20,
    marginRight: -15,
  },
  memberInitial: {
    fontSize: 18,
    color: '#0d0d0d',
  },
  memberCountCircle: {
    backgroundColor: '#0d0d0d',
  },
  memberCountText: {
    color: '#fff',
    fontSize: 16,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  midContainer: {
    flexDirection: 'column',
    height: 200,
    paddingHorizontal: 40,
    borderRadius: 45,
    marginTop: 5,
    backgroundColor: '#0d0d0d',
  },
  midContainerTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDescription: {
    fontSize: 14,
    fontWeight: '300',
    marginLeft: 5,
    color: '#fff',
    marginTop: 5,
  },
  editProjectDescription: {
    color: '#fff',
    width: 260,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#fff',
    padding: 5,
  },
  descriptionBox: {
    marginTop: 5,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 45,
  },
  userProjectDescription: {
    margin: 20,
    fontSize: 14,
    color: '#fff',
  },
  bottomContainerTitle: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  projectTasks: {
    fontSize: 14,
    fontWeight: '300',
    marginLeft: 5,
    color: '#fff',
  },
  taskAddButton: {},

  //Swipe List View Styles
  
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DD2C00', //red
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,
    margin: 5,
    borderRadius: 10,
    width: '80%',
    alignSelf: 'center',
    height: 60,

  },

  deleteButtonContainer: {
    // right: 0,
  },

  backTextWhite: {
    color: '#FFF',
  },

  //Add Task Modal Styles

  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  // Change Priority Styles

  priorityModalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityModalContent: {
    backgroundColor: '#fff',
    width: 300,
    height: 200,
    padding: 20,
    borderRadius: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  priorityModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    
  },

  priorityOptionsContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  priorityOption: {
    backgroundColor: '#0d0d0d',
    borderRadius: 45,
    padding: 10,
    marginVertical: 5,
  },

  priorityModalCancelButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
    width: '30%',
    alignItems: 'center',
  },

  input: {
    color: '#fff',
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#C9EF76',
    padding: 10,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
  },
  noTasksText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ProjectDetails;
