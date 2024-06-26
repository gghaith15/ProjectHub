import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';

interface TaskProps {
  id: string;
  taskDetails: string;
  deadline: Timestamp;
  isChecked: boolean;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
  projectTitle: string;
}

const TaskComponent: React.FC<TaskProps> = ({ id, taskDetails, deadline, isChecked, onDelete, onCheck, projectTitle }) => {
  const [modalVisible, setModalVisible] = useState(false);

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

  const formattedDeadline = deadline ? deadline.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'No deadline';

  return (
    <>
      <View style={styles.rowFront}>
        <TouchableOpacity onLongPress={handleOpenTask}>
          <View style={styles.container}>
            <View style={styles.textContainer}>
              <Text style={styles.taskDetails}>{truncateText(taskDetails, 35)}</Text>
              <Text style={styles.deadline}>{formattedDeadline}</Text>
            </View>
            <TouchableOpacity style={[styles.checkBox, isChecked && styles.checkedBox]} onPress={() => onCheck(id)}>
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
            <Text>{projectTitle}</Text>
            <Text style={styles.modalTaskDetails}>{taskDetails}</Text>
            <Text style={styles.modalDeadline}>{formattedDeadline}</Text>
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
    width: '90%',
    height: 70,
    borderRadius: 25,
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
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 14,
  },
  checkedBox: {
    width: 28,
    height: 28,
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
  rowFront: {
    height: 60,
    width: "100%",
    borderRadius: 10,
    marginTop: 5,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
    marginTop: 20,
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
