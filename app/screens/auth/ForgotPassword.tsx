import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Alert } from 'react-native';
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { NavigationProp } from '@react-navigation/native';
import { auth } from '../../../FirebaseConfig';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

const ForgotPassword = ({ navigation }: RouterProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Enter your email address to reset your password.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Password reset email sent!', 'Check your email to reset your password.');
      navigation.navigate('Login');
    } catch (error: any) {
      console.log(error);
      alert('Failed to send password reset email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <TextInput
          value={email}
          style={styles.input}
          placeholder="Enter your email"
          autoCapitalize="none"
          onChangeText={(text) => setEmail(text)}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <TouchableOpacity style={styles.resetButton} onPress={handlePasswordReset}>
            <Text style={styles.resetButtonText}>Reset Password</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
  resetButton: {
    backgroundColor: '#C9EF76',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 50,
    width: "50%",
    borderRadius: 40, 
    alignSelf: 'center', 

  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});
