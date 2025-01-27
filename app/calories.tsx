import { useState, useEffect, useRef } from 'react';
import { TextInput, ScrollView, Animated, Pressable, useColorScheme, View, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemedText } from '@/components/ThemedText';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedView } from '@/components/ThemedView';
import ConsumedItemEntry from './components/ConsumedItemEntry';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { commonStyles } from '@/styles/commonStyles';

type Ingredient = {
  name: string;
  caloriesPerGram: number | null;
  caloriesPerMl: number | null;
  caloriesPerCount: number | null;
};

type ConsumedItem = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
};

const unitConversions: { [key: string]: { grams?: number; ml?: number; count?: number } } = {
  grams: { grams: 1 },
  oz: { grams: 28.3495 },
  teaspoons: { ml: 5 },
  tablespoons: { ml: 15 },
  cups: { ml: 240 },
  ml: { ml: 1 },
  count: { count: 1 },
};

export default function CaloriesScreen() {
  const [ingredient, setIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('grams');
  const [totalCalories, setTotalCalories] = useState(0);
  const [consumedItems, setConsumedItems] = useState<ConsumedItem[]>([]);
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
        setConsumedItems([]); // Ensure it's an array even on error
      }
    };
    // AsyncStorage.clear(); Uncomment this line in dev to clear all data
    loadIngredients();
    loadConsumedItems();
  }, [selectedDate]);

  useEffect(() => {
    const calculateTotalCalories = async () => {
      const totalCalories = [...consumedItems].reduce((sum, item) => sum + item.calories, 0);
      setTotalCalories(totalCalories);    
    }
    calculateTotalCalories();
  }, [consumedItems]);

  const saveConsumedItems = async (items: ConsumedItem[]) => {
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
      let calories = 0;

      if (unit in unitConversions) {
        const conversion = unitConversions[unit];
        if (conversion.grams && ingredientData.caloriesPerGram !== null) {
          calories = ingredientData.caloriesPerGram * conversion.grams * quantity_num;
        } else if (conversion.ml && ingredientData.caloriesPerMl !== null) {
          calories = ingredientData.caloriesPerMl * conversion.ml * quantity_num;
        } else if (conversion.count && ingredientData.caloriesPerCount !== null) {
          calories = ingredientData.caloriesPerCount * conversion.count * quantity_num;
        } else {
          setErrorMessage('Conversion not available for the selected unit.');
          return;
        }
      } else {
        setErrorMessage('Invalid unit selected.');
        return;
      }

      const newTotalCalories = totalCalories + calories;
      const newConsumedItems = [...consumedItems, { name: ingredient, quantity: quantity_num, unit, calories }];
      setTotalCalories(newTotalCalories);
      setConsumedItems(newConsumedItems);
      saveConsumedItems(newConsumedItems);
      setErrorMessage('');
    } else {
      setErrorMessage('Ingredient not found! Add it in the Ingredients tab.');
    }
    setIngredient('');
    setQuantity('');
    setUnit('grams');
  };

  const deleteConsumedItem = (index: number) => {
    const newConsumedItems = [...consumedItems];
    newConsumedItems.splice(index, 1);
    setConsumedItems(newConsumedItems);
    saveConsumedItems(newConsumedItems);
    const totalCalories = newConsumedItems.reduce((sum, item) => sum + item.calories, 0);
    setTotalCalories(totalCalories);
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
        const updatedItems = parsedItems.map((item: ConsumedItem) => {
          const ingredientData = ingredientsData.find(ingredient => ingredient.name.toLowerCase() === item.name.toLowerCase());
          let calories = 0;
          if (ingredientData) {
            const conversion = unitConversions[item.unit];
            if (conversion.grams && ingredientData.caloriesPerGram !== null) {
              calories = ingredientData.caloriesPerGram * conversion.grams * item.quantity;
            } else if (conversion.ml && ingredientData.caloriesPerMl !== null) {
              calories = ingredientData.caloriesPerMl * conversion.ml * item.quantity;
            } else if (conversion.count && ingredientData.caloriesPerCount !== null) {
              calories = ingredientData.caloriesPerCount * conversion.count * item.quantity;
            } else {
              calories = item.calories;
            }
          }
          return {
            ...item,
            calories,
          };
        });
        setConsumedItems(updatedItems);
        saveConsumedItems(updatedItems);
        const newTotalCalories = updatedItems.reduce((sum: number, item: ConsumedItem) => sum + item.calories, 0);
        setTotalCalories(newTotalCalories);
      }
    } catch (error) {
      console.error('Failed to refresh calories', error);
    }
  };

  const EXPORT_VERSION = 1.0;

  const exportData = async () => {
    try {
      const storedItems = await AsyncStorage.getItem(`consumedItems_${selectedDate.toLocaleDateString()}`);
      if (storedItems) {
        const date = selectedDate.toLocaleDateString().replace(/\//g, '-');
        const fileUri = FileSystem.documentDirectory + `calories_${date}.json`;
        
        const parsedStoredItems = JSON.parse(storedItems);
        const data = {
          version: EXPORT_VERSION,
          consumedItems: parsedStoredItems,
        };
        
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data), { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('No data to export');
      }
    } catch (error) {
      console.error('Failed to export data', error);
    }
  };

  const importData = async (fileUri: string) => {
    try {
      const importedData = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsedData = JSON.parse(importedData);
      const version = parsedData.version;
      if (version !== EXPORT_VERSION) {
        throw new Error(`Incompatible data version. Current version is ${EXPORT_VERSION}, imported version is ${version}`);
      }
      setConsumedItems(parsedData.consumedItems);
      await saveConsumedItems(parsedData.consumedItems);
      await refreshCalories();
    } catch (error) {
      console.error('Failed to import data', error);
      if (error instanceof Error) {
        Alert.alert('Failed to import data', error.message);
      } else {
        Alert.alert('Failed to import data', 'An unknown error occurred');
      }
    }
  };

  const handleImportPress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result && !result.canceled) {
        importData(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick document', error);
    }
  };

  return (
    <ThemedView style={[commonStyles.container, { backgroundColor, paddingTop: 100 }]}>
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
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
        <Picker
          selectedValue={unit}
          onValueChange={(itemValue) => setUnit(itemValue)}
          style={[commonStyles.picker, { color: textColor }]}
          itemStyle={{ color: textColor }}
        >
          <Picker.Item label="Grams" value="grams" />
          <Picker.Item label="Ounces" value="oz" />
          <Picker.Item label="Teaspoons" value="teaspoons" />
          <Picker.Item label="Tablespoons" value="tablespoons" />
          <Picker.Item label="Cups" value="cups" />
          <Picker.Item label="Milliliters" value="ml" />
          <Picker.Item label="Count" value="count" />
        </Picker>
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
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1 }}>
          {consumedItems.map((item, index) => (
            <ConsumedItemEntry
              key={index}
              name={item.name}
              quantity={item.quantity}
              unit={item.unit}
              calories={item.calories}
              onDelete={() => deleteConsumedItem(index)}
            />
          ))}
        </ScrollView>
      </ScrollView>
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
        <Pressable
          onPressIn={() => handlePressIn(addButtonScale)}
          onPressOut={() => handlePressOut(addButtonScale)}
          onPress={exportData}
        >
          <Animated.View style={{ transform: [{ scale: addButtonScale }] }}>
            <ThemedText style={commonStyles.buttonText}>
              <Ionicons name="cloud-upload-outline" size={16} />
            </ThemedText>
          </Animated.View>
        </Pressable>
        <Pressable
          onPressIn={() => handlePressIn(addButtonScale)}
          onPressOut={() => handlePressOut(addButtonScale)}
          onPress={handleImportPress}
        >
          <Animated.View style={{ transform: [{ scale: addButtonScale }] }}>
            <ThemedText style={commonStyles.buttonText}>
              <Ionicons name="download-outline" size={16} />
            </ThemedText>
          </Animated.View>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}
