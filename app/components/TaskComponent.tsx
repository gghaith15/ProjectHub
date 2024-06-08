import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';

interface Task {
  id: string;
  taskDetails: string;
  deadline: string;
  onDelete: (id: string) => void;
}

const TaskComponent: React.FC<Task> = ({ id, taskDetails, deadline, onDelete }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setIsChecked(!isChecked);
  };

  const handleOpenTask = () => {
    setModalVisible(true);
  };

  const handleCloseTask = () => {
    setModalVisible(false);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  return (
    <>
      <View style={styles.rowFront}>
        <TouchableOpacity onLongPress={handleOpenTask}>
          <View style={styles.container}>
            <View style={styles.textContainer}>
              <Text style={styles.taskDetails}>{truncateText(taskDetails, 35)}</Text>
              <Text style={styles.deadline}>{deadline}</Text>
            </View>
            <TouchableOpacity style={[styles.checkBox, isChecked && styles.checkedBox]} onPress={handlePress}>
              {isChecked && (
                <FontAwesome name='check' />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.deleteButtonContainer]}
          onPress={() => onDelete(id)}
        >
          <Text style={styles.backTextWhite}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseTask}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTaskDetails}>{taskDetails}</Text>
            <Text style={styles.modalDeadline}>{deadline}</Text>
            <TouchableOpacity onPress={handleCloseTask} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'center',
    width: '80%',
    height: 60,
    borderRadius: 10,
    padding: 10,
    margin: 5,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  taskDetails: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  deadline: {
    fontSize: 12,
    color: '#ccc',
  },
  checkBox: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 5,
  },
  checkedBox: {
    width: 25,
    height: 25,
    backgroundColor: '#C9EF76',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTaskDetails: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalDeadline: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },

  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },

  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  //Swipe List View Styles

  rowFront: {
    height: 60,
    width: "100%",
    borderRadius: 10,
    margin: 10,

  },

  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
    margin: 5,
    borderRadius: 10,
  },

  deleteButtonContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
    borderRadius: 10,
  },

  backTextWhite: {
    color: '#FFF',
  },
  
});

export default TaskComponent;
