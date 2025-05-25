import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import backend from "../utils/api";
import { storeToken } from "../utils/auth";
const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert("Error", "Please fill all fields");
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Password length validation
    if (formData.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await backend.post("/auth/register", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check for token in response
      const { token } = response.data;
      if (token) {
        // Store token if provided
        await storeToken(token);
        console.log("Token stored after signup:", token); // Debug log
        Alert.alert("Success", "Account created successfully!", [
          { text: "OK", onPress: () => navigation.navigate("Home") },
        ]);
      } else {
        // Navigate to Login if no token is provided
        Alert.alert("Success", "Account created successfully! Please log in.", [
          { text: "OK", onPress: () => navigation.navigate("Login") },
        ]);
      }
    } catch (err) {
      console.error("Signup error:", err); // Debug log
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join our App</Text>

        <View style={styles.inputContainer}>
          <MaterialIcons
            name="person"
            size={20}
            color="#888"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons
            name="email"
            size={20}
            color="#888"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons
            name="lock"
            size={20}
            color="#888"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
            secureTextEntry={secureText}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <MaterialIcons
              name={secureText ? "visibility" : "visibility-off"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLinkText}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4a6bff",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#4a6bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 30,
    alignItems: "center",
  },
  loginText: {
    color: "#666",
  },
  loginLinkText: {
    color: "#4a6bff",
    fontWeight: "600",
  },
});

export default SignupScreen;
