export const accountFunction = {
  type: "function",
  name: "setup_account",
  description: "Setup a new account for an aesthetic clinic in Aesthetic Record EMR",
  parameters: {
    type: "object",
    properties: {
      firstname: { type: "string", description: "First name of clinic owner" },
      lastname: { type: "string", description: "Last name of clinic owner" },
      email_id: { type: "string", description: "Account email address" },
      contact_number_1: { type: "string", description: "Phone with country code" },
      business_name: { type: "string", description: "Clinic/business name" },
      business_address: { type: "string", description: "Street address" },
      business_city: { type: "string", description: "City" },
      business_state: { type: "string", description: "State abbreviation" },
      business_zip: { type: "string", description: "ZIP code" },
      business_suite_number: { type: "string", description: "Suite/unit number" }
    },
    required: [
      "firstname", "lastname", "email_id", "contact_number_1",
      "business_name", "business_address", "business_city",
      "business_state", "business_zip"
    ]
  }
};

export async function accountHandler(args) {
  try {
    // Validate required fields
    console.log("args", args);
    const required = accountFunction.parameters.required;
    const missing = required.filter(field => !args[field]);
    console.log("missing", missing);
    if (missing.length > 0) {
      throw new Error(`Missing fields: ${missing.join(", ")}`);
    }

    // Build request body
    const payload = {
      ...args,
      business_country: "US",
      password: "",
      confirm_password: "",
      term_condition: 1,
      agree_checkbox: 1,
      invite_key: ""
    };

    console.log("payload", payload);

    // Make API call
    const response = await fetch("https://api.dev.arinternal.xyz/api/signup-basic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("response", response);

    const data = await response.json();
    
    if (response.status === 201) {
      return { 
        success: true,
        message: "Account created successfully",
        data: data.data
      };
    }
    
    return {
      success: false,
      error: data.message || "Account creation failed",
      details: data
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
} 