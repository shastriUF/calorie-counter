import { useState, useRef, useEffect } from 'react';
import { TextInput, Button, StyleSheet, FlatList, Animated, Pressable, TouchableWithoutFeedback, Keyboard, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import IngredientItem from './components/IngredientItem';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function IngredientsScreen() {
  const [ingredient, setIngredient] = useState('');
  const [calories, setCalories] = useState('');
  const [ingredients, setIngredients] = useState<{ name: string; calories: number }[]>([]);
  const scale = useRef(new Animated.Value(1)).current;
  const scheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const storedIngredients = await AsyncStorage.getItem('ingredients');
        if (storedIngredients) {
          setIngredients(JSON.parse(storedIngredients));
        }
      } catch (error) {
        console.error('Failed to load ingredients', error);
      }
    };

    loadIngredients();
  }, []);

  const saveIngredients = async (newIngredients: { name: string; calories: number }[]) => {
    try {
      await AsyncStorage.setItem('ingredients', JSON.stringify(newIngredients));
    } catch (error) {
      console.error('Failed to save ingredients', error);
    }
  };

  const addIngredient = () => {
    const existingIngredientIndex = ingredients.findIndex(item => item.name.toLowerCase() === ingredient.toLowerCase());
    let newIngredients;
    if (existingIngredientIndex !== -1) {
      newIngredients = [...ingredients];
      newIngredients[existingIngredientIndex] = { name: ingredient, calories: parseInt(calories) };
    } else {
      newIngredients = [...ingredients, { name: ingredient, calories: parseInt(calories) }];
    }
    setIngredients(newIngredients);
    saveIngredients(newIngredients);
    setIngredient('');
    setCalories('');
  };

  const deleteIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
    saveIngredients(newIngredients);
  };

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

  const isCaloriesValid = !isNaN(parseInt(calories)) && isFinite(parseInt(calories)) && parseInt(calories) > 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <ThemedText type="title" style={styles.headerText}>Add Ingredient</ThemedText>
        <TextInput
          style={[styles.input, { borderColor, color: textColor }]}
          value={ingredient}
          onChangeText={setIngredient}
          placeholder="Ingredient name"
          placeholderTextColor={scheme === 'dark' ? '#ccc' : '#888'}
        />
        <TextInput
          style={[styles.input, { borderColor, color: textColor }]}
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
          placeholder="Calories per unit"
          placeholderTextColor={scheme === 'dark' ? '#ccc' : '#888'}
        />
        <Button
          title="Add"
          onPress={addIngredient}
          disabled={!ingredient || !calories || !isCaloriesValid}
        />
        <FlatList
          data={ingredients}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <IngredientItem
              name={item.name}
              calories={item.calories}
              onDelete={() => deleteIngredient(index)}
            />
          )}
        />
        <ThemedView style={styles.buttonRow}>
          <Link href="/" asChild>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                <ThemedText style={styles.buttonText}>Go Back Home</ThemedText>
              </Animated.View>
            </Pressable>
          </Link>
          <Link href="/calories" asChild>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                <ThemedText style={styles.buttonText}>Track Calories</ThemedText>
              </Animated.View>
            </Pressable>
          </Link>
        </ThemedView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 100, // Add padding to the top
  },
  headerText: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  buttonText: {
    color: '#007BFF',
    padding: 15,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    textAlign: 'center',
    marginHorizontal: 10,
  },
});
