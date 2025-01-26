import { useState, useRef, useEffect } from 'react';
import { TextInput, FlatList, Animated, Pressable, TouchableWithoutFeedback, Keyboard, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import IngredientItem from './components/IngredientItem';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { commonStyles } from '@/styles/commonStyles';

export default function IngredientsScreen() {
  const [ingredient, setIngredient] = useState('');
  const [calories, setCalories] = useState('');
  const [ingredients, setIngredients] = useState<{ name: string; calories: number }[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<{ name: string; calories: number }[]>([]);
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const homeButtonScale = useRef(new Animated.Value(1)).current;
  const trackButtonScale = useRef(new Animated.Value(1)).current;
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
          setIngredients(parsedIngredients);
          setFilteredIngredients(parsedIngredients);
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
    setFilteredIngredients(newIngredients);
    saveIngredients(newIngredients);
    setIngredient('');
    setCalories('');
  };

  const deleteIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
    setFilteredIngredients(newIngredients);
    saveIngredients(newIngredients);
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

  const isCaloriesValid = !isNaN(parseInt(calories)) && isFinite(parseInt(calories)) && parseInt(calories) > 0;

  const handleIngredientChange = (text: string) => {
    setIngredient(text);
    if (text) {
      const filtered = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredIngredients(filtered);
    } else {
      setFilteredIngredients(ingredients);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={[commonStyles.container, { backgroundColor, paddingTop: 100 }]}>
        <StatusBar />
        <ThemedText type="title" style={commonStyles.headerText}>Add Ingredient</ThemedText>
        <TextInput
          style={[commonStyles.input, { borderColor, color: textColor }]}
          value={ingredient}
          onChangeText={handleIngredientChange}
          placeholder="Ingredient name"
          placeholderTextColor={scheme === 'dark' ? '#ccc' : '#888'}
        />
        <TextInput
          style={[commonStyles.input, { borderColor, color: textColor }]}
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
          placeholder="Calories per unit"
          placeholderTextColor={scheme === 'dark' ? '#ccc' : '#888'}
        />
        <Pressable
          onPressIn={() => handlePressIn(addButtonScale)}
          onPressOut={() => handlePressOut(addButtonScale)}
          onPress={addIngredient}
          disabled={!ingredient || !calories || !isCaloriesValid}
        >
          <Animated.View style={{ transform: [{ scale: addButtonScale }], marginBottom: 20 }}>
            <ThemedText style={commonStyles.buttonText}>
              <Ionicons name="add-circle-outline" size={16} /> Add
            </ThemedText>
          </Animated.View>
        </Pressable>
        <FlatList
          data={filteredIngredients}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <IngredientItem
              name={item.name}
              calories={item.calories}
              onDelete={() => deleteIngredient(index)}
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
          <Link href="/calories" asChild>
            <Pressable
              onPressIn={() => handlePressIn(trackButtonScale)}
              onPressOut={() => handlePressOut(trackButtonScale)}
            >
              <Animated.View style={{ transform: [{ scale: trackButtonScale }] }}>
                <ThemedText style={commonStyles.buttonText}>
                  <Ionicons name="stats-chart-outline" size={16} /> Track Calories
                </ThemedText>
              </Animated.View>
            </Pressable>
          </Link>
        </ThemedView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}
