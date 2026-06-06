package chatbot

import (
	"net/http"

	service "coinstrove/internal/services/chatbot"
)

func RegisterRoutes(openaiKey string) {
	chatService := service.NewChatbotService(openaiKey)
	chatHandler := NewChatHandler(chatService)

	http.HandleFunc("/api/chatbot/chat", chatHandler.HandleChat)
	http.HandleFunc("/api/chatbot/health", chatHandler.HandleHealthCheck)
}
