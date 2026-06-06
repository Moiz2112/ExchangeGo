package chatbot

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	service "coinstrove/internal/services/chatbot"
	"coinstrove/internal/core/userstore" 

	"github.com/sashabaranov/go-openai"
)

type ChatHandler struct {
	service *service.ChatbotService
}

type ChatRequestDTO struct {
	Message string                         `json:"message"`
	History []openai.ChatCompletionMessage `json:"history"`
}

type ChatResponseDTO struct {
	Message    string                         `json:"message"`
	History    []openai.ChatCompletionMessage `json:"history"`
	Disclaimer string                         `json:"disclaimer"`
	Success    bool                           `json:"success"`
	Error      string                         `json:"error,omitempty"`
}

// NewChatHandler creates a new chat handler
func NewChatHandler(svc *service.ChatbotService) *ChatHandler {
	return &ChatHandler{
		service: svc,
	}
}

// HandleChat processes chat messages
func (h *ChatHandler) HandleChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ChatRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		sendErrorResponse(w, "Message cannot be empty", http.StatusBadRequest)
		return
	}

	// Limit history to last 10 exchanges to manage token usage
	history := req.History
	if len(history) > 10 {
		history = history[len(history)-10:]
	}

	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()

	// Get exchange context - In production, fetch real data from your API
	liveData := userstore.GlobalStore.GetLatestPrices()
if len(liveData) == 0 {
    liveData = map[string]map[string]float64{
        "binance":  {"BTC": 0, "ETH": 0},
        "kraken":   {"BTC": 0, "ETH": 0},
        "coinbase": {"BTC": 0, "ETH": 0},
    }
}
exchangeContext := service.GetSystemContext(liveData)

	chatReq := &service.ChatRequest{
		UserMessage: req.Message,
		History:     history,
	}

	resp, err := h.service.ProcessMessage(ctx, chatReq, exchangeContext)
	if err != nil {
		sendErrorResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&ChatResponseDTO{
		Message:    resp.Message,
		History:    resp.History,
		Disclaimer: resp.Disclaimer,
		Success:    true,
	})
}

// HandleHealthCheck returns health status
func (h *ChatHandler) HandleHealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "chatbot",
	})
}

func sendErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(&ChatResponseDTO{
		Success: false,
		Error:   message,
	})
}
