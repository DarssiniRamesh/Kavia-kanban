import React from 'react';
import './App.css';
import KanbanBoard from './KanbanBoard';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Define the custom theme
const kaviaTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0052CC", // Jira Blue
      contrastText: "#fff"
    },
    secondary: {
      main: "#EBECF0", // Jira secondary background
      contrastText: "#333"
    },
    background: {
      default: "#F4F5F7",
      paper: "#EBECF0"
    },
    accent: {
      main: "#0052CC"
    },
    info: {
      main: "#0052CC"
    },
    success: {
      main: "#36B37E"
    },
    text: {
      primary: "#172B4D",
      secondary: "#42526E"
    }
  },
  typography: {
    fontFamily: [
      "Inter", "Roboto", "Helvetica", "Arial", "sans-serif"
    ].join(","),
    fontWeightMedium: 500,
    fontWeightBold: 700
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#0052CC",
          color: "#fff"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          textTransform: "none",
          fontWeight: 600,
          backgroundColor: "#0052CC",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#0747A6"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 13
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F4F5F7"
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={kaviaTheme}>
      <CssBaseline />
      <div className="app">
        <nav className="navbar" style={{background: "#fff6e0", color: "#ffb300", borderBottom: "2px solid #ffb300"}}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div className="logo" style={{color: "#ffb300"}}>
                <span className="logo-symbol" style={{color: "#ffb300"}}>*</span> KAVIA KanbanSync
              </div>
              <span style={{color: "#ffb300"}}>AI Board</span>
            </div>
          </div>
        </nav>

        <main>
          <KanbanBoard />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;