package main

import (
	"coinstrove/api/auth"
	"coinstrove/api/chatbot"
	"coinstrove/api/websocket"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/publisher"
	"coinstrove/internal/core/services/realtimeprice/binance"
	"coinstrove/internal/core/services/realtimeprice/bitfinex"
	"coinstrove/internal/core/services/realtimeprice/bitstamp"
	"coinstrove/internal/core/services/realtimeprice/coinbase"
	gate_io "coinstrove/internal/core/services/realtimeprice/gate.io"
	"coinstrove/internal/core/services/realtimeprice/huobi"
	"coinstrove/internal/core/services/realtimeprice/kraken"
	"coinstrove/internal/core/services/realtimeprice/kucoin"
	"coinstrove/internal/core/services/realtimeprice/okx"
	"coinstrove/internal/core/userstore"
	"coinstrove/repositories/apirepository"
	"log"
	"net/http"
	"time"
	"os"
	"github.com/joho/godotenv"
)

func getPriceAfterFiveSeconds(priceService []ports.PriceService) {

	ticker := time.NewTicker(7 * time.Second)
	for range ticker.C {
		log.Printf("Starting To Fetch Latest Price")
		for _, value := range priceService {
			go value.GetThePrice()
		}
		log.Printf("Fetch Price competed")
	}

}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func startServer() {
	// Auth REST endpoints
	http.HandleFunc("/register", auth.Register)
	http.HandleFunc("/login", auth.Login)

	log.Println("Starting Server on :8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func main() {
	
	
	if err := godotenv.Load(".env"); err != nil {
        if err := godotenv.Load("../. env"); err != nil {
            log.Println("⚠️  Warning: Could not load .env file")
        }
    }

	// Init database (creates users table if needed)
	userstore.Init()

	apiRepo := apirepository.NewAPIRepository()
	handler := websocket.NewHandler()
	broadCastManager := websocket.NewBroadcastManager(handler)

	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}
	quePublisher, err := publisher.NewRabbitMQPublisher(rabbitURL)
	if err != nil {
		log.Printf("Error while Initiating Rabbit MQ Connection with message %v", err)
		log.Printf("Continuing without RabbitMQ publisher for now...")
	}
	if quePublisher != nil {
		quePublisher.Init()
		defer quePublisher.Close()
	}

	websocket.NewRouter(handler)

	// Initialize ChatBot with OpenAI API key
	openaiKey := os.Getenv("OPENAI_API_KEY")
	if openaiKey == "" {
		log.Println("❌ ERROR: OPENAI_API_KEY is empty! ChatBot will not work.")
		log.Println("   Make sure you have OPENAI_API_KEY=sk-... in your .env file")
	} else {
		// Show first and last few characters of key for debugging
		keyPreview := openaiKey[:min(20, len(openaiKey))] + "..."
		if len(openaiKey) > 20 {
			keyPreview = openaiKey[:20] + "..." + openaiKey[len(openaiKey)-5:]
		}
		log.Printf("✅ OpenAI API Key loaded: %s (length: %d chars)", keyPreview, len(openaiKey))
	}
	chatbot.RegisterRoutes(openaiKey)
	log.Println("✅ ChatBot routes registered")

	go startServer()

	priceService := []ports.PriceService{
		binance.NewBinanceService(apiRepo, broadCastManager, quePublisher),
		gate_io.NewGateIOService(apiRepo, broadCastManager, quePublisher),
		kraken.NewKrakenService(apiRepo, broadCastManager, quePublisher),
		coinbase.NewCoinBaseService(apiRepo, broadCastManager, quePublisher),
		//bitpay.NewBitPayService(apiRepo, broadCastManager, quePublisher),
		bitfinex.NewBitfinexService(apiRepo, broadCastManager, quePublisher),
		bitstamp.NewBitstampService(apiRepo, broadCastManager, quePublisher),
		huobi.NewHuobiService(apiRepo, broadCastManager, quePublisher),
		kucoin.NewKucoinService(apiRepo, broadCastManager, quePublisher),
		okx.NewOkxService(apiRepo, broadCastManager, quePublisher),
	}

	// WebSocket Endpoints
	go getPriceAfterFiveSeconds(priceService)

	select {}
}
