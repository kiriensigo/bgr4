import { Slider } from "@mui/material";
import { styled } from "@mui/material/styles";

export const CustomSlider = styled(Slider)(({ theme }) => ({
  "& .MuiSlider-rail": {
    height: 4,
    backgroundColor: theme.palette.grey[300],
  },
  "& .MuiSlider-track": {
    height: 4,
    backgroundColor: theme.palette.primary.main,
  },
  "& .MuiSlider-thumb": {
    width: 12,
    height: 12,
    backgroundColor: theme.palette.primary.main,
    "&:hover, &.Mui-focusVisible": {
      boxShadow: "none",
    },
  },
  "& .MuiSlider-mark": {
    backgroundColor: theme.palette.grey[500],
    width: 2,
    height: 8,
    marginTop: -2,
  },
  "& .MuiSlider-markLabel": {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
}));
