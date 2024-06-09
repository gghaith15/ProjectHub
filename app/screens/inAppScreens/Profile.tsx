import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { NavigationProp, CommonActions } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_DB, auth } from '../../../FirebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FontAwesome } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';

interface RouterProps {
    navigation: NavigationProp<any, any>;
}

const Profile = ({ navigation }: RouterProps) => {
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [userDocId, setUserDocId] = useState<string | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [newName, setNewName] = useState<string>('');

    useEffect(() => {
        const clearLocalProfilePhoto = async () => {
            await AsyncStorage.removeItem('profilePhoto');
        };

        const loadProfileData = async () => {
            await clearLocalProfilePhoto();

            const currentUser = auth.currentUser;
            if (currentUser) {
                const uid = currentUser.uid;
                setUserEmail(currentUser.email || '');

                try {
                    const userDocRef = doc(FIREBASE_DB, 'users', uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        console.log("User data:", data);
                        setUserName(data?.name || '');
                        setUserDocId(userDoc.id);

                        if (data?.profilePhoto) {
                            console.log("Profile photo URL fetched:", data.profilePhoto);
                            setProfilePhoto(data.profilePhoto);
                            await AsyncStorage.setItem('profilePhoto', data.profilePhoto);
                        } else {
                            console.log("No profile photo found in user data.");
                        }
                    } else {
                        console.error("User document not found for UID:", uid);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        loadProfileData();
    }, []);

    const handleUploadPicture = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                const response = await fetch(uri);
                const blob = await response.blob();
                const storage = getStorage();
                const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
                await uploadBytes(storageRef, blob);

                const downloadURL = await getDownloadURL(storageRef);
                console.log("Generated Download URL:", downloadURL);

                if (userDocId) {
                    const userDocRef = doc(FIREBASE_DB, 'users', userDocId);
                    await updateDoc(userDocRef, { profilePhoto: downloadURL });

                    setProfilePhoto(downloadURL);
                    await AsyncStorage.setItem('profilePhoto', downloadURL);
                } else {
                    console.error("No user document ID found.");
                }
            }
        } catch (error) {
            console.error('Error uploading picture:', error);
            Alert.alert('Error uploading picture:', error.message);
        }
    };

    const handleEditUserData = () => {
        setNewName(userName);
        setEditModalVisible(true);
    };

    const handleSaveUserData = async () => {
        try {
            if (!newName) {
                Alert.alert('Please fill in the name field');
                return;
            }

            if (userDocId) {
                const userDocRef = doc(FIREBASE_DB, 'users', userDocId);
                await updateDoc(userDocRef, { name: newName });

                setUserName(newName);
                setEditModalVisible(false);
                Alert.alert('Profile updated successfully');
            } else {
                console.error("No user document ID found.");
            }
        } catch (error) {
            console.error('Error updating user data:', error);
            Alert.alert('Error updating user data:', error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            await AsyncStorage.clear();

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error logging out:', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.profilePictureContainer}
                onPress={handleUploadPicture}
            >
                {profilePhoto ? (
                    <Image
                        style={styles.profilePicture}
                        source={{ uri: profilePhoto }}
                        onError={(e) => {
                            console.error('Failed to load profile photo', e.nativeEvent.error);
                            setProfilePhoto(null);
                        }}
                    />
                ) : (
                    <Text style={styles.defaultText}>Choose a Photo</Text>
                )}
            </TouchableOpacity>
            <Text style={styles.userName}>{userName || 'User'}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditUserData}>
                <FontAwesome name="pencil" size={20} color="#C9EF76" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

            <Modal visible={editModalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        value={newName}
                        onChangeText={setNewName}
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveUserData}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#0d0d0d',
        padding: 20,
    },
    profilePictureContainer: {
        borderColor: '#C9EF76',
        borderWidth: 1,
        borderRadius: 75,
        marginTop: 50,
        alignItems: 'center',
        marginBottom: 20,
    },
    profilePicture: {
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    defaultText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginTop: 60,
    },
    userName: {
        marginTop: 20,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    userEmail: {
        marginTop: 5,
        marginBottom: 20,
        fontSize: 18,
        color: '#fff',
    },
    editButton: {
        position: 'absolute',
        top: 265,
        right: 30,
    },
    logoutButton: {
        position: 'absolute',
        bottom: 30,
        backgroundColor: '#CF312B',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    input: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
        width: '80%',
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#C9EF76',
        padding: 10,
        borderRadius: 5,
        width: '80%',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#FF6347',
        padding: 10,
        borderRadius: 5,
        width: '80%',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default Profile;
