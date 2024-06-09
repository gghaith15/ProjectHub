import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';

const MemberModal = ({ visible, members, currentUserId, creatorId, onClose, onAddMember, onRemoveMember }) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const handleAddMember = () => {
    setIsAddingMember(true);
  };

  const handleConfirmAddMember = () => {
    // Call the onAddMember function with the new member email
    onAddMember(newMemberEmail);
    setNewMemberEmail('');
    setIsAddingMember(false);
  };

  const handleCancelAddMember = () => {
    setIsAddingMember(false);
    setNewMemberEmail('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Members</Text>
          {members.map((member, index) => (
            <View key={index} style={styles.memberItem}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberEmail}>{member.email}</Text>
              {currentUserId === creatorId && (
                <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveMember(member.memberId)}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {currentUserId === creatorId && !isAddingMember && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
          )}
          {isAddingMember && (
            <View style={styles.addMemberContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter member email"
                value={newMemberEmail}
                onChangeText={(text) => {
                    // console.log("TextInput value:", text);
                    setNewMemberEmail(text);
                  }} />
              <View style={styles.addMemberButtons}>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAddMember}>
                  <Text style={styles.confirmButtonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAddMember}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 400,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  memberName: {
    fontSize: 16,
  },
  memberEmail: {
    fontSize: 14,
    color: 'gray',
  },
  removeButton: {
    backgroundColor: '#FF6347',
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
  },
  addButton: {
    backgroundColor: '#C9EF76',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#fff',
  },
  addMemberContainer: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  addMemberButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: '#C9EF76',
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  confirmButtonText: {
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    
  },
  closeButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',

  },
  closeButtonText: {
    color: '#fff',
  },
});

export default MemberModal;
