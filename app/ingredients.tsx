import { useState, useRef, useEffect } from 'react';
import { TextInput, ScrollView, Animated, Pressable, useColorScheme, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import IngredientItem from './components/IngredientItem';
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

const unitConversions: { [key: string]: { grams?: number; ml?: number; count?: number } } = {
  grams: { grams: 1 },
  oz: { grams: 28.3495 },
  teaspoons: { ml: 5 },
  tablespoons: { ml: 15 },
  cups: { ml: 240 },
  ml: { ml: 1 },
  count: { count: 1 },
};

export default function IngredientsScreen() {
  const [ingredient, setIngredient] = useState('');
  const [calories, setCalories] = useState('');
  const [unit, setUnit] = useState('grams');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
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

  const saveIngredients = async (newIngredients: Ingredient[]) => {
    try {
      await AsyncStorage.setItem('ingredients', JSON.stringify(newIngredients));
    } catch (error) {
      console.error('Failed to save ingredients', error);
    }
  };

  const addIngredient = () => {
    const existingIngredientIndex = ingredients.findIndex(item => item.name.toLowerCase() === ingredient.toLowerCase());
    let newIngredients;
    const caloriesPerUnit = parseFloat(calories);
    const { caloriesPerGram, caloriesPerMl, caloriesPerCount } = convertCalories(caloriesPerUnit, unit);

    if (existingIngredientIndex !== -1) {
      newIngredients = [...ingredients];
      const savedCaloriesPerGram = newIngredients[existingIngredientIndex].caloriesPerGram;
      const savedCaloriesPerMl = newIngredients[existingIngredientIndex].caloriesPerMl;
      const savedCaloriesPerCount = newIngredients[existingIngredientIndex].caloriesPerCount;
      
      const enteredCaloriesPerGram = caloriesPerGram != null ? caloriesPerGram : savedCaloriesPerGram;
      const enteredCaloriesPerMl = caloriesPerMl != null ? caloriesPerMl : savedCaloriesPerMl;
      const enteredCaloriesPerCount = caloriesPerCount != null ? caloriesPerCount : savedCaloriesPerCount;
      
      newIngredients[existingIngredientIndex] = { name: ingredient, caloriesPerGram: enteredCaloriesPerGram, caloriesPerMl: enteredCaloriesPerMl, caloriesPerCount: enteredCaloriesPerCount };
    } else {
      newIngredients = [...ingredients, { name: ingredient, caloriesPerGram, caloriesPerMl, caloriesPerCount }];
    }
    setIngredients(newIngredients);
    setFilteredIngredients(newIngredients);
    saveIngredients(newIngredients);
    setIngredient('');
    setCalories('');
    setUnit('grams');
  };

  const convertCalories = (calories: number, unit: string) => {
    const conversions = unitConversions[unit];
    return {
      caloriesPerGram: conversions.grams ? calories / conversions.grams : null,
      caloriesPerMl: conversions.ml ? calories / conversions.ml : null,
      caloriesPerCount: conversions.count ? calories / conversions.count : null,
    };
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

  const isCaloriesValid = !isNaN(parseFloat(calories)) && isFinite(parseFloat(calories)) && parseFloat(calories) > 0;

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


  const EXPORT_VERSION = 1.0;

  const exportData = async () => {
    try {
      const storedIngredients = await AsyncStorage.getItem('ingredients');
      if (storedIngredients) {
        const fileUri = FileSystem.documentDirectory + 'ingredients.json';
        
        const parsedIngredients = JSON.parse(storedIngredients);
        const data = {
          version: EXPORT_VERSION,
          ingredients: parsedIngredients,
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
      
      const ingredients = parsedData.ingredients;
      setIngredients(ingredients);
      setFilteredIngredients(ingredients);
      saveIngredients(ingredients);
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
          onPress={addIngredient}
          disabled={!ingredient || !calories || !isCaloriesValid}
        >
          <Animated.View style={{ transform: [{ scale: addButtonScale }], marginBottom: 20 }}>
            <ThemedText style={commonStyles.buttonText}>
              <Ionicons name="add-circle-outline" size={16} /> Add
            </ThemedText>
          </Animated.View>
        </Pressable>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ flexGrow: 1 }}>
          {filteredIngredients.map((item, index) => (
            <IngredientItem
              key={index}
              name={item.name}
              caloriesPerGram={item.caloriesPerGram}
              caloriesPerMl={item.caloriesPerMl}
              caloriesPerCount={item.caloriesPerCount}
              onDelete={() => deleteIngredient(index)}
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
