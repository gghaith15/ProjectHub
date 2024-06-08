import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import MainNavigator from "./app/navigation/MainNavigator";
// import { User, onAuthStateChanged } from 'firebase/auth';
// import { FIREBASE_AUTH } from "./FirebaseConfig";



export default function App() {
  // const [user, setUser] = useState<User | null>(null);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
  //     setUser(user);
  //   });
    
  //   // Clean up subscription on unmount
  //   return unsubscribe;
  // }, []);
  console.log("app");
  
  return (
    <NavigationContainer>
      <MainNavigator />      
    </NavigationContainer>
  );
}
