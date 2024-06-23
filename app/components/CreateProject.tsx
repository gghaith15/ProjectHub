import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { NavigationProp } from '@react-navigation/native';
import { FIREBASE_DB, auth } from '../../FirebaseConfig';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

const CreateProject = ({ navigation }: RouterProps) => {
  const [createType, setCreateType] = useState(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [projectInfo, setProjectInfo] = useState({
    projectName: '',
    projectDescription: '',
    startDate: new Date(),
    endDate: new Date(),
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

  const memberColors = ['#C9EF76', '#00E2FF', '#D0A1FF', '#FF6E52', '#F0E446', '#3BF53E'];

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || projectInfo.startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setProjectInfo({ ...projectInfo, startDate: currentDate });

    // Ensure end date is not before the start date
    if (projectInfo.endDate < currentDate) {
      setProjectInfo({ ...projectInfo, endDate: currentDate });
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || projectInfo.endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    if (currentDate < projectInfo.startDate) {
      Alert.alert('Error', 'End date cannot be before start date.');
      setProjectInfo({ ...projectInfo, endDate: projectInfo.startDate });
    } else {
      setProjectInfo({ ...projectInfo, endDate: currentDate });
    }
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
      if (!newMemberEmail) {
        Alert.alert("Please enter an email address.");
        return;
      }
  
      const normalizedEmail = newMemberEmail.toLowerCase(); // Convert email to lowercase
      const isEmailAlreadyAdded = assignedMembers.some(member => member.email.toLowerCase() === normalizedEmail);
  
      if (isEmailAlreadyAdded) {
        Alert.alert("It's already added");
        return;
      }
  
      const q = query(collection(FIREBASE_DB, 'users'), where('email', '==', normalizedEmail));
      
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        console.log('====================================');
        console.log("userData",userData);
        console.log('====================================');
        const userName = userData.name || ''; // Assuming 'name' field exists in user document
        const userUid = userDoc.id; // Get the user's UID from the document
  
        setAssignedMembers([...assignedMembers, { id: userUid, name: userName, email: normalizedEmail }]);
        setNewMemberEmail('');
      } else {
        Alert.alert('Email does not exist');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      Alert.alert('Error checking email:', error.message);
    }
  };

  const handleCreate = async () => {
    if (!projectInfo.projectName.trim() || !projectInfo.priority.trim()) {
      Alert.alert('Error', 'Project Name and Priority are required.');
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('No user is logged in');
        return;
      }
      console.log("assignedMembers",assignedMembers);
      
      const projectData = {
        ...projectInfo,
        assignedMembers: assignedMembers.map((ele)=>ele.id), //ensure that id saved
        creatorId: currentUser.uid, // Add creator's UID
      };
      console.log('====================================');
      console.log("projectData",projectData);
      console.log('====================================');
      const docRef = await addDoc(collection(FIREBASE_DB, 'project'), projectData);
      console.log('Project added with ID: ', docRef.id);
    } catch (error) {
      console.error('Error adding project: ', error);
    }

    handleRefreshInputs();
  };

  const handleRefreshInputs = () => {
    setProjectInfo({
      projectName: '',
      projectDescription: '',
      startDate: new Date(),
      endDate: new Date(),
      priority: '',
      assignedMembers: [],
    });

    setNewMemberEmail('');
    setAssignedMembers([]);
  };

  const handlePress = () => {
    setIsEditing(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inputContainer}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          style={styles.keyboardAwareScrollView}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter project name"
              placeholderTextColor="#666"
              value={projectInfo.projectName}
              onChangeText={(text) => setProjectInfo({ ...projectInfo, projectName: text })}
            />

            <Text style={styles.label}>Project Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter project description"
              placeholderTextColor="#666"
              value={projectInfo.projectDescription}
              onChangeText={(text) => setProjectInfo({ ...projectInfo, projectDescription: text })}
            />

            <Text style={styles.label}>Start Date</Text>
            <DateTimePicker
              style={styles.dateInput}
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
                <View key={index} style={[styles.memberCircle, { backgroundColor: memberColors[index % memberColors.length] }]}>
                  <Text style={styles.memberCount}>{member ? member.name[0] : ""}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={handlePress}>
              <View style={[styles.assignMembersContainer, isEditing ? { width: '100%' } : null]}>
                {!isEditing ? (
                  <>
                    <FontAwesome style={styles.userButton} name="user" size={24} color="#fff" />
                    <FontAwesome style={styles.plusButton} name="plus" size={24} color="#fff" />
                  </>
                ) : (
                  <>
                    <TextInput
                      style={styles.inputMember}
                      placeholder="Enter member email"
                      placeholderTextColor="#666"
                      value={newMemberEmail}
                      onChangeText={(text) => setNewMemberEmail(text)}
                    />
                    <TouchableOpacity onPress={handleAddMember}>
                      <FontAwesome style={styles.checkButton} name="check" size={24} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.ButtonContainer}>
              <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },

  keyboardAwareScrollView: {
    flex: 1,
  },

  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  inputContainer: {
    height: '95%',
    width: '90%',
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

  dateInput: {
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

  memberContainer: {
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
    borderColor: '#fff',
    borderWidth: 2,
    marginBottom: 20,
    marginRight: -10,
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

  assignMembersContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    width: 115,
    gap: 40,
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 30,
    borderStyle: 'dotted',
  },

  userButton: {
    marginHorizontal: 'auto',
  },

  plusButton: {
    marginHorizontal: 'auto',
  },

  checkButton: {
    padding: 10,
    marginHorizontal: 'auto',
  },

  inputMember: {
    flex: 1,
    color: '#fff',
    marginRight: 10,
    textAlign: 'left',
    paddingLeft: 10,
  },

  ButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  createButton: {
    height: 'auto',
    width: '30%',
    backgroundColor: '#C9EF76',
    padding: 10,
    borderRadius: 30,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E2E2E',
  },
});

export default CreateProject;
