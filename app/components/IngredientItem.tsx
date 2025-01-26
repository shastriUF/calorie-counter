import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

type IngredientItemProps = {
  name: string;
  caloriesPerGram: number | null;
  caloriesPerMl: number | null;
  caloriesPerCount: number | null;
  onDelete: () => void;
};

export default function IngredientItem({ name, caloriesPerGram, caloriesPerMl, caloriesPerCount, onDelete }: IngredientItemProps) {
  return (
    <ThemedView style={styles.listItem}>
      <ThemedText>{name}</ThemedText>
      {caloriesPerGram !== null && <ThemedText>Per Gram: {caloriesPerGram.toFixed(2)} cal</ThemedText>}
      {caloriesPerMl !== null && <ThemedText>Per Ml: {caloriesPerMl.toFixed(2)} cal</ThemedText>}
      {caloriesPerCount !== null && <ThemedText>Per Count: {caloriesPerCount.toFixed(2)} cal</ThemedText>}
      <TouchableOpacity onPress={onDelete}>
        <ThemedText style={styles.deleteText}>
          <Ionicons name="trash" /> Delete
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    marginBottom: 10,
  },
  deleteText: {
    color: 'red',
    marginLeft: 10,
  },
});
