
class LlmService {
    
    async getSimulatedResponse(userMessage) {
        // Step 1: Simulate the time it takes for a real LLM to process the request
        const minDelay = 10000; // 10 seconds
        const maxDelay = 20000; // 20 seconds
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        console.log(`[LLM Simulation] Starting delay of ${delay / 1000} seconds for message: "${userMessage.substring(0, 30)}..."`);

        // Use a Promise and setTimeout to create a non-blocking delay
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log('[LLM Simulation] Delay finished. Generating simulated response.');

        // Step 2: Prepare the hardcoded, multi-sentence response content
        const simulatedContent = `Here is a thoughtful, multi-sentence simulated AI reply to your query: "${userMessage}". In a real system, this response would have come from a complex external Large Language Model service like Gemini or OpenAI. The simulated latency of ${delay / 1000} seconds is designed to test how the frontend handles long-running asynchronous requests, ensuring the UI doesn't freeze and remains usable while awaiting this final message.`;

        // Step 3: Return the simulated API structure
        return {
            role: 'ai',
            content: simulatedContent
        };
    }
}

// Export a singleton instance of the service as ESM default
const llmServiceInstance = new LlmService();
export default llmServiceInstance;
