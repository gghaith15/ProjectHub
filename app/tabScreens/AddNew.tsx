import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';

interface Props {
  navigation: NavigationProp<any>;
}

const AddNew = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CreateProject')}>
          <FontAwesome name="book" size={30} color="#0d0d0d" />
          <Text style={styles.buttonText}>Create a Project</Text>
        </TouchableOpacity>
      </View>
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
});

export default AddNew;
