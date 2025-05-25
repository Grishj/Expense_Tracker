import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { MaterialIcons, AntDesign, Feather } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import backend from "../utils/api"; // Axios instance
import { getToken } from "../utils/auth"; // Token utility

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    categories: [],
  });
  const [categories, setCategories] = useState([]);
  const [token, setToken] = useState(null);

  // Fetch data (expenses and categories)
  const fetchData = async () => {
    try {
      // Get token from AsyncStorage
      const storedToken = await getToken();
      if (!storedToken) {
        Alert.alert("Error", "Please log in to continue", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
        return;
      }
      setToken(storedToken);

      // Fetch categories
      const categoriesResponse = await backend.get("/categories", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      setCategories(categoriesResponse.data);

      // Fetch expenses
      const expensesResponse = await backend.get("/expenses", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      const fetchedExpenses = expensesResponse.data;

      // Process expenses for stats
      const total = fetchedExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const categoryMap = {};
      fetchedExpenses.forEach((expense) => {
        const category = categoriesResponse.data.find(
          (cat) => cat.id === expense.categoryId
        );
        if (category) {
          if (!categoryMap[category.id]) {
            categoryMap[category.id] = {
              name: category.name,
              amount: 0,
              color: category.color || "#666",
              legendFontColor: "#7F7F7F",
            };
          }
          categoryMap[category.id].amount += expense.amount;
        }
      });
      const categoryStats = Object.values(categoryMap);

      setExpenses(fetchedExpenses);
      setStats({
        total,
        categories: categoryStats,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to load data";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate weekly spending for LineChart
  const getWeeklyData = () => {
    const weeks = [0, 0, 0, 0]; // Week 1 to Week 4
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= startOfMonth && expenseDate <= today) {
        const dayOfMonth = expenseDate.getDate();
        const weekIndex = Math.floor((dayOfMonth - 1) / 7);
        if (weekIndex < 4) {
          weeks[weekIndex] += expense.amount;
        }
      }
    });
    return weeks;
  };

  const renderExpenseItem = (item) => {
    const category = categories.find((cat) => cat.id === item.categoryId);
    return (
      <TouchableOpacity key={item.id} style={styles.expenseItem}>
        <View style={styles.expenseIcon}>
          <MaterialIcons
            name={category?.icon || "money"}
            size={24}
            color="#4a6bff"
          />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <Text style={styles.expenseCategory}>
            {category?.name || "Unknown"}
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
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4a6bff"
            />
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Expense Tracker</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Feather name="user" size={24} color="#4a6bff" />
            </TouchableOpacity>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Expenses</Text>
            <Text style={styles.summaryAmount}>
              Nrs.{stats.total.toFixed(2)}
            </Text>
            <Text style={styles.summaryPeriod}>This Month</Text>
          </View>

          {/* Charts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Overview</Text>

            {/* Line Chart */}
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                  datasets: [
                    {
                      data: getWeeklyData(),
                      color: (opacity = 1) => `rgba(74, 107, 255, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={Dimensions.get("window").width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#4a6bff",
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>

            {/* Pie Chart */}
            <View style={styles.chartContainer}>
              <PieChart
                data={stats.categories}
                width={Dimensions.get("window").width - 40}
                height={180}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("AllExpenses")}
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {expenses.length > 0 ? (
              expenses.map(renderExpenseItem)
            ) : (
              <View style={styles.emptyState}>
                <AntDesign name="folderopen" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No expenses recorded</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Add Expense Button */}
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => navigation.navigate("AddExpense")}
          activeOpacity={0.8}
        >
          <AntDesign name="plus" size={24} color="#fff" />
        </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 100, // Add padding to ensure content isn't hidden behind floating button
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
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  summaryPeriod: {
    fontSize: 14,
    color: "#888",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  seeAll: {
    fontSize: 14,
    color: "#4a6bff",
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  chart: {
    borderRadius: 16,
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  expenseIcon: {
    backgroundColor: "#f0f5ff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  expenseCategory: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  expenseAmountContainer: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  expenseDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginTop: 16,
  },
  floatingAddButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4a6bff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4a6bff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    // Additional floating effect
    transform: [{ scale: 1 }],
  },
});

export default HomeScreen;
