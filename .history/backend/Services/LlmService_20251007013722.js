
class LlmService {
    
    async getSimulatedResponse(userMessage) {
       
        const maxDelay = 20000; // 20 seconds
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        console.log(`[LLM Simulation] Starting delay of ${delay / 1000} seconds for message: "${userMessage.substring(0, 30)}..."`);

       
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log('[LLM Simulation] Delay finished. Generating simulated response.');

       
        const simulatedContent = `Here is a thoughtful, multi-sentence simulated AI reply to your query: "${userMessage}". In a real system, this response would have come from a complex external Large Language Model service like Gemini or OpenAI. The simulated latency of ${delay / 1000} seconds is designed to test how the frontend handles long-running asynchronous requests, ensuring the UI doesn't freeze and remains usable while awaiting this final message.`;


        return {
            role: 'ai',
            content: simulatedContent
        };
    }
}


export default new LlmService();
