import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerText: {
    marginBottom: 20,
    paddingTop: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
    borderRadius: 10,
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
    borderRadius: 10,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    marginBottom: 10,
  },
  deleteText: {
    color: 'red',
    marginLeft: 10,
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
  suggestionsContainer: {
    width: '70%',
    borderWidth: 0.5,
    marginBottom: 20,
    borderRadius: 10,
  },
  suggestionText: {
    padding: 5,
  },
});
