import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import backend from "../utils/api"; // Axios instance
import { getToken } from "../utils/auth"; // Token utility

const AllExpensesScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = async () => {
    try {
      // Fetch token
      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "Please log in to continue", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
        return;
      }

      // Fetch categories
      const categoriesResponse = await backend.get("/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setCategories(categoriesResponse.data);

      // Fetch expenses
      const expensesResponse = await backend.get("/expenses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setExpenses(expensesResponse.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      const errorMessage =
        err.response?.status === 401
          ? "Session expired. Please log in again."
          : err.response?.data?.message ||
            err.message ||
            "Failed to load expenses";
      setError(errorMessage);
      if (err.response?.status === 401) {
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const renderExpenseItem = ({ item }) => {
    const category = categories.find((cat) => cat.id === item.categoryId);
    return (
      <TouchableOpacity style={styles.expenseCard}>
        <View style={styles.expenseIcon}>
          <MaterialIcons
            name={category?.icon || "receipt"}
            size={24}
            color="#4A6BFF"
          />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <Text style={styles.expenseCategory}>
            {category?.name || "Uncategorized"}
          </Text>
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>Nrs.{item.amount.toFixed(2)}</Text>
          <Text style={styles.expenseDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A6BFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpenses}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4A6BFF"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="money-off" size={48} color="#A5B4FC" />
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseIcon: {
    backgroundColor: "#F0F4FF",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: "#64748B",
  },
  expenseAmountContainer: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#1E293B",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#4A6BFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
});

export default AllExpensesScreen;
