**NutriBot Chatbot API Documentation**

**Endpoint**

POST /api/v1/chatbot/

**Authentication**

Required - JWT Bearer token in header:

Authorization: Bearer &lt;access_token&gt;

Only client and nutritionist roles can access this endpoint.

**Request**

**Headers:**

Content-Type: application/json

Authorization: Bearer &lt;access_token&gt;

**Body:**

json

{

"message": "How do I book a consultation?"

}

**Field rules:**

| **Field** | **Type** | **Required** | **Max Length** |
| --------- | -------- | ------------ | -------------- |
| message   | string   | ✅           | 500 characters |

**Response - Success 200**

json

{

"status": "success",

"data": {

"reply": "To book a consultation, go to the Marketplace and browse our certified nutritionists...",

"role": "assistant"

}

}

**Response - Errors**

**Empty message 400:**

json

{

"status": "error",

"message": "message is required."

}

**Message too long 400:**

json

{

"status": "error",

"message": "Message too long. Maximum 500 characters."

}

**Not authenticated 401:**

json

{

"status": "error",

"message": "Authentication credentials were not provided.",

"code": "UNAUTHORIZED"

}

**Service unavailable 503:**

json

{

"status": "error",

"message": "Chatbot service is not running. Please try again."

}

**Example - Postman**

POST <http://127.0.0.1:8000/api/v1/chatbot/>

Authorization: Bearer eyJhbGc...

Content-Type: application/json

{

"message": "What is the AI calorie tracker?"

}

**Frontend Implementation Guide**

**How it works**

- Each message is **independent** - no conversation history is saved
- The chatbot knows the platform features and general nutrition topics
- Responses are in **English only**
- Average response time: **1-2 seconds**

**Recommended UI behavior**

- Show a **loading spinner** while waiting for response
- Display the chatbot as a **floating button** bottom-right corner
- Allow the window to be **minimized and expanded**
- Clear the input field after sending
- Show an error message if the request fails

**Sample fetch call**

javascript

const sendMessage = async (message, accessToken) => {

const response = await fetch('<http://127.0.0.1:8000/api/v1/chatbot/>', {

method: 'POST',

headers: {

'Content-Type': 'application/json',

'Authorization': \`Bearer \${accessToken}\`,

},

body: JSON.stringify({ message }),

});

const data = await response.json();

if (data.status === 'success') {

return data.data.reply;

} else {

throw new Error(data.message);

}

};

**Sample React component structure**

javascript

// Suggested state structure

const \[isOpen, setIsOpen\] = useState(false);

const \[message, setMessage\] = useState('');

const \[reply, setReply\] = useState('');

const \[isLoading, setIsLoading\] = useState(false);

const \[error, setError\] = useState(null);

// On send

const handleSend = async () => {

if (!message.trim()) return;

setIsLoading(true);

setError(null);

try {

const response = await sendMessage(message, accessToken);

setReply(response);

setMessage('');

} catch (err) {

setError('Something went wrong. Please try again.');

} finally {

setIsLoading(false);

}

};

**What NutriBot Can Answer**

**Platform questions:**

- How to register and login
- How to book a consultation
- How to buy a meal plan
- How to use the calorie tracker
- How to use the AI food scanner (premium)
- How to subscribe to premium
- How to track daily progress
- How to use the community features
- How to submit support tickets

**Nutrition questions:**

- BMI and BMR explanations
- Macronutrients (protein, carbs, fats)
- Diet types (keto, vegan, paleo, etc.)
- Calorie requirements
- Healthy eating habits
- Weight loss and muscle gain basics

**NutriBot will NOT answer:**

- Personal medical advice
- Specific diagnosis questions
- Internal technical details
- Pricing of third-party services

**Notes for Frontend**

- The chatbot is **stateless** - each request is independent, no history
- Always send the **latest user message only**
- If you want to show conversation history in the UI, manage it **on the frontend side** - store previous messages in state and display them, but only send the current message to the API
- The role: "assistant" field in the response can be used to differentiate bot messages from user messages in the UI