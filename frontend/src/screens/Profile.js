import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import backend from "../utils/api"; // Axios instance
import { getToken, clearToken } from "../utils/auth"; // Token utilities

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        Alert.alert("Error", "Please log in to continue", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
        return;
      }
      setToken(storedToken);

      const response = await backend.get("/api/profile", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to load user data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await clearToken();
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "Failed to log out");
    }
  };

  // Get first letter of the user's name
  const getFirstLetter = (name) => {
    if (!name || typeof name !== "string") return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6bff" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Avatar with First Letter */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getFirstLetter(user?.name)}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email || "No email"}</Text>
        </View>

        {/* Menu Options */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("PersonalData")}
          >
            <Text style={styles.menuText}>Personal Data</Text>
            <AntDesign name="right" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.menuText}>Settings</Text>
            <AntDesign name="right" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuText, { color: "#ff4d4d" }]}>Log Out</Text>
            <AntDesign name="logout" size={20} color="#ff4d4d" />
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  avatarContainer: {
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4a6bff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#888",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
});

export default ProfileScreen;
