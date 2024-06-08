import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Swiper from 'react-native-swiper';
import { NavigationProp } from '@react-navigation/native';
import { auth } from '../../../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

const Splash = ({ navigation }: RouterProps) => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.navigate('TabNavigator', { screen: 'Main' }); // navigate to the Home Screen 
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <Swiper style={styles.wrapper} 
    showsButtons={false} 
    loop={false}
    dot={<View style={styles.dot} />}
    activeDot={<View style={styles.activeDot} />}
    paginationStyle={styles.pagination}>

      <View style={styles.slide}>
      <Image source={require('../../assets/splash_design_1.png')} style={styles.image} />
        <Text style={styles.title}>Feature One</Text>
        <Text style={styles.text}>Description of feature one goes here. Explain the benefit to the user.</Text>
          <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.slide}>
      <Image source={require('../../assets/splash_design_1.png')} style={styles.image} />
        <Text style={styles.title}>Feature Two</Text>
        <Text style={styles.text}>Description of feature two goes here. Explain the benefit to the user.</Text>
      </View>

      <View style={styles.slide}>
      <Image source={require('../../assets/splash_design_1.png')} style={styles.image} />
        <Text style={styles.title}>Feature Three</Text>
        <Text style={styles.text}>Description of feature three goes here. Explain the benefit to the user.</Text>
        <TouchableOpacity style={styles.getStartedButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

    </Swiper>
  );
};

const styles = StyleSheet.create({
  wrapper: {},

  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C9EF76',
    marginBottom: 10,
    textAlign: 'center',
  },

  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },

  image: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },

  skipButton: {
    backgroundColor: '#C9EF76',
    padding: 10,
    marginTop: 20,    width: 80, // Adjust the width of the button
    height: 80, // Adjust the height of the button
    borderRadius: 40, // Half of the width and height for circular shape    alignItems: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },

  skipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },

  getStartedButton: {
    backgroundColor: '#C9EF76',
    padding: 10,
    marginTop: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },

  dot: {
    backgroundColor: 'rgba(255,255,255,.3)',
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 3,
  },

  activeDot: {
    backgroundColor: '#C9EF76',
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 3,
  },

  pagination: {
    bottom: 70,
  },

});

export default Splash;
