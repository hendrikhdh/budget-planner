import React from "react";
import ReactDOM from "react-dom/client";
import BudgetPlanner from "./App.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BudgetPlanner />
    </ErrorBoundary>
  </React.StrictMode>
);
