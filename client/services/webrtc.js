export const createPeerConnection = () => {
  const pc = new RTCPeerConnection();
  return pc;
};

export const setupMediaStream = async () => {
  return navigator.mediaDevices.getUserMedia({ audio: true });
};

export const createDataChannel = (pc, channelName) => {
  return pc.createDataChannel(channelName);
}; 