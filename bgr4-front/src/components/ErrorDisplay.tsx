import { Alert, AlertTitle, Box, Button } from "@mui/material";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <Box sx={{ my: 2 }}>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              再試行
            </Button>
          )
        }
      >
        <AlertTitle>エラーが発生しました</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
}
