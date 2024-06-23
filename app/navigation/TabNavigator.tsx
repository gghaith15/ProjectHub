import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationProp } from '@react-navigation/native';
import Projects from "../tabScreens/Projects";
import Tasks from "../tabScreens/Tasks";
import AddNew from "../tabScreens/AddNew";
import { StyleSheet, Image } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import Home from "../tabScreens/Home";


interface RouterProps{
  navigation: NavigationProp<any, any>;
}

const Tab = createBottomTabNavigator();

const TabNavigator = ({ navigation }: RouterProps) => {


  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#C9EF76",
        tabBarInactiveTintColor: "#0d0d0d",
        tabBarShowLabel: false,
        tabBarStyle: styles.container,
      }}
      safeAreaInsets={{ bottom: 0 }}
    >
      {/* The Tab.Screen components are used to define the screens of the application */}

      {/* Home screen */}
     <Tab.Screen
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome 
            name="home"
            size={25} 
            color={color}
            />
          ),
          unmountOnBlur:true
        }}
        name="Home"
        component={Home}
      /> 

      {/* Projects screen */}
      <Tab.Screen
          name="Project"
          component={Projects}
        options={{
          headerShown:false,
          tabBarIcon: ({ color }) => (
            <FontAwesome
              name="book"
              size={25}
              color= {color}
            />
          ),
          unmountOnBlur:true
        }}
      />

      {/* Tasks screen */}
      <Tab.Screen
          name="Tasks"
          component={Tasks}
        options={{
          headerShown:false,
          tabBarIcon: ({ color }) => (
            <FontAwesome
              name="tasks"
              size={25}
              color={color}
            />
            // <Image source={require('../assets/tasks2.png')} style={styles.image} />

          ),
          unmountOnBlur:true

        }}
      />

      {/* Add New Project/Task screen */}
      <Tab.Screen
      name="AddNew"
      component={AddNew}
        options={{
          headerShown:false,
          tabBarIcon: ({ color }) => (
            <FontAwesome 
            name="plus" 
            size={25} 
            color={color}
            />
          ),
          unmountOnBlur:true

        }}
      />

    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    alignItems: "center", // Center horizontally
    justifyContent: "center",
    position: "absolute",
    height: 70,
    width: "90%",
    left: "5%",
    backgroundColor: "#fff",
    marginBottom: 20,

    // Shadow properties for iOS
    shadowColor: "#000",  // Shadow color
    shadowOffset: { width: 0, height: 4 },  // Shadow offset
    shadowOpacity: 0.25,  // Shadow opacity
    shadowRadius: 10,  // Shadow radius
    
    // Elevation for Android
    elevation: 10, 
  },

  image: {
    
  },

});