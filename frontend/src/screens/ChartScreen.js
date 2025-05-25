import React, { useEffect, useState } from "react";
import { View, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import axios from "axios";
import backend from "../utils/api";
export default function ChartScreen() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    axios.get("/expenses").then((res) => setExpenses(res.data));
  }, []);

  const data = {
    labels: expenses.map((e, i) => `#${i + 1}`),
    datasets: [{ data: expenses.map((e) => e.amount) }],
  };

  return (
    <View>
      <LineChart
        data={data}
        width={Dimensions.get("window").width}
        height={220}
        yAxisLabel="$"
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#f0f0f0",
          backgroundGradientTo: "#f0f0f0",
          decimalPlaces: 2,
          color: () => `#000`,
        }}
        bezier
      />
    </View>
  );
}
