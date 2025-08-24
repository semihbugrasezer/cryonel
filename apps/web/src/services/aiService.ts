import { AIRequest, AIResponse } from '../types';

interface AIConfig {
    mode: 'local-ollama' | 'local-webgpu' | 'byo-cloud';
    baseUrl?: string;
    model?: string;
    maxTokens?: number;
    timeout?: number;
}

class AIService {
    private config: AIConfig;
    private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
    private cacheTTL = 15 * 60 * 1000; // 15 minutes default

    constructor() {
        this.config = {
            mode: (import.meta.env.AI_MODE as AIConfig['mode']) || 'local-ollama',
            baseUrl: import.meta.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            model: import.meta.env.AI_MODEL || 'llama3.1:8b-instruct',
            maxTokens: parseInt(import.meta.env.AI_MAX_TOKENS || '512'),
            timeout: parseInt(import.meta.env.AI_TIMEOUT_MS || '15000'),
        };
    }

    private generateCacheKey(request: AIRequest): string {
        return `${request.type}-${JSON.stringify(request.payload)}-${request.model || this.config.model}`;
    }

    private isCacheValid(key: string): boolean {
        const cached = this.cache.get(key);
        if (!cached) return false;

        return Date.now() - cached.timestamp < cached.ttl;
    }

    private getCachedResponse(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && this.isCacheValid(key)) {
            return cached.data;
        }
        return null;
    }

    private setCachedResponse(key: string, data: any, ttl: number = this.cacheTTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    private async makeLocalOllamaRequest(request: AIRequest): Promise<AIResponse> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: request.model || this.config.model,
                    prompt: this.buildPrompt(request),
                    stream: false,
                    options: {
                        num_predict: request.max_tokens || this.config.maxTokens,
                        temperature: 0.7,
                        top_p: 0.9,
                    },
                }),
                signal: AbortSignal.timeout(this.config.timeout || 15000),
            });

            if (!response.ok) {
                throw new Error(`Ollama request failed: ${response.status}`);
            }

            const result = await response.json();
            const parsedData = this.parseAIResponse(result.response, request.type);

            return {
                success: true,
                data: parsedData,
                confidence: 0.8,
                risk_flags: [],
                cached: false,
            };
        } catch (error) {
            console.error('Local Ollama request failed:', error);
            throw error;
        }
    }

    private async makeWebGPURequest(_request: AIRequest): Promise<AIResponse> {
        // This would integrate with web-llm or transformers.js
        // For now, return a fallback response
        throw new Error('WebGPU AI not yet implemented');
    }

    private async makeCloudRequest(_request: AIRequest): Promise<AIResponse> {
        // This would integrate with user-provided cloud AI services
        // For now, return a fallback response
        throw new Error('Cloud AI not yet implemented');
    }

    private buildPrompt(request: AIRequest): string {
        const basePrompt = `You are CRYONEL, an AI trading assistant. Analyze the following data and provide insights in JSON format only.`;

        switch (request.type) {
            case 'ideas':
                return `${basePrompt}
        
        Generate trading ideas based on this data: ${JSON.stringify(request.payload)}
        
        Return a JSON object with:
        - ideas: array of trading opportunities
        - confidence: number between 0-1
        - risk_level: "low", "medium", "high"
        - reasoning: brief explanation`;

            case 'explain':
                return `${basePrompt}
        
        Explain this trading data: ${JSON.stringify(request.payload)}
        
        Return a JSON object with:
        - explanation: clear explanation of the data
        - key_insights: array of important points
        - recommendations: array of suggested actions`;

            case 'alerts':
                return `${basePrompt}
        
        Suggest alert rules for this data: ${JSON.stringify(request.payload)}
        
        Return a JSON object with:
        - alerts: array of suggested alert configurations
        - thresholds: recommended values
        - reasoning: why these alerts would be useful`;

            default:
                return `${basePrompt}
        
        Analyze this data: ${JSON.stringify(request.payload)}
        
        Return a JSON object with your analysis.`;
        }
    }

    private parseAIResponse(response: string, type: string): any {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // If no JSON found, return structured fallback
            return {
                message: response,
                type,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return {
                message: response,
                type,
                timestamp: new Date().toISOString(),
                parse_error: true,
            };
        }
    }

    async generateResponse(request: AIRequest): Promise<AIResponse> {
        const cacheKey = this.generateCacheKey(request);

        // Check cache first
        const cached = this.getCachedResponse(cacheKey);
        if (cached) {
            return {
                success: true,
                data: cached,
                confidence: 0.9,
                risk_flags: [],
                cached: true,
            };
        }

        try {
            let response: AIResponse;

            switch (this.config.mode) {
                case 'local-ollama':
                    response = await this.makeLocalOllamaRequest(request);
                    break;

                case 'local-webgpu':
                    response = await this.makeWebGPURequest(request);
                    break;

                case 'byo-cloud':
                    response = await this.makeCloudRequest(request);
                    break;

                default:
                    throw new Error(`Unknown AI mode: ${this.config.mode}`);
            }

            // Cache successful responses
            if (response.success && response.data) {
                this.setCachedResponse(cacheKey, response.data);
            }

            return response;
        } catch (error) {
            console.error('AI request failed:', error);

            // Return graceful fallback
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                data: null,
                confidence: 0,
                risk_flags: ['ai_unavailable'],
                cached: false,
            };
        }
    }

    // Convenience methods for common AI requests
    async generateTradingIdeas(marketData: any): Promise<AIResponse> {
        return this.generateResponse({
            type: 'ideas',
            payload: marketData,
        });
    }

    async explainTrade(tradeData: any): Promise<AIResponse> {
        return this.generateResponse({
            type: 'explain',
            payload: tradeData,
        });
    }

    async suggestAlerts(marketData: any): Promise<AIResponse> {
        return this.generateResponse({
            type: 'alerts',
            payload: marketData,
        });
    }

    // Health check for AI service
    async healthCheck(): Promise<boolean> {
        try {
            if (this.config.mode === 'local-ollama') {
                const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000),
                });
                return response.ok;
            }

            // For other modes, assume healthy
            return true;
        } catch (error) {
            console.error('AI health check failed:', error);
            return false;
        }
    }

    // Update configuration
    updateConfig(newConfig: Partial<AIConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    // Get current configuration
    getConfig(): AIConfig {
        return { ...this.config };
    }

    // Clear cache
    clearCache(): void {
        this.cache.clear();
    }
}

export const aiService = new AIService();
export default aiService;
