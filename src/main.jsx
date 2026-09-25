import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "./redesign.css";
import "./customer-print.css";

function Root() {
  // Remounting App on reset clears whatever deal state triggered the crash.
  const [appKey, setAppKey] = useState(0);
  return (
    <ErrorBoundary onReset={() => setAppKey((current) => current + 1)}>
      <App key={appKey} />
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
