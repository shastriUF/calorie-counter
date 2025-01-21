import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Animated, Pressable } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Ingredient = {
  name: string;
  quantity: number;
  calories: number;
};

export default function CaloriesScreen() {
  const [ingredient, setIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalCalories, setTotalCalories] = useState(0);
  const [consumedItems, setConsumedItems] = useState<Ingredient[]>([]);
  const [ingredientsData, setIngredientsData] = useState<Ingredient[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const scale = useRef(new Animated.Value(1)).current;
  const currentDate = new Date().toLocaleDateString();

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const storedIngredients = await AsyncStorage.getItem('ingredients');
        if (storedIngredients) {
          setIngredientsData(JSON.parse(storedIngredients));
        }
      } catch (error) {
        console.error('Failed to load ingredients', error);
      }
    };

    const loadTotalCalories = async () => {
      try {
        const storedCalories = await AsyncStorage.getItem(`calories_${currentDate}`);
        if (storedCalories) {
          setTotalCalories(parseInt(storedCalories));
        }
      } catch (error) {
        console.error('Failed to load total calories', error);
      }
    };

    const loadConsumedItems = async () => {
      try {
        const storedItems = await AsyncStorage.getItem(`consumedItems_${currentDate}`);
        if (storedItems) {
          setConsumedItems(JSON.parse(storedItems));
        }
      } catch (error) {
        console.error('Failed to load consumed items', error);
      }
    };

    loadIngredients();
    loadTotalCalories();
    loadConsumedItems();
  }, [currentDate]);

  const saveTotalCalories = async (calories: number) => {
    try {
      await AsyncStorage.setItem(`calories_${currentDate}`, calories.toString());
    } catch (error) {
      console.error('Failed to save total calories', error);
    }
  };

  const saveConsumedItems = async (items: Ingredient[]) => {
    try {
      await AsyncStorage.setItem(`consumedItems_${currentDate}`, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save consumed items', error);
    }
  };

  const addCalories = () => {
    const ingredientData = ingredientsData.find(item => item.name.toLowerCase() === ingredient.toLowerCase());
    if (ingredientData) {
      const quantity_num = parseFloat(quantity);
      const calories = ingredientData.calories * quantity_num;
      const newTotalCalories = totalCalories + calories;
      const newConsumedItems = [...consumedItems, { name: ingredient, quantity: quantity_num, calories }];
      setTotalCalories(newTotalCalories);
      setConsumedItems(newConsumedItems);
      saveTotalCalories(newTotalCalories);
      saveConsumedItems(newConsumedItems);
      setErrorMessage('');
    } else {
      setErrorMessage('Ingredient not found! Add it in the Ingredients tab.');
    }
    setIngredient('');
    setQuantity('');
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

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
      <Text style={styles.dateText}>{currentDate}</Text>
      <Text style={styles.headerText}>Total Calories: {totalCalories}</Text>
      <TextInput
        style={styles.input}
        value={ingredient}
        onChangeText={setIngredient}
        placeholder="Enter ingredient"
      />
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="Enter quantity"
      />
      <Button title="Add" onPress={addCalories} />
      <FlatList
        data={consumedItems}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>{item.name}: {item.quantity} units, {item.calories} calories</Text>
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
        <Link href="/ingredients" asChild>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Text style={styles.buttonText}>Add Ingredients</Text>
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
  errorBanner: {
    backgroundColor: 'red',
    padding: 10,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 18,
    marginBottom: 10,
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
});
