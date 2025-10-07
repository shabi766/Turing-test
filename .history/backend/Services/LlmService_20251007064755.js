class LlmService {
    /**
     * Simulates a non-streaming, high-latency API call (e.g., waiting for a full response).
     * It uses a random delay to test UI resilience to long-running asynchronous tasks.
     * * @param {string} userMessage - The message sent by the user.
     * @returns {Promise<{role: string, content: string}>} A promise that resolves with the full AI response.
     */
    async getSimulatedResponse(userMessage) {
        // Step 1: Define a long, random delay
        const minDelay = 10000; // 10 seconds
        const maxDelay = 20000; // 20 seconds
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        console.log(`[LLM Simulation] Starting fixed delay of ${delay / 1000} seconds for message: "${userMessage.substring(0, 30)}..."`);

        // Use a Promise and setTimeout to create a non-blocking delay
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log('[LLM Simulation] Delay finished. Generating simulated response.');

        // Step 2: Prepare the substantial, hardcoded response content
        const simulatedContent = `Here is a thoughtful, multi-sentence simulated AI reply to your query: "${userMessage}". In a real system, this response would have come from a complex external Large Language Model service like Gemini or OpenAI. The simulated latency of ${delay / 1000} seconds is designed to test how the frontend handles **long-running asynchronous requests**, ensuring the UI doesn't freeze and remains usable while awaiting this final message.`;

        return {
            role: 'ai',
            content: simulatedContent
        };
    }

    /**
     * Simulates a streaming API call by yielding words in chunks over time.
     * This tests how the UI incrementally builds a response.
     * * @param {string} userMessage - The message sent by the user.
     * @yields {string} A chunk of the response (typically a word or phrase).
     */
    async *getSimulatedStream(userMessage) {
        // Step 1: Define a substantial, multi-sentence response for streaming
        const simulatedContent = `This is a much longer, multi-sentence response designed to test streaming capabilities. Unlike the fixed-delay response, this is sent **word-by-word with small pauses** in between. It shows how your application can handle data arriving asynchronously in small chunks, mimicking a real-time LLM stream from a service like Gemini or OpenAI. The original user message was: "${userMessage}". We hope this simulation helps you ensure your user interface provides a smooth, engaging experience.`;
        
        // Split the content into words (chunks)
        const words = simulatedContent.split(" ");
        
        // Step 2: Yield each word with a small delay
        for (let i = 0; i < words.length; i++) {
            // Small delay per chunk to simulate streaming lag
            await new Promise((resolve) => setTimeout(resolve, 100)); 
            
            // Yield the word, adding a space unless it's the very last word
            yield words[i] + (i < words.length - 1 ? " " : ""); 
        }
    }
}


const llmServiceInstance = new LlmService();
export default llmServiceInstance;