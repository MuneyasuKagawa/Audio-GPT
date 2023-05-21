import { Box, Button, Stack, Typography } from "@mui/material";
import { useLayoutEffect, useRef } from "react";
import useRecognition from "./useRecognition";

function App() {
  const {
    resultList,
    recognitionState,
    handleClickButton,
    onClickShutUp,
    getButtonLabel,
  } = useRecognition();

  const stackRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollTargetRef.current == null) return;
    scrollTargetRef.current.scrollIntoView();
  }, [stackRef.current?.clientHeight, resultList]);

  return (
    <Box width={600} mx="auto" mb="auto" mt={10} position="relative">
      <Typography component="h1" fontSize={42}>
        お話ししましょう
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          onClick={handleClickButton}
          variant="contained"
          color={recognitionState === "initial" ? "info" : "error"}
          disabled={
            recognitionState === "generating" || recognitionState === "speaking"
          }
          sx={{
            "&.Mui-disabled": {
              color: "#dfdfdf !important",
              backgroundColor: "#afafafa3 !important",
            },
          }}
        >
          {getButtonLabel()}
        </Button>
        {window.speechSynthesis.speaking && recognitionState === "speaking" && (
          <Button variant="contained" color="warning" onClick={onClickShutUp}>
            黙らせる
          </Button>
        )}
      </Stack>
      <Box
        width={600}
        height={560}
        mt={4}
        bgcolor="white"
        p={2}
        sx={{
          overflowY: "scroll",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#ccc",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#919191",
          },
        }}
      >
        <Stack spacing={2} ref={stackRef}>
          {resultList.map((result, index) => {
            return (
              <Message
                key={index}
                role={result.speaker}
                text={
                  result.text === "error"
                    ? "(APIエラーが発生しました)"
                    : result.text
                }
              />
            );
          })}
          <Box ref={scrollTargetRef}></Box>
        </Stack>
      </Box>
    </Box>
  );
}

type MessageProps = {
  role: "User" | "Assistant";
  text: string;
};

const Message = ({ role, text }: MessageProps) => {
  return (
    <Stack
      direction={role === "Assistant" ? "row" : "row-reverse"}
      alignItems="center"
      spacing={1}
      justifyContent="flex-start"
    >
      <Typography color="#242424">
        {role === "Assistant" ? "AI" : "User"}
      </Typography>
      <Box
        border="1px solid #242424"
        display="inline-block"
        px={2}
        py={1}
        borderRadius={2}
        bgcolor={role === "Assistant" ? "#fff1f1" : "#e1ffe1"}
      >
        <Typography color="#242424">{text}</Typography>
      </Box>
    </Stack>
  );
};

export default App;
