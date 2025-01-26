import { StyleSheet, Pressable, Animated } from 'react-native';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const caloriesButtonScale = useRef(new Animated.Value(1)).current;
  const ingredientsButtonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ThemedView style={styles.container}>
      <Link href="/calories" asChild>
        <Pressable
          onPressIn={() => handlePressIn(caloriesButtonScale)}
          onPressOut={() => handlePressOut(caloriesButtonScale)}
        >
          <Animated.View style={{ transform: [{ scale: caloriesButtonScale }] }}>
            <ThemedText style={styles.buttonText}>
              <Ionicons name="stats-chart-outline" size={16} /> Track Calories
            </ThemedText>
          </Animated.View>
        </Pressable>
      </Link>
      <Link href="/ingredients" asChild>
        <Pressable
          onPressIn={() => handlePressIn(ingredientsButtonScale)}
          onPressOut={() => handlePressOut(ingredientsButtonScale)}
        >
          <Animated.View style={{ transform: [{ scale: ingredientsButtonScale }] }}>
            <ThemedText style={styles.buttonText}>
              <Ionicons name="add-circle-outline" size={16} /> Add Ingredients
            </ThemedText>
          </Animated.View>
        </Pressable>
      </Link>
    </ThemedView>
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
  buttonText: {
    color: '#007BFF',
    padding: 15,
    backgroundColor: '#E0E0E0',
    borderRadius: 10, // Rounded corners
    textAlign: 'center',
    marginHorizontal: 10,
    marginVertical: 20,
  },
});
