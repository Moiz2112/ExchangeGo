package chatbot

import (
	"net/http"

	service "coinstrove/internal/services/chatbot"
)

func RegisterRoutes(apiKey, model string) {
	chatService := service.NewChatbotService(apiKey, model)
	chatHandler := NewChatHandler(chatService)

	http.HandleFunc("/api/chatbot/chat", chatHandler.HandleChat)
	http.HandleFunc("/api/chatbot/health", chatHandler.HandleHealthCheck)
}
