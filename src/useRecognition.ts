import { useState, useMemo, useEffect, useCallback } from "react";
import { chat } from "./client";

type RecognitionState = "initial" | "recording" | "generating" | "speaking";
export type Result = {
  speaker: "Assistant" | "User";
  text: string;
};

const useRecognition = () => {
  const [resultList, setResultList] = useState<Result[]>([]);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );

  const [recognitionState, setRecognitionState] =
    useState<RecognitionState>("initial");

  const [_, setNoSpeakTime] = useState(0);

  // 発話API
  const uttr = useMemo(() => new SpeechSynthesisUtterance(), []);

  // 認識結果のイベントハンドラ
  const onResult = useCallback(
    async (event: SpeechRecognitionEvent) => {
      if (recognition == null) return;

      const results: SpeechRecognitionResultList = event.results;
      const transcript: string = results[0][0].transcript.trim();
      if (results[0].isFinal && transcript) {
        setResultList((prev: Result[]) => [
          ...prev,
          { speaker: "User", text: transcript },
        ]);

        recognition.abort();
        setRecognitionState("generating");

        // AIの発言を取得、追加
        const response = await (async () => {
          try {
            return await chat(transcript, [
              ...resultList,
              { speaker: "User", text: transcript },
            ]);
          } catch (error) {
            return "error";
          }
        })();
        setResultList((prev: Result[]) => [
          ...prev,
          { speaker: "Assistant", text: response ?? "" },
        ]);

        if (response === "error") {
          setRecognitionState("recording");
          return;
        }

        setRecognitionState("speaking");

        if (response != null) {
          uttr.text = response;

          if (response.match(/^[A-Za-z\s\\.,!?']+$/)) {
            uttr.lang = "en-US";
            uttr.rate = 1;
          } else {
            uttr.lang = "ja-JP";
            uttr.rate = 2;
          }

          // 発言を再生
          window.speechSynthesis.speak(uttr);

          uttr.addEventListener("end", (e) => {
            tryRestartRecognition(recognition);
            setRecognitionState("recording");
          });
        }
      }
    },
    [recognition, resultList, uttr]
  );

  const handleClickButton = () => {
    try {
      if (recognitionState === "recording") {
        setRecognitionState("initial");
        if (recognition != null) {
          recognition.abort();
          setRecognition(null);
        }
      } else {
        setRecognition(new webkitSpeechRecognition());
        setRecognitionState("recording");
      }
    } catch (error) {
      /* */
    }
  };

  const onClickShutUp = () => {
    if (recognition == null) return;
    window.speechSynthesis.cancel();
    uttr.text = "あっ";
    window.speechSynthesis.speak(uttr);
    setRecognitionState("recording");
    try {
      recognition.start();
    } catch (error) {
      /* */
    }
  };

  const getButtonLabel = () => {
    switch (recognitionState) {
      case "initial":
        return "開始";
      case "recording":
        return "停止";
      case "generating":
        return "返答を考え中";
      case "speaking":
        return "返答中";
    }
  };

  // 認識の設定
  useEffect(() => {
    if (recognition == null) return;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ja";
    recognition.onresult = onResult;
    recognition.onerror = (e) => {
      if (e.error === "no-speech") {
        // 無音状態で一定時間が経過した、ということなので再度音声認識をスタート
        tryRestartRecognition(recognition);
      }
    };
    tryRestartRecognition(recognition);
  }, [onResult, recognition]);

  // 放置状態のボタン制御
  useEffect(() => {
    const interval = setInterval(() => {
      setNoSpeakTime((prev) => {
        if (prev > 9 && recognitionState === "recording") {
          setRecognitionState("initial");
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [recognitionState]);

  useEffect(() => {
    setNoSpeakTime(0);
  }, [recognitionState]);

  const tryRestartRecognition = (recognition: SpeechRecognition) => {
    try {
      recognition.start();
    } catch (error) {
      /* */
    }
  };

  return {
    resultList,
    recognitionState,
    handleClickButton,
    onClickShutUp,
    getButtonLabel,
  };
};

export default useRecognition;
