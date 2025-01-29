export const getEphemeralKey = async () => {
  const response = await fetch("/token");
  const data = await response.json();
  return data.client_secret.value;
}; 