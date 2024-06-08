import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { auth, FIREBASE_DB } from '../../../FirebaseConfig';

const CreateAccount = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', response.user);

      const uid = response.user.uid;
      await addUserToFirestore(uid, name, email);

      navigation.navigate('Login');
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Error creating account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addUserToFirestore = async (uid: string, name: string, email: string) => {
    try {
        const userRef = doc(collection(FIREBASE_DB, 'users'), uid);
        await setDoc(userRef, {
            name,
            email,
        });
        console.log('User added to Firestore with ID: ', uid);
    } catch (error) {
        console.error('Error adding user to Firestore: ', error);
    }
};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        placeholderTextColor={"#888888"}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={"#888888"}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={"#888888"}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor={"#888888"}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignUp}
        disabled={loading} // Disable button when loading
      >
        <Text style={styles.buttonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0d0d0d'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff'
  },
  input: {
    color: '#fff',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#C9EF76', 
    alignItems: 'center',
    justifyContent: 'center', 
    marginTop: 30,
    width: "50%", 
    height: 50, 
    borderRadius: 40, 
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d0d0d',
  },
});

export default CreateAccount;
