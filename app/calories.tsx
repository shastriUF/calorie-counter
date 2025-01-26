import { useState, useEffect, useRef } from 'react';
import { TextInput, FlatList, Animated, Pressable, TouchableWithoutFeedback, Keyboard, useColorScheme, View } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ConsumedItem from './components/ConsumedItem';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { commonStyles } from '@/styles/commonStyles';

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
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const refreshButtonScale = useRef(new Animated.Value(1)).current;
  const homeButtonScale = useRef(new Animated.Value(1)).current;
  const ingredientsButtonScale = useRef(new Animated.Value(1)).current;
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

  const refreshCalories = async () => {
    try {
      const storedItems = await AsyncStorage.getItem(`consumedItems_${selectedDate.toLocaleDateString()}`);
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        const updatedItems = parsedItems.map((item: Ingredient) => {
          const ingredientData = ingredientsData.find(ingredient => ingredient.name.toLowerCase() === item.name.toLowerCase());
          return {
            ...item,
            calories: ingredientData ? ingredientData.calories * item.quantity : item.calories,
          };
        });
        setConsumedItems(updatedItems);
        const newTotalCalories = updatedItems.reduce((sum: number, item: Ingredient) => sum + item.calories, 0);
        setTotalCalories(newTotalCalories);
        saveTotalCalories(newTotalCalories);
        saveConsumedItems(updatedItems);
      }
    } catch (error) {
      console.error('Failed to refresh calories', error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={[commonStyles.container, { backgroundColor, paddingTop: 100 }]}>
        <StatusBar />
        {errorMessage ? (
          <ThemedView style={commonStyles.errorBanner}>
            <ThemedText style={commonStyles.errorText}>{errorMessage}</ThemedText>
          </ThemedView>
        ) : null}
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
        <ThemedText type="title" style={commonStyles.headerText}>Today: {totalCalories} cal</ThemedText>
        <TextInput
          style={[commonStyles.input, { borderColor, color: textColor , marginBottom: 0 }]}
          value={ingredient}
          onChangeText={handleIngredientChange}
          placeholder="Enter ingredient"
          placeholderTextColor={scheme === 'dark' ? '#ccc' : '#888'}
        />
        {filteredIngredients.length > 0 && (
          <View style={[commonStyles.suggestionsContainer, { backgroundColor, borderColor }]}>
            {filteredIngredients.map((item, index) => (
              <Pressable key={index} onPress={() => handleIngredientSelect(item.name)}>
                <ThemedText style={commonStyles.suggestionText}>{item.name}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}
        <TextInput
          style={[commonStyles.input, { borderColor, color: textColor, marginTop: 20, marginBottom: 20 }]}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="Enter quantity"
          placeholderTextColor={scheme === 'dark' ? '#ccc' : '#888'}

        />
        <Pressable
          onPressIn={() => handlePressIn(addButtonScale)}
          onPressOut={() => handlePressOut(addButtonScale)}
          onPress={addCalories}
          disabled={!ingredient || !quantity || !isQuantityValid}
        >
          <Animated.View style={{ transform: [{ scale: addButtonScale }], marginBottom: 20 }}>
            <ThemedText style={commonStyles.buttonText}>
              <Ionicons name="add-circle-outline" size={16} /> Add
            </ThemedText>
          </Animated.View>
        </Pressable>
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
        <ThemedView style={commonStyles.buttonRow}>
          <Link href="/" asChild>
            <Pressable
              onPressIn={() => handlePressIn(homeButtonScale)}
              onPressOut={() => handlePressOut(homeButtonScale)}
            >
              <Animated.View style={{ transform: [{ scale: homeButtonScale }] }}>
                <ThemedText style={commonStyles.buttonText}>
                  <Ionicons name="home-outline" size={16} />
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
                <ThemedText style={commonStyles.buttonText}>
                  <Ionicons name="add-circle-outline" size={16} /> Add Ingredients
                </ThemedText>
              </Animated.View>
            </Pressable>
          </Link>
          <Pressable
            onPressIn={() => handlePressIn(refreshButtonScale)}
            onPressOut={() => handlePressOut(refreshButtonScale)}
            onPress={refreshCalories}
          >
            <Animated.View style={{ transform: [{ scale: refreshButtonScale }] }}>
              <ThemedText style={commonStyles.buttonText}>
                <Ionicons name="reload" size={16} />
              </ThemedText>
            </Animated.View>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}
