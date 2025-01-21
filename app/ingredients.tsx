import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Animated, Pressable, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IngredientsScreen() {
  const [ingredient, setIngredient] = useState('');
  const [calories, setCalories] = useState('');
  const [ingredients, setIngredients] = useState<{ name: string; calories: number }[]>([]);
  const scale = useRef(new Animated.Value(1)).current;

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

  const deleteIngredient = (name: string) => {
    const newIngredients = ingredients.filter(item => item.name.toLowerCase() !== name.toLowerCase());
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
    <View style={styles.container}>
      <Text style={styles.headerText}>Add Ingredient</Text>
      <TextInput
        style={styles.input}
        value={ingredient}
        onChangeText={setIngredient}
        placeholder="Ingredient name"
      />
      <TextInput
        style={styles.input}
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
        placeholder="Calories per unit"
      />
      <Button
        title="Add"
        onPress={addIngredient}
        disabled={!ingredient || !calories || !isCaloriesValid}
      />
      <FlatList
        data={ingredients}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>{item.name}: {item.calories} calories</Text>
            <TouchableOpacity onPress={() => deleteIngredient(item.name)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.buttonRow}>
        <Link href="/" asChild>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Text style={styles.buttonText}>Go Back Home</Text>
            </Animated.View>
          </Pressable>
        </Link>
        <Link href="/calories" asChild>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Text style={styles.buttonText}>Track Calories</Text>
            </Animated.View>
          </Pressable>
        </Link>
      </View>
    </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '80%',
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonText: {
    color: '#007BFF',
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  deleteText: {
    color: 'red',
    marginLeft: 10,
  },
});
