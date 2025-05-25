import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import backend from "../utils/api"; // Import your axios instance

import { getToken } from "../utils/auth";

const AddExpenseScreen = ({ navigation, route }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "", // Will be set to the first category ID after fetch
    date: new Date(),
    notes: "",
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [token, setToken] = useState(null);

  // Fetch token and categories on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Fetch token from AsyncStorage
        const storedToken = await getToken();
        if (!storedToken) {
          Alert.alert("Error", "No authentication token found. Please log in.");
          navigation.navigate("Login"); // Adjust to your login screen route
          return;
        }
        setToken(storedToken);

        // Fetch categories
        const response = await backend.get("/categories", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        setCategories(response.data);
        // Set default category to the first one (if available)
        if (response.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            category: response.data[0].id,
          }));
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to load categories";
        Alert.alert("Error", errorMessage);
      } finally {
        setCategoriesLoading(false);
      }
    };

    initialize();
  }, []);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.date;
    setShowDatePicker(Platform.OS === "ios");
    handleChange("date", currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.amount) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (isNaN(parseFloat(formData.amount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!formData.category) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    if (!token) {
      Alert.alert("Error", "No authentication token found. Please log in.");
      navigation.navigate("Login"); // Adjust to your login screen route
      return;
    }

    setLoading(true);

    try {
      const response = await backend.post(
        "/expenses",
        {
          title: formData.title,
          amount: parseFloat(formData.amount),
          date: formData.date.toISOString(),
          categoryId: formData.category,
          notes: formData.notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", "Expense added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Something went wrong";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="close" size={24} color="#4a6bff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Form */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title*</Text>
            <TextInput
              style={styles.input}
              placeholder="What was this expense for?"
              value={formData.title}
              onChangeText={(text) => handleChange("title", text)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount*</Text>
            <View style={styles.amountContainer}>
              <View style={styles.currencyContainer}>
                <Text style={styles.currencySymbol}>Nrs.</Text>
              </View>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0.00"
                value={formData.amount}
                onChangeText={(text) => handleChange("amount", text)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            {categoriesLoading ? (
              <ActivityIndicator size="small" color="#4a6bff" />
            ) : categories.length === 0 ? (
              <Text style={styles.errorText}>No categories available</Text>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(itemValue) =>
                    handleChange("category", itemValue)
                  }
                  style={styles.picker}
                  dropdownIconColor="#4a6bff"
                >
                  {categories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.dateInput} onPress={showDatepicker}>
              <MaterialIcons name="event" size={20} color="#4a6bff" />
              <Text style={styles.dateText}>
                {formData.date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={formData.date}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Additional details (optional)"
              value={formData.notes}
              onChangeText={(text) => handleChange("notes", text)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="attach-money" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  formGroup: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  currencyContainer: {
    backgroundColor: "#f0f5ff",
    paddingHorizontal: 15,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 10,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4a6bff",
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#4a6bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#a3bffa",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
  },
});

export default AddExpenseScreen;
