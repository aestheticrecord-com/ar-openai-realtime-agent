import { useEffect, useRef, useState } from 'react';
import { getEphemeralKey } from '../services/api';
import { createPeerConnection, setupMediaStream, createDataChannel } from '../services/webrtc';
import { API_INSTRUCTIONS, SESSION_CONFIG } from '../utils/constants';
import { getFunctionSchemas, getFunctionHandler } from '../functions';

export default function useVoiceConnection() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  const startSession = async () => {
    try {
      const EPHEMERAL_KEY = await getEphemeralKey();
      peerConnection.current = createPeerConnection();
      
      audioElement.current = document.createElement('audio');
      audioElement.current.autoplay = true;
      peerConnection.current.ontrack = (e) => {
        audioElement.current.srcObject = e.streams[0];
      };

      const micStream = await setupMediaStream();
      peerConnection.current.addTrack(micStream.getTracks()[0]);

      const dc = createDataChannel(peerConnection.current, 'oai-events');
      setDataChannel(dc);

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            'Content-Type': 'application/sdp',
          },
        }
      );

      const answer = { type: 'answer', sdp: await sdpResponse.text() };
      await peerConnection.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Session start failed:', error);
      stopSession();
    }
  };

  const stopSession = () => {
    if (dataChannel) {
      dataChannel.close();
      setDataChannel(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setIsSessionActive(false);
  };

  useEffect(() => {
    if (!dataChannel) return;

    const handleDataMessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("[HANDLE DATA MESSAGE]", message);
      
      if (message.type === 'response.audio_transcript.done') {
        setTranscript(message.transcript);
      }

      if (message.type === 'response.done') {
        const outputs = message.response?.output || [];
        for (const output of outputs) {
          if (output.type === 'function_call') {
            const handler = getFunctionHandler(output.name);
            if (handler) {
              try {
                const result = await handler(JSON.parse(output.arguments));
                dataChannel.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: output.call_id,
                    output: JSON.stringify(result)
                  }
                }));
                dataChannel.send(JSON.stringify({ type: 'response.create' }));
              } catch (error) {
                console.error('Function error:', error);
              }
            }
          }
        }
      }
    };

    const handleChannelOpen = () => {
      setIsSessionActive(true);
      dataChannel.send(JSON.stringify({
        type: 'session.update',
        session: {
          ...SESSION_CONFIG,
          tools: getFunctionSchemas(),
          instructions: API_INSTRUCTIONS
        }
      }));
    };

    dataChannel.addEventListener('message', handleDataMessage);
    dataChannel.addEventListener('open', handleChannelOpen);

    return () => {
      dataChannel.removeEventListener('message', handleDataMessage);
      dataChannel.removeEventListener('open', handleChannelOpen);
    };
  }, [dataChannel]);

  const sendMessage = ({ text, files }) => {
    if (!dataChannel) {
      console.error("No active data channel");
      return;
    }

    console.log("[SENDING MESSAGE]", text, files);

    // Send text message
    if (text) {
      dataChannel.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: text,
          }],
        }
      }));
      dataChannel.send(JSON.stringify({
        type: 'response.create'
      }));
    }

    // Handle file uploads
    if (files?.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          dataChannel.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'file',
              name: file.name,
              content: reader.result.split(',')[1]
            }
          }));
        };
        reader.readAsDataURL(file);
      });
    }

  };

  return { isSessionActive, transcript, startSession, stopSession, sendMessage };
} 