import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Splash from "../screens/auth/Splash";
import Login from "../screens/auth/Login";
import Profile from "../screens/inAppScreens/Profile";
import CreateAccount from "../screens/auth/CreateAccount";
import TabNavigator from "./TabNavigator";
import ProjectDetails from "../components/ProjectDetails";
import CreateProject from "../components/CreateProject";
import ForgotPassword from "../screens/auth/ForgotPassword";

const Stack = createStackNavigator();
// The Stack Navigator for the main screens of the application

const MainNavigator = () => {
  
  return (
    <Stack.Navigator
      initialRouteName="Splash" // Set Splash as the initial route
      screenOptions={{
        cardStyle: { backgroundColor: "#fff" },
      }}
    >
       {/* ForgotPassword screen */}
       <Stack.Screen
        name="ForgotPassword" 
        component={ForgotPassword} 
        options={{
          headerShown: false,
        }}
        />

      {/* Profile screen */}
      <Stack.Screen
        name="CreateProject" 
        component={CreateProject} 
        />


      {/* Profile screen */}
      <Stack.Screen
        name="Profile" 
        component={Profile} 
        options={{
          headerShown: false,
        }}
        />

      {/* ProjectDetails screen */}
      <Stack.Screen
        name="Project Details" 
        component={ProjectDetails} 
        options={{
          headerShown: false,
        }}
        />            

      {/* Splash screen */}
      <Stack.Screen
        name="Splash" 
        component={Splash} 
        options={{headerShown: false}} />

      {/* Login Screen */}
      <Stack.Screen
        name="Login" 
        component={Login} 
        options={{headerShown: false}} />

      {/* CreateAccount screen */}
      <Stack.Screen
        name="CreateAccount" 
        component={CreateAccount} 
        options={{headerShown: false}} />
     
      {/* Goes to TabNavigator component */}
      <Stack.Screen
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
        name="TabNavigator"
        component={TabNavigator}
      />



      
    </Stack.Navigator>
  );
};

export default MainNavigator;

