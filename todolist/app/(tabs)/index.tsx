import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fontisto, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../../colors';

interface ToDo {
  text: string;
  working: boolean;
  isComplete?: boolean;
}

type ToDos = Record<string, ToDo>;

const STORAGE_KEY = '@toDos';
const STORAGE_MODE_KEY = '@mode';

export default function App() {
  const [working, setWorking] = useState<boolean>(true);
  const [text, setText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [toDos, setToDos] = useState<ToDos>({});
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadToDos();
        await getMode();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    initialize();
  }, []);

  const changeMode = async (mode: boolean) => {
    if (working !== mode) {
      setWorking(mode);
      await saveMode(mode);
    }
  };

  const saveMode = async (currentMode: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_MODE_KEY, JSON.stringify(currentMode));
    } catch (error) {
      console.error('Failed to save mode:', error);
    }
  };

  const getMode = async () => {
    try {
      const prevMode = await AsyncStorage.getItem(STORAGE_MODE_KEY);
      if (prevMode !== null) {
        setWorking(JSON.parse(prevMode));
      }
    } catch (error) {
      console.error('Failed to get mode:', error);
    }
  };

  const onChangeText = (payload: string) => setText(payload);

  const addToDo = async () => {
    if (text === '') {
      return;
    }
    const newToDos = { ...toDos, [Date.now()]: { text, working } };
    await saveToDos(newToDos);
    setToDos(newToDos);
    setText('');
  };

  const saveToDos = async (toSave: ToDos) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save to-dos:', error);
    }
  };

  const loadToDos = async () => {
    try {
      const savedToDos = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedToDos) {
        setToDos(JSON.parse(savedToDos));
      }
    } catch (error) {
      console.error('Failed to load to-dos:', error);
    }
  };

  const deleteToDos = (key: string) => {
    if(Platform.OS === "web"){
      const ok = confirm("Do you want to delete this To Do?")
      if(ok){
        const newToDos = { ...toDos};
        delete newToDos[key];
        setToDos(newToDos);
        saveToDos(newToDos);
      }
    }
    else {
      Alert.alert('Delete To-Do', 'Are you sure?', [
        { text: 'Cancel' },
        {
          text: "I'm Sure",
          style: 'destructive',
          onPress: async () => {
            const newToDos = { ...toDos };
            delete newToDos[key];
            await saveToDos(newToDos);
            setToDos(newToDos);
          },
        },
      ]);
    }
  };

  const toggleCompleteToDo = (key: string) => {
    const newToDos = { ...toDos };
    newToDos[key].isComplete = !newToDos[key].isComplete;
    setToDos(newToDos);
    saveToDos(newToDos);
  };

  const editToDo = (key: string) => {
    setIsEditing(key);
    setEditText(toDos[key].text);
  };

  const saveEditToDo = (key: string) => {
    const newToDos = { ...toDos };
    newToDos[key].text = editText;
    setToDos(newToDos);
    saveToDos(newToDos);
    setIsEditing(null);
    setEditText('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content"/>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMode(true)}>
          <Text style={{ ...styles.btnText, color: working ? 'white' : theme.grey }}>
            Work
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeMode(false)}>
          <Text style={{ ...styles.btnText, color: working ? theme.grey : 'white' }}>
            Travel
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        ref={inputRef}
        onChangeText={onChangeText}
        onSubmitEditing={addToDo}
        returnKeyType="done"
        value={text}
        style={styles.input}
        placeholder={working ? 'Add a To Do' : 'Where do you want to go?'}
      />
      <ScrollView>
        {Object.keys(toDos).map((key) =>
          toDos[key].working === working ? (
            <View style={styles.toDo} key={key}>
              <TouchableOpacity style={styles.toDoChk} onPress={() => toggleCompleteToDo(key)}>
                <Fontisto
                  name={toDos[key].isComplete ? 'checkbox-active' : 'checkbox-passive'}
                  size={18}
                  color="white"
                />
              </TouchableOpacity>
              {isEditing === key ? (
                <TextInput
                  ref={inputRef}
                  style={[styles.toDoText, styles.inputEditing]}
                  value={editText}
                  onChangeText={setEditText}
                  onSubmitEditing={() => saveEditToDo(key)}
                  onBlur={() => saveEditToDo(key)}
                />
              ) : (
                <Text
                  style={[
                    styles.toDoText,
                    toDos[key].isComplete && { textDecorationLine: 'line-through' },
                  ]}
                >
                  {toDos[key].text}
                </Text>
              )}
              <View style={styles.updateToto}>
                <TouchableOpacity style={{ marginRight: 15 }} onPress={() => editToDo(key)}>
                  <FontAwesome5 name="pencil-alt" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteToDos(key)}>
                  <Fontisto name="trash" size={18} color={theme.grey} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20 },
  header: { marginTop: 100, justifyContent: 'space-between', flexDirection: 'row' },
  btnText: { fontSize: 38, fontWeight: '600' },
  input: { backgroundColor: 'white', paddingVertical: 15, paddingHorizontal: 20, marginVertical: 20, borderRadius: 20, fontSize: 18 },
  toDo: { backgroundColor: theme.toDoBg, marginBottom: 10, paddingVertical: 20, paddingHorizontal: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  toDoText: { color: 'white', fontSize: 16, fontWeight: '500', flex: 4, padding: 2 },
  updateToto: { flexDirection: 'row', flex: 1 },
  toDoChk: { flex: 1 },
  inputEditing: { borderWidth: 1, borderColor: 'white', borderRadius: 4, padding: 5 },
});
