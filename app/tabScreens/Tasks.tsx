import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

const Tasks = ({ navigation }: RouterProps) => {
  const [selectedSortCriteria, setSelectedSortCriteria] = useState<'recentlyAdded' | 'highToLow' | 'lowToHigh'>('recentlyAdded');
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
        <Text style={styles.headerText}>MANAGE{'\n'}YOUR TASKS</Text>
      </View>

      {/* Button to trigger the modal */}
      <Button title="Sort / Filter" onPress={toggleModal} />

      {/* Modal for selecting sorting criteria */}
      {isModalVisible && (
        <View style={styles.modal}>
          <Button title="Recently Added" onPress={() => handleSortChange('recentlyAdded')} />
          <Button title="Close" onPress={toggleModal} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Replace this with your TaskComponent or Task items */}
        <TouchableOpacity
          style={styles.taskContainer}
          onPress={() => {
            // Handle press event
          }}
        >
          <Text style={styles.taskText}>Task 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.taskContainer}
          onPress={() => {
            // Handle press event
          }}
        >
          <Text style={styles.taskText}>Task 2</Text>
        </TouchableOpacity>
        {/* Add more tasks as needed */}
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
  },

  taskContainer: {
    padding: 55,
    marginBottom: 10,
  },

  taskText: {
    fontSize: 18,
    color: 'white',
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

export default Tasks;
