import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Link } from 'expo-router';
import { useRef } from 'react';

export default function HomeScreen() {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Link href="/calories" asChild>
        <Pressable
          style={styles.button}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Text>Track Calories</Text>
          </Animated.View>
        </Pressable>
      </Link>
      <Link href="/ingredients" asChild>
        <Pressable
          style={styles.button}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Text>Add Ingredients</Text>
          </Animated.View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50, // Add padding to the top
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
});
