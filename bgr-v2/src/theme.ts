import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          flexDirection: 'row-reverse',
          '& .MuiAccordionSummary-expandIconWrapper': {
            marginLeft: '8px',
          },
          '& .MuiAccordionSummary-content': {
            marginLeft: '8px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // ボタンのテキストを大文字にしない
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // トグルボタンのテキストを大文字にしない
        },
      },
    },
  },
})

export default theme
