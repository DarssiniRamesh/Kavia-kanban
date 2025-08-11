import React from 'react';
import './App.css';
import KanbanBoard from './KanbanBoard';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Define the custom theme
const kaviaTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#ffb300",
      contrastText: "#212121"
    },
    secondary: {
      main: "#fff6e0",
      contrastText: "#333"
    },
    background: {
      default: "#fffdf7",
      paper: "#fff6e0"
    },
    accent: {
      main: "#ffb300"
    },
    info: {
      main: "#1976d2"
    },
    success: {
      main: "#388e3c"
    },
    text: {
      primary: "#212121",
      secondary: "#333"
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
          backgroundColor: "#fff6e0",
          color: "#ffb300"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          textTransform: "none",
          fontWeight: 600
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
          backgroundColor: "#fffdf7"
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