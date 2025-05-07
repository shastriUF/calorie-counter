import { useState, useEffect, useRef } from 'react';
import { TextInput, ScrollView, Animated, Pressable, useColorScheme, View, Alert, StyleSheet } from 'react-native';
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
  meal: string;
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

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function CaloriesScreen() {
  const [ingredient, setIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('grams');
  const [activeMeal, setActiveMeal] = useState('Snack');
  const [selectedMealFilter, setSelectedMealFilter] = useState<string | null>(null);
  const [totalCalories, setTotalCalories] = useState(0);
  const [consumedItems, setConsumedItems] = useState<ConsumedItem[]>([]);
  const [ingredientsData, setIngredientsData] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const exportButtonScale = useRef(new Animated.Value(1)).current;
  const importButtonScale = useRef(new Animated.Value(1)).current;
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
    // AsyncStorage.clear(); //Uncomment this line in dev to clear all data
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
      const newConsumedItems = [...consumedItems, { name: ingredient, quantity: quantity_num, unit, calories, meal: activeMeal }];
      setTotalCalories(newTotalCalories);
      setConsumedItems(newConsumedItems);
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

  const EXPORT_VERSION = 1.1;

  const exportData = async () => {
    try {
      const storedItems = await AsyncStorage.getItem(`consumedItems_${selectedDate.toLocaleDateString()}`);
      if (storedItems) {
        const date = selectedDate.toLocaleDateString().replace(/\//g, '-');
        const fileUri = FileSystem.documentDirectory + `calories_${date}.json`;
        
        const parsedStoredItems = JSON.parse(storedItems);
        const data = {
          version: EXPORT_VERSION,
          date: selectedDate.toLocaleDateString(),
          consumedItems: parsedStoredItems,
        };
        
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data), { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('No data to export', 'There is no calorie data for the selected date.');
      }
    } catch (error) {
      console.error('Failed to export data', error);
      Alert.alert('Export Failed', 'Could not export calorie data.');
    }
  };

  const exportMeal = async (mealType: string) => {
    try {
      const mealItems = consumedItems.filter(item => item.meal === mealType);
      if (mealItems.length === 0) {
        Alert.alert('No data to export', `There are no ${mealType} items for the selected date.`);
        return;
      }

      const date = selectedDate.toLocaleDateString().replace(/\//g, '-');
      const fileUri = FileSystem.documentDirectory + `calories_${date}_${mealType.toLowerCase()}.json`;
      
      const data = {
        version: EXPORT_VERSION,
        date: selectedDate.toLocaleDateString(),
        meal: mealType,
        consumedItems: mealItems,
      };
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data), { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Failed to export meal data', error);
      Alert.alert('Export Failed', 'Could not export meal data.');
    }
  };

  const importData = async (fileUri: string) => {
    try {
      const importedData = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsedData = JSON.parse(importedData);
      
      // Check version compatibility
      const version = parsedData.version;
      if (!version || version !== EXPORT_VERSION) {
        throw new Error(`Incompatible data version. Current version is ${EXPORT_VERSION}, imported version is ${version || 'unknown'}`);
      }
      
      // Import data
      if (parsedData.consumedItems) {
        // Handle date from the file vs. selected date
        const importDate = parsedData.date;
        
        // See if it's a full day or just a meal
        const isMealImport = parsedData.meal !== undefined;
        
        if (isMealImport) {
          // If it's a meal import, we need to merge with existing data
          const storedItems = await AsyncStorage.getItem(`consumedItems_${importDate}`);
          let existingItems: ConsumedItem[] = [];
          
          if (storedItems) {
            existingItems = JSON.parse(storedItems);
            // Remove any items of the same meal type to avoid duplicates
            if (parsedData.meal) {
              existingItems = existingItems.filter(item => 
                !item.meal || item.meal !== parsedData.meal);
            }
          }
          
          // Merge existing items with imported meal items
          const mergedItems = [...existingItems, ...parsedData.consumedItems];
          await AsyncStorage.setItem(`consumedItems_${importDate}`, JSON.stringify(mergedItems));
          
          if (importDate === selectedDate.toLocaleDateString()) {
            setConsumedItems(mergedItems);
            await refreshCalories();
          }
          
          Alert.alert(
            'Import Successful', 
            `Imported ${parsedData.meal} data for ${importDate}${importDate !== selectedDate.toLocaleDateString() ? 
              ' (Select this date to view the imported data)' : 
              ''}`
          );
        } else {
          // Handle full day import (old logic)
          await AsyncStorage.setItem(`consumedItems_${importDate}`, JSON.stringify(parsedData.consumedItems));
          
          if (importDate === selectedDate.toLocaleDateString()) {
            setConsumedItems(parsedData.consumedItems);
            await refreshCalories();
          }
          
          Alert.alert(
            'Import Successful', 
            `Imported calorie data for ${importDate}${importDate !== selectedDate.toLocaleDateString() ? 
              ' (Select this date to view the imported data)' : 
              ''}`
          );
        }
      } else {
        throw new Error('No consumed items found in the imported file.');
      }
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

  const handleMealSelection = (mealType: string) => {
    // For filtering: toggle filter on/off without changing active meal
    if (selectedMealFilter === mealType) {
      setSelectedMealFilter(null);
    } else {
      setSelectedMealFilter(mealType);
    }
    
    // Always set as active meal when clicked
    setActiveMeal(mealType);
  };

  const filteredConsumedItems = selectedMealFilter 
    ? consumedItems.filter(item => item.meal === selectedMealFilter)
    : consumedItems;

  const caloriesByMeal = mealTypes.reduce((meals, mealType) => {
    const mealItems = consumedItems.filter(item => item.meal === mealType);
    const totalCaloriesForMeal = mealItems.reduce((sum, item) => sum + item.calories, 0);
    return { ...meals, [mealType]: totalCaloriesForMeal };
  }, {} as Record<string, number>);

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
        <View style={styles.mealBreakdown}>
          {mealTypes.map(mealType => {
            // Determine styling based on whether it's selected for filtering or active for adding
            const isFilterActive = selectedMealFilter === mealType;
            const isActiveForAdding = activeMeal === mealType;
            
            return (
              <Pressable 
                key={mealType} 
                style={[
                  styles.mealPill,
                  isFilterActive ? styles.filterActivePill : null,
                  isActiveForAdding ? styles.addingActivePill : null
                ]}
                onPress={() => handleMealSelection(mealType)}
              >
                <ThemedText style={[
                  styles.mealPillText,
                  isFilterActive ? styles.filterActiveText : null,
                  isActiveForAdding && !isFilterActive ? styles.addingActiveText : null
                ]}>
                  {mealType}: {caloriesByMeal[mealType] || 0}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
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
          {filteredConsumedItems.map((item, index) => (
            <ConsumedItemEntry
              key={index}
              name={item.name}
              quantity={item.quantity}
              unit={item.unit}
              calories={item.calories}
              meal={item.meal}
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
          onPress={() => {
            Alert.alert(
              'Export Meal',
              'Select a meal to export:',
              [
                ...mealTypes.map(mealType => ({
                  text: mealType,
                  onPress: () => exportMeal(mealType)
                })),
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <ThemedText style={commonStyles.buttonText}>
            <Ionicons name="fast-food-outline" size={16} />
          </ThemedText>
        </Pressable>
        <Pressable
          onPressIn={() => handlePressIn(exportButtonScale)}
          onPressOut={() => handlePressOut(exportButtonScale)}
          onPress={exportData}
        >
          <Animated.View style={{ transform: [{ scale: exportButtonScale }] }}>
            <ThemedText style={commonStyles.buttonText}>
              <Ionicons name="cloud-upload-outline" size={16} />
            </ThemedText>
          </Animated.View>
        </Pressable>
        <Pressable
          onPressIn={() => handlePressIn(importButtonScale)}
          onPressOut={() => handlePressOut(importButtonScale)}
          onPress={handleImportPress}
        >
          <Animated.View style={{ transform: [{ scale: importButtonScale }] }}>
            <ThemedText style={commonStyles.buttonText}>
              <Ionicons name="download-outline" size={16} />
            </ThemedText>
          </Animated.View>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mealBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  mealPill: {
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterActivePill: {
    backgroundColor: '#0a7ea4',
  },
  addingActivePill: {
    borderColor: '#0a7ea4',
    borderWidth: 1,
  },
  mealPillText: {
    fontSize: 12,
  },
  filterActiveText: {
    color: 'white',
  },
  addingActiveText: {
    color: '#0a7ea4',
  },
});
