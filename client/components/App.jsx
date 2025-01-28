import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import { getFunctionSchemas, getFunctionHandler } from "../functions";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  async function startSession() {
    try {
      // Get ephemeral key
      const tokenResponse = await fetch("/token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      
      // Audio handling
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

      // Add microphone track
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(micStream.getTracks()[0]);

      // Create data channel
      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      // SDP negotiation
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      const answer = { type: "answer", sdp: await sdpResponse.text() };
      await pc.setRemoteDescription(answer);

      peerConnection.current = pc;
    } catch (error) {
      console.error("Session start failed:", error);
      stopSession();
    }
  }

  function stopSession() {
    if (dataChannel) dataChannel.close();
    if (peerConnection.current) peerConnection.current.close();
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  useEffect(() => {
    if (dataChannel) {
      const messageHandler = async (e) => {
        const event = JSON.parse(e.data);
        // Handle transcripts
        if (event.type === "response.audio_transcript.done") {
          setTranscript(event.transcript);
        }

        // Handle completed responses
        if (event.type === "response.done") {
          const outputs = event.response?.output || [];
          
          for (const output of outputs) {
            if (output.type === "function_call") {
              console.log("function_call output", output);
              const handler = getFunctionHandler(output.name);
              if (handler) {
                try {
                  const result = await handler(JSON.parse(output.arguments));
                  
                  // Send result back
                  dataChannel.send(JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: output.call_id,
                      output: JSON.stringify(result)
                    }
                  }));

                  // Explicitly request follow-up
                  dataChannel.send(JSON.stringify({ 
                    type: "response.create" 
                  }));

                } catch (error) {
                  console.error("Function error:", error);
                }
              }
            }
          }
        }
      };

      dataChannel.addEventListener("message", messageHandler);

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        
        // Native-style session config
        dataChannel.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            tools: getFunctionSchemas(),
            tool_choice: "auto",
            instructions: `
                ## Base instructions
                You are an AI voice assistant named Voicebot, specifically designed to help users set up their accounts for aesthetic clinics in Aesthetic Record EMR.
                You can also help with basic weather information when asked.
                Your primary goal is to efficiently collect all required information for a complete EMR setup.
                You have access to all features of the Aesthetic Record app through these resources:

                ## Function Parameter Collection
                When collecting information for any function:
                - Ask for ONE parameter at a time
                - Wait for the user's response before asking for the next parameter
                - If a user provides multiple parameters at once, acknowledge them but still confirm each one individually
                - After collecting all parameters, summarize before executing the function

                ## Available Resources
                1. Getting Started & Launch Guide
                2. Account Settings (24 articles)
                3. Clinical Documentation & Forms Management (8 articles)
                4. Patient Management (22 articles)
                5. Scheduling, Online Booking & eCommerce (44 articles)
                6. Patient Encounters & Charting Procedures (27 articles)
                7. Inventory and Product Management (13 articles)
                8. Integrated Payment Processing (42 articles)
                9. Business Insights/Reporting (6 articles)
                10. AR Integrations Hub (29 articles)
                11. AR Marketplace (20 articles)
                12. Aesthetic Next (1 article)

                Base URL for all resources: https://learn.aestheticrecord.com/en/

                Respond in a friendly, human, and conversational manner.
                Keep responses concise, ideally 1-2 sentences and no more than 120 characters.
                Ask one follow-up question at a time.
                If a question is unclear, ask for clarification before answering.
                Do not use abbreviations for units.
                Separate list items with commas.
                Keep responses unique and avoid repetition.
                If asked how you are, provide a brief, positive response.

                When handling user queries:
                1. Focus on guiding users through the EMR setup process for aesthetic clinics.
                2. Reference the Aesthetic Record features to provide accurate information.
                3. If a user's question is not related to account setup or Aesthetic Record EMR, politely redirect them to the relevant topic.
                4. If you don't have the information to answer a specific question, offer to connect the user with human support at Info@AestheticRecord.com.

                Remember that Deepgram gave you a mouth and ears so you can take voice as an input. You can listen and speak.
                Your name is Voicebot.
                `,
          }
        }));
      });

      return () => {
        dataChannel.removeEventListener("message", messageHandler);
      };
    }
  }, [dataChannel]);

  return (
    <div className="app-container">
      <div className="controls">
        {!isSessionActive ? (
          <button onClick={startSession} disabled={isSessionActive}>
            Connect
          </button>
        ) : (
          <button onClick={stopSession} disabled={!isSessionActive}>
            Disconnect
          </button>
        )}
      </div>

      <div className="transcript-box">
        {transcript || "Waiting for input..."}
      </div>
    </div>
  );
}
