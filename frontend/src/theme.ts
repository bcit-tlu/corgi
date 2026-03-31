import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#A74A4A",
            light: "#D58881",
            dark: "#7D6860",
            contrastText: "#ECECEC",
        },
        secondary: {
            main: "#7F665D",
        },
        background: {
            default: "#ECECEC",
        },
        text: {
            primary: "#3E3C3A",
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
});
