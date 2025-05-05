import { Stack } from "expo-router";
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{ 
          headerShown: false 
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="calories" />
        <Stack.Screen name="ingredients" />
      </Stack>
    </ThemeProvider>
  );
}
