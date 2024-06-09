import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, TouchableOpacity, Text, TextInput, Platform, Alert, ScrollView, KeyboardAvoidingView  } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getFirestore, collection, addDoc, where, query, getDocs, doc, getDoc } from 'firebase/firestore';
import '@firebase/firestore';
import { initializeApp } from 'firebase/app';
import { FIREBASE_DB } from '../../FirebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp } from '@react-navigation/native';

interface Props {
  navigation: NavigationProp<any>;
}

const AddNew = ({ navigation }: Props) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [createType, setCreateType] = useState(null);
  const [projectInfo, setProjectInfo] = useState({
    projectName: '',
    projectDescription: '',
    startDate: new Date(),
    endDate: new Date(),
    priority: '',
    assignedMembers: [],
  });

  const [taskInfo, setTaskInfo] = useState({
    taskName: '',
    taskDescription: '',
    deadline: new Date(),
    priority: '',
    assignedMembers: [],
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isHighPrioritySelected, setIsHighPrioritySelected] = useState(false);
  const [isMediumPrioritySelected, setIsMediumPrioritySelected] = useState(false);
  const [isLowPrioritySelected, setIsLowPrioritySelected] = useState(false);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [assignedMembers, setAssignedMembers] = useState([]);
console.log('====================================');
console.log("potatoasdasdsadsdad");
console.log('====================================');
  const toggleModal = (type) => {
    setCreateType(type);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setCreateType(null);
    setProjectInfo({
      projectName: '',
      projectDescription: '',
      startDate: new Date(),
      endDate: new Date(),
      priority: '',
      assignedMembers: [],
    });

    setTaskInfo({
      taskName: '',
      taskDescription: '',
      deadline: new Date(),
      priority: '',
      assignedMembers: [],
    });

      setNewMemberEmail('');
      setAssignedMembers([]);
  };

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || projectInfo.startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setProjectInfo({ ...projectInfo, startDate: currentDate });
  };

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || projectInfo.endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setProjectInfo({ ...projectInfo, endDate: currentDate });
  };

  const handlePrioritySelection = (priority) => {
    setProjectInfo({ ...projectInfo, priority });
  };

  const handleHighPrioritySelection = () => {
    setIsHighPrioritySelected(true);
    setIsMediumPrioritySelected(false);
    setIsLowPrioritySelected(false);
    handlePrioritySelection('High');
    
  };

  const handleMediumPrioritySelection = () => {
    setIsHighPrioritySelected(false);
    setIsMediumPrioritySelected(true);
    setIsLowPrioritySelected(false);
    handlePrioritySelection('Medium');
  };

  const handleLowPrioritySelection = () => {
    setIsHighPrioritySelected(false);
    setIsMediumPrioritySelected(false);
    setIsLowPrioritySelected(true);
    handlePrioritySelection('Low');
  };

  const handleAddMember = async () => {
    try {
      const normalizedEmail = newMemberEmail.toLowerCase(); // Convert email to lowercase
      const isEmailAlreadyAdded = assignedMembers.some(member => member.email.toLowerCase() === normalizedEmail);

      if (isEmailAlreadyAdded) {
        Alert.alert("It's already added");
        return;
      }
  
      const q = query(collection(FIREBASE_DB, 'users'), where('email', '==', normalizedEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const userName = userData.name || ''; // Assuming 'name' field exists in user document
        const userInitial = userName.charAt(0).toUpperCase();
        
        setAssignedMembers([...assignedMembers, { email: newMemberEmail, initial: userInitial }]);
        setNewMemberEmail('');
      } else {
        Alert.alert('Email does not exist');
      }
    } catch (error) {
      // console.error('Error checking email:', error);
      Alert.alert('Error checking email:', error.message);
    }
  };
  

  const handleCreate = async () => {
    if (createType === 'Project') {
      if (!projectInfo.projectName.trim() || !projectInfo.priority.trim()) {
        Alert.alert('Error', 'Project Name and Priority are required.');
        return;
      }
      // console.log('Create Project:', projectInfo);

      try {
        
        const docRef = await addDoc(collection(FIREBASE_DB, 'project'), projectInfo);
        // console.log('Project added with ID: ', docRef.id);
      } catch (error) {
        console.error('Error adding project: ', error);
      }
        } else if (createType === 'Task') {
      // console.log('Create Task:', taskInfo);
      // Logic to handle creating a task
    }
    handleCloseModal();
  };

  

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CreateProject')}>
          <FontAwesome name="book" size={30} color="#0d0d0d" />
          <Text style={styles.buttonText}>Create a Project</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => toggleModal('Task')}>
          <FontAwesome name="tasks" size={30} color="#0d0d0d" />
          <Text style={styles.buttonText}>Create a Task</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.modalView}>
            <Pressable style={styles.downIcon} onPress={handleCloseModal}>
                <FontAwesome name="arrow-down" size={24} color="#C9EF76" />
              </Pressable>
              {createType === 'Project' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Project Name"
                    value={projectInfo.projectName}
                    onChangeText={(text) => setProjectInfo({ ...projectInfo, projectName: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Project Description"
                    value={projectInfo.projectDescription}
                    onChangeText={(text) => setProjectInfo({ ...projectInfo, projectDescription: text })}
                  />
                  <Text style={styles.label}>Start Date</Text>
                  <DateTimePicker
                    style={styles.input}
                    mode="date"
                    value={projectInfo.startDate}
                    onChange={handleStartDateChange}
                  />
                  <Text style={styles.label}>End Date</Text>
                  <DateTimePicker
                    style={styles.input}
                    mode="date"
                    value={projectInfo.endDate}
                    onChange={handleEndDateChange}
                  />
                  <Text style={styles.label}>Priority:</Text>
                  <View style={styles.priorityButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        isLowPrioritySelected ? styles.priorityLowSelected : styles.priorityLow,
                      ]}
                      onPress={handleLowPrioritySelection}>
                      <Text
                        style={[
                          styles.priorityLowButtonText,
                          isLowPrioritySelected && { color: '#0d0d0d' },
                        ]}>
                        LOW
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        isMediumPrioritySelected ? styles.priorityMediumSelected : styles.priorityMedium,
                      ]}
                      onPress={handleMediumPrioritySelection}>
                      <Text
                        style={[
                          styles.priorityMediumButtonText,
                          isMediumPrioritySelected && { color: '#0d0d0d' },
                        ]}>
                        MEDIUM
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        isHighPrioritySelected ? styles.priorityHighSelected : styles.priorityHigh,
                      ]}
                      onPress={handleHighPrioritySelection}>
                      <Text
                        style={[
                          styles.priorityHighButtonText,
                          isHighPrioritySelected && { color: '#0d0d0d' },
                        ]}>
                        HIGH
                      </Text>
                    </TouchableOpacity>
                    </View>
                  <Text style={styles.label}>Assigned Members:</Text>
                  <View style={styles.memberContainer}>
                    {assignedMembers.map((member, index) => (
                      <View key={index} style={styles.memberCircle}>
                        <Text style={styles.memberCount}>{member.initial}</Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter member email"
                    value={newMemberEmail}
                    onChangeText={(text) => setNewMemberEmail(text)}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
                    <Text style={styles.createButtonText}>Add Member</Text>
                  </TouchableOpacity>
                </View>
              )}
              {createType === 'Task' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Task Name"
                    value={taskInfo.taskName}
                    onChangeText={(text) => setTaskInfo({ ...taskInfo, taskName: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Task Description"
                    value={taskInfo.taskDescription}
                    onChangeText={(text) => setTaskInfo({ ...taskInfo, taskDescription: text })}
                  />
                  <DateTimePicker
                    style={styles.input}
                    mode="date"
                    value={taskInfo.deadline}
                    onChange={(event, selectedDate) => {
                      const currentDate = selectedDate || taskInfo.deadline;
                      setTaskInfo({ ...taskInfo, deadline: currentDate });
                    }}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Priority"
                    value={taskInfo.priority}
                    onChangeText={(text) => setTaskInfo({ ...taskInfo, priority: text })}
                  />
                </View>
              )}
              <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },

  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9EF76',
    margin: 5,
    padding: 10,
    borderRadius: 10,
  },

  buttonText: {
    marginLeft: 10,
    fontSize: 18,
    color: '#0d0d0d',
  },

  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalView: {
    backgroundColor: '#0d0d0d',
    borderWidth: 2,
    borderColor: '#C9EF76',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  
  inputContainer: {
    marginBottom: 20,
    width: 300,
    height: 500, 
  },

  input: {
    width: '100%',
    height: 40,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    color: '#fff',
  },

  label: {
    color: 'white',
    marginTop: 10,
    marginBottom: 5,
  },

  priorityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  priorityButton: {
    backgroundColor: '#C9EF76',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  priorityHigh: {
    backgroundColor: '#0d0d0d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderColor: 'red',
    borderWidth: 1,
  },

  priorityHighSelected: {
    backgroundColor: 'red',
  },

  priorityHighButtonText: {
    fontSize: 16,
    color: 'red',
  },

  priorityMedium: {
    backgroundColor: '#0d0d0d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderColor: 'yellow',
    borderWidth: 1,
  },

  priorityMediumSelected: {
    backgroundColor: 'yellow',
  },

  priorityMediumButtonText: {
    fontSize: 16,
    color: 'yellow',
  },

  priorityLow: {
    backgroundColor: '#0d0d0d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderColor: 'green',
    borderWidth: 1,
  },

  priorityLowSelected: {
    backgroundColor: 'green',
  },

  priorityLowButtonText: {
    fontSize: 16,
    color: 'green',
  },

  priorityButtonText: {
    fontSize: 16,
    color: '#0d0d0d',
  },

  prioritySelected: {
    backgroundColor: '#C9EF76', // Change to selected color
  },

  createButton: {
    backgroundColor: '#C9EF76',
    padding: 10,
    borderRadius: 10,
    marginTop: 40,
  },

  createButtonText: {
    fontSize: 18,
    color: '#2E2E2E',
  },
  
  downIcon: {
    position: 'absolute',
    marginTop: -30, 
    alignSelf: 'center',
    },

  memberContainer: {
    // backgroundColor: 'red',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    },  

  memberCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C9EF76',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  memberCount: {
    fontSize: 18,
    color: '#0d0d0d',
  },

  addButton: {
    backgroundColor: '#C9EF76',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
});

export default AddNew;
