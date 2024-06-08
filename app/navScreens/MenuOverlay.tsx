import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { NavigationProp } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

const Settings = ({ navigation }: RouterProps) => {
  return (
    <View style={styles.container}>
      
      <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Account')}>
        <Text style={styles.buttonText}>Account</Text>
      </TouchableOpacity>
      </View>
      
      <View style={styles.container2}>
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={() => FIREBASE_AUTH.signOut()}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      </View>

    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the bottom
    padding: 8, // Adjust marginBottom to create spacing from the bottom
    backgroundColor: 'black',  
  },

  container2: {
    flex: 1,
    justifyContent: 'flex-end', // Align items at the bottom
    padding: 36, // Adjust marginBottom to create spacing from the bottom
  },

  button: {
    alignItems: 'center',
    backgroundColor: '#C9EF76',
    padding: 10,
    marginVertical: 5, // Adjust spacing between buttons
    borderRadius: 5, // Border radius for rounded corners
  },

  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },

  logoutButton: {
    backgroundColor: '#EF7676', // Change background color for Logout button
    alignItems: 'center',
    padding: 10,
    marginVertical: 5, // Adjust spacing between buttons
    marginHorizontal: 70,
    borderRadius: 20, // Border radius for rounded corners
  },
});

export default Settings
