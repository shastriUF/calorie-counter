import { useState, useEffect, useRef } from 'react';
import { TextInput, Button, StyleSheet, FlatList, Animated, Pressable, TouchableWithoutFeedback, Keyboard, useColorScheme, View } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ConsumedItem from './components/ConsumedItem';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

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
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
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
          const parsedIngredients = JSON.parse(storedIngredients);
          setIngredientsData(parsedIngredients);
        }
      } catch (error) {
        console.error('Failed to load ingredients', error);
      }
    };

    const loadTotalCalories = async () => {
      try {
        const storedCalories = await AsyncStorage.getItem(`calories_${selectedDate.toLocaleDateString()}`);
        if (storedCalories) {
          setTotalCalories(parseInt(storedCalories));
        } else {
          setTotalCalories(0);
        }
      } catch (error) {
        console.error('Failed to load total calories', error);
      }
    };

    const loadConsumedItems = async () => {
      try {
        const storedItems = await AsyncStorage.getItem(`consumedItems_${selectedDate.toLocaleDateString()}`);
        if (storedItems) {
          setConsumedItems(JSON.parse(storedItems));
        } else {
          setConsumedItems([]);
        }
      } catch (error) {
        console.error('Failed to load consumed items', error);
      }
    };

    loadIngredients();
    loadTotalCalories();
    loadConsumedItems();
  }, [selectedDate]);

  const saveTotalCalories = async (calories: number) => {
    try {
      await AsyncStorage.setItem(`calories_${selectedDate.toLocaleDateString()}`, calories.toString());
    } catch (error) {
      console.error('Failed to save total calories', error);
    }
  };

  const saveConsumedItems = async (items: Ingredient[]) => {
    try {
      await AsyncStorage.setItem(`consumedItems_${selectedDate.toLocaleDateString()}`, JSON.stringify(items));
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

  const deleteConsumedItem = (index: number) => {
    const newConsumedItems = [...consumedItems];
    newConsumedItems.splice(index, 1);
    setConsumedItems(newConsumedItems);
    saveConsumedItems(newConsumedItems);
    const totalCalories = newConsumedItems.reduce((sum, item) => sum + item.calories, 0);
    setTotalCalories(totalCalories);
    saveTotalCalories(totalCalories);
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

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const isQuantityValid = !isNaN(parseFloat(quantity)) && isFinite(parseFloat(quantity)) && parseFloat(quantity) > 0;

  const handleIngredientChange = (text: string) => {
    setIngredient(text);
    if (text) {
      const filtered = ingredientsData.filter(ingredient =>
        ingredient.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredIngredients(filtered);
    } else {
      setFilteredIngredients([]);
    }
  };

  const handleIngredientSelect = (name: string) => {
    setIngredient(name);
    setFilteredIngredients([]);
  };

  const refreshCalories = () => {
    const newTotalCalories = consumedItems.reduce((sum, item) => {
      const ingredientData = ingredientsData.find(ingredient => ingredient.name.toLowerCase() === item.name.toLowerCase());
      return sum + (ingredientData ? ingredientData.calories * item.quantity : 0);
    }, 0);
    setTotalCalories(newTotalCalories);
    saveTotalCalories(newTotalCalories);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <StatusBar />
        {errorMessage ? (
          <ThemedView style={styles.errorBanner}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </ThemedView>
        ) : null}
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
        <ThemedText type="title" style={styles.headerText}>Total Calories: {totalCalories}</ThemedText>
        <TextInput
          style={[styles.input, { borderColor, color: textColor }]}
          value={ingredient}
          onChangeText={handleIngredientChange}
          placeholder="Enter ingredient"
          placeholderTextColor={scheme === 'dark' ? '#ccc' : '#888'}
        />
        {filteredIngredients.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor, borderColor }]}>
            {filteredIngredients.map((item, index) => (
              <Pressable key={index} onPress={() => handleIngredientSelect(item.name)}>
                <ThemedText style={styles.suggestionText}>{item.name}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}
        <TextInput
          style={[styles.input, { borderColor, color: textColor }]}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="Enter quantity"
          placeholderTextColor={scheme === 'dark' ? '#ccc' : '#888'}
        />
        <Button
          title="Add"
          onPress={addCalories}
          disabled={!ingredient || !quantity || !isQuantityValid}
        />
        <Button
          title="Refresh Calories"
          onPress={refreshCalories}
        />
        <FlatList
          data={consumedItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <ConsumedItem
              name={item.name}
              quantity={item.quantity}
              calories={item.calories}
              onDelete={() => deleteConsumedItem(index)}
            />
          )}
          contentContainerStyle={{ paddingTop: 0 }}
        />
        <ThemedView style={styles.buttonRow}>
          <Link href="/" asChild>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                <ThemedText style={styles.buttonText}>
                  <Ionicons name="home-outline" size={16} />
                </ThemedText>
              </Animated.View>
            </Pressable>
          </Link>
          <Link href="/ingredients" asChild>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                <ThemedText style={styles.buttonText}>
                  <Ionicons name="add-circle-outline" size={16} /> Add Ingredients
                </ThemedText>
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
  errorBanner: {
    backgroundColor: 'red',
    padding: 10,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerText: {
    marginBottom: 20,
    paddingTop: 20, // Add padding between the date and the total calories line
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 0,
    paddingHorizontal: 10,
    width: '80%',
    borderRadius: 10, // Rounded corners
  },
  suggestionsContainer: {
    width: '70%',
    borderWidth: 0.5,
    marginBottom: 20,
    borderRadius: 10, // Rounded corners
  },
  suggestionText: {
    padding: 5,
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
    borderRadius: 10, // Rounded corners
    textAlign: 'center',
    marginHorizontal: 10,
  },
});
