import { ToggleButton } from "@mui/material";
import { styled } from "@mui/material/styles";

export const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
  borderRadius: "20px !important",
  border: `1px solid ${theme.palette.grey[300]} !important`,
  backgroundColor: "transparent",
  color: theme.palette.text.primary,
  textTransform: "none",
  "&.Mui-selected": {
    backgroundColor: theme.palette.primary.main + "!important",
    color: theme.palette.primary.contrastText + "!important",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark + "!important",
    },
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
