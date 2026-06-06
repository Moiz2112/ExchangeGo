package chatbot

import (
	"context"
	"fmt"
	"strings"

	"github.com/sashabaranov/go-openai"
)

type ChatbotService struct {
	client       *openai.Client
	model        string
	systemPrompt string
}

type ChatRequest struct {
	UserMessage string                         `json:"message"`
	History     []openai.ChatCompletionMessage `json:"history"`
}

type ChatResponse struct {
	Message    string                         `json:"message"`
	History    []openai.ChatCompletionMessage `json:"history"`
	Disclaimer string                         `json:"disclaimer"`
}

// NewChatbotService creates a new chatbot service instance
func NewChatbotService(apiKey string) *ChatbotService {
	config := openai.DefaultConfig(apiKey)
	config.BaseURL = "https://api.groq.com/openai/v1"
	client := openai.NewClientWithConfig(config)
    fmt.Println("api key ", apiKey)

	systemPrompt := `You are an AI assistant for ExchangeGO, a cryptocurrency exchange comparison platform.

	RESPONSE LENGTH RULES - VERY IMPORTANT:
	- For greetings (hi, hello, hey): Reply in 2-3 lines only. Be warm and brief.
	- For simple questions: Reply in 3-4 lines maximum.
	- For detailed analysis questions about exchanges, prices, trends: Give a thorough response.
	- Never give a long response to a short casual message.

	YOUR CAPABILITIES:
	- Analyze cryptocurrency exchange rates across multiple exchanges (Binance, Coinbase, Kraken, KuCoin, OKX, Bitstamp, Bitfinex, BitPay, Gate.io, Huobi)
	- Compare price performance of coins across exchanges using the REAL DATA provided below
	- Identify trends and patterns in cryptocurrency trading based on the data provided
	- Answer questions about current prices using the exchange context data given to you

	IMPORTANT GUIDELINES:
	1. You HAVE access to real-time exchange data — it is provided in the context below. Use it to answer price questions.
	2. When user asks about prices on a specific exchange, refer to the CURRENT EXCHANGE DATA CONTEXT.
	3. When discussing predictions, emphasize historical performance does not guarantee future results.
	4. Do NOT say you don't have real-time data — you do have it from the context provided.
	5. Do not provide personalized financial or investment advice.
	6. Be specific about which exchanges and coins you are analyzing.

	Remember: You are assisting with analysis, not providing financial advice.`

	return &ChatbotService{
		client:       client,
		model:        "llama-3.3-70b-versatile",
		systemPrompt: systemPrompt,
	}
}

// ProcessMessage handles user messages and generates responses
func (cs *ChatbotService) ProcessMessage(ctx context.Context, req *ChatRequest, exchangeContext string) (*ChatResponse, error) {
	// Prepare messages with system prompt and context
	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: fmt.Sprintf("%s\n\nCURRENT EXCHANGE DATA CONTEXT:\n%s", cs.systemPrompt, exchangeContext),
		},
	}

	// Add conversation history
	messages = append(messages, req.History...)

	// Add current user message
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: req.UserMessage,
	})

	// Call OpenAI API
	resp, err := cs.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       cs.model,
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   1000,
	})

	if err != nil {
		return nil, fmt.Errorf("openai api error: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from openai")
	}

	assistantMessage := resp.Choices[0].Message.Content

	// Update history
	newHistory := append(req.History,
		openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleUser,
			Content: req.UserMessage,
		},
		openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleAssistant,
			Content: assistantMessage,
		},
	)

	disclaimer := "⚠️ DISCLAIMER: This AI analysis is based on historical data and patterns. " +
		"It is NOT guaranteed to be 100% accurate. Cryptocurrency markets are volatile and unpredictable. " +
		"Please do your own research and consult financial advisors before making investment decisions."

	return &ChatResponse{
		Message:    assistantMessage,
		History:    newHistory,
		Disclaimer: disclaimer,
	}, nil
}

// GetSystemContext generates context about available exchanges and data
func GetSystemContext(recentPrices map[string]map[string]float64) string {
	var context strings.Builder
	context.WriteString("Available Exchanges and Recent Performance:\n")
	context.WriteString("=========================================\n")

	for exchange, coins := range recentPrices {
		context.WriteString(fmt.Sprintf("\n%s:\n", strings.ToUpper(exchange)))
		for coin, price := range coins {
			context.WriteString(fmt.Sprintf("  - %s: $%.2f\n", coin, price))
		}
	}

	return context.String()
}
