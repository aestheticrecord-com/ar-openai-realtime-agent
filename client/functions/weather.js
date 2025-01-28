export const weatherFunction = {
    type: "function",
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA"
        }
      },
      required: ["location"]
    }
  };
  
  export const handler = async ({ location }) => {
    console.log("[WEATHER] Fetching for:", location);
    // Add real API call here
    return { temp: 72, condition: "Sunny" };
  };