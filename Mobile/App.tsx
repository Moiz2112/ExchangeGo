import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import LoginScreen      from './src/screens/LoginScreen';
import HomeScreen       from './src/screens/HomeScreen';
import CoinDetailScreen from './src/screens/CoinDetailScreen';
import MarketScreen     from './src/screens/MarketScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isLoggedIn } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} id={isLoggedIn ? 'App' : 'Auth'}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Home"       component={HomeScreen} />
          <Stack.Screen name="CoinDetail" component={CoinDetailScreen} />
          <Stack.Screen name="Market"     component={MarketScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </WebSocketProvider>
    </AuthProvider>
  );
}