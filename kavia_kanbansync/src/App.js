import React from 'react';
import './App.css';
import KanbanBoard from './KanbanBoard';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Define the custom Kavia theme
const kaviaTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#E87A41", // Kavia Orange
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#FFF3E9", // Light Kavia panel/surface
      contrastText: "#1A1A1A"
    },
    background: {
      default: "#FFF7F0", // App background
      paper: "#FFFFFF"    // Paper/surfaces
    },
    info: {
      main: "#E87A41"
    },
    success: {
      main: "#36B37E"
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#5C5C5C"
    }
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
    fontWeightMedium: 500,
    fontWeightBold: 700
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#FFF3E9",
          color: "#E87A41",
          borderBottom: "2px solid #E87A41",
          boxShadow: "none"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          textTransform: "none",
          fontWeight: 600,
          backgroundColor: "#C9612F",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#E87A41"
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
          backgroundColor: "#FFF7F0"
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
        <nav className="navbar">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div className="logo">
                <span className="logo-symbol">*</span> Kavia Kanban Board
              </div>
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
