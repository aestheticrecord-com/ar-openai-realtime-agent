import Fastify from "fastify";
import fastifyEnv from "@fastify/env";

const server = Fastify({
  logger: true,
  bodyLimit: 1048576 * 10 // 10MB
});

const schema = {
  type: "object",
  required: ["OPENAI_API_KEY"],
  properties: {
    OPENAI_API_KEY: {
      type: "string",
    },
  },
};

await server.register(fastifyEnv, { dotenv: true, schema });

// Process Excel API endpoint
server.post('/api/process-excel', async (request, reply) => {
  try {
    const requestData = request.body;
    
    if (!requestData.excelData || !requestData.systemInstructions || !requestData.schema) {
      return reply.code(400).send({ 
        error: 'Missing required fields. Please provide excelData, systemInstructions, and schema.' 
      });
    }

    console.log(`Processing Excel data with AI. Sheets count: ${requestData.excelData.length}`);
    
    const dataSize = JSON.stringify(requestData.excelData).length;
    console.log(`Data size: ${dataSize} bytes`);
    
    let optimizedData = requestData.excelData;
    if (dataSize > 100000) {
      console.log("Data is large, reducing to essential fields only");
      optimizedData = requestData.excelData.map(sheet => 
        sheet.map((row) => {
          const essentialFields = {};
          for (const key in row) {
            if (
              key.toLowerCase().includes('name') ||
              key.toLowerCase().includes('email') ||
              key.toLowerCase().includes('phone') ||
              key.toLowerCase().includes('role') ||
              key.toLowerCase().includes('schedule') ||
              key.toLowerCase().includes('location')
            ) {
              essentialFields[key] = row[key];
            }
          }
          return essentialFields;
        })
      );
    }
    
    const userContent = requestData.userInstructions 
      ? `${requestData.userInstructions}\n\nExcel Data: ${JSON.stringify(optimizedData)}`
      : `Parse this extracted excel information from ${optimizedData.length} sheets and return the exact schema as JSON: ${JSON.stringify(optimizedData)}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "o3-mini",
        messages: [
          {
            role: "developer",
            content: requestData.systemInstructions
          },
          {
            role: "user",
            content: userContent
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: requestData.schemaName,
            schema: requestData.schema
          }
        },
        reasoning_effort: "medium"
      }),
    });

    const openAIResponse = await response.json();
    
    if (openAIResponse.error) {
      console.error("OpenAI API Error:", openAIResponse.error);
      return reply.code(500).send({ 
        error: `API Error: ${openAIResponse.error.message || 'Unknown error'}` 
      });
    }

    const content = openAIResponse.choices[0]?.message?.content;
    
    if (!content) {
      console.error("No content received from OpenAI");
      throw new Error('Failed to get valid response from OpenAI');
    }
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      return reply.code(500).send({ 
        error: 'Failed to parse response from AI' 
      });
    }
    
    return { 
      data: parsedContent,
      message: 'Excel data processed successfully'
    };
    
  } catch (error) {
    console.error('Error processing Excel data:', error);
    return reply.code(500).send({ 
      error: error.message || 'An unexpected error occurred'
    });
  }
});

// Add a health check endpoint
server.get('/', async () => {
  return { status: 'Server is running' };
});

await server.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });

