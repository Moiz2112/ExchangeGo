package main

import (
	"coinstrove/api/admin"
	"coinstrove/api/auth"
	"coinstrove/api/chatbot"
	"coinstrove/api/websocket"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/publisher"
	"coinstrove/internal/core/registry"
	"coinstrove/internal/core/userstore"
	"coinstrove/internal/services/dynamicfetcher"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/joho/godotenv"
)

// ─── Hot-reloadable price service manager ────────────────────────────────────

type serviceManager struct {
	mu        sync.RWMutex
	services  []ports.PriceService
	broadcast ports.BroadCastHandler
	pub       ports.Publisher
}

func newServiceManager(broadcast ports.BroadCastHandler, pub ports.Publisher) *serviceManager {
	sm := &serviceManager{broadcast: broadcast, pub: pub}
	sm.reload()
	return sm
}

// reload rebuilds the service list from the current registry state.
// Called at startup and after every admin exchange/coin change.
func (sm *serviceManager) reload() {
	services := dynamicfetcher.BuildServicesFromRegistry(sm.broadcast, sm.pub)
	sm.mu.Lock()
	sm.services = services
	sm.mu.Unlock()
	log.Printf("ServiceManager: reloaded %d services", len(services))
}

// run fetches prices from all active services, called on every ticker tick.
func (sm *serviceManager) run() {
	sm.mu.RLock()
	svcs := make([]ports.PriceService, len(sm.services))
	copy(svcs, sm.services)
	sm.mu.RUnlock()

	for _, svc := range svcs {
		go svc.GetThePrice()
	}
}

// ─── Price ticker loop ────────────────────────────────────────────────────────

func startPriceTicker(sm *serviceManager) {
	ticker := time.NewTicker(7 * time.Second)
	for range ticker.C {
		log.Printf("Fetching prices from %d active services", len(sm.services))
		sm.run()
	}
}

// ─── Registry refresh hook (called by admin handler after changes) ────────────

// GlobalServiceManager is used by the admin handler to trigger hot-reload.
var GlobalServiceManager *serviceManager

// ─── HTTP server ──────────────────────────────────────────────────────────────

func startServer() {
	http.HandleFunc("/register", auth.Register)
	http.HandleFunc("/login", auth.Login)
	http.HandleFunc("/reset-password", auth.ResetPassword)
	admin.RegisterRoutes()

	log.Println("Server listening on :8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ─── Main ─────────────────────────────────────────────────────────────────────

func main() {
	if err := godotenv.Load(".env"); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			log.Println("Warning: .env not found")
		}
	}

	// Init DB + admin tables
	userstore.Init()
	userstore.GlobalStore.InitAdminTables()

	// Load enabled state into registry
	registry.Global.Refresh()

	// WebSocket handler
	handler := websocket.NewHandler()
	broadCastManager := websocket.NewBroadcastManager(handler)
	websocket.NewRouter(handler)

	// RabbitMQ (optional)
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}
	quePublisher, err := publisher.NewRabbitMQPublisher(rabbitURL)
	if err != nil {
		log.Printf("RabbitMQ unavailable: %v — continuing without it", err)
	}
	if quePublisher != nil {
		quePublisher.Init()
		defer quePublisher.Close()
	}

	// ChatBot
	openaiKey := os.Getenv("OPENAI_API_KEY")
	openaiModel := os.Getenv("OPENAI_MODEL")
	if openaiKey == "" {
		log.Println("WARNING: OPENAI_API_KEY not set - chatbot disabled")
	} else {
		log.Printf("Groq key loaded from OPENAI_API_KEY (%d chars)", len(openaiKey))
	}
	if openaiModel != "" {
		log.Printf("Chatbot model loaded from OPENAI_MODEL: %s", openaiModel)
	}
	chatbot.RegisterRoutes(openaiKey, openaiModel)

	// Build dynamic service manager (reads from registry)
	GlobalServiceManager = newServiceManager(broadCastManager, quePublisher)

	// Inject hot-reload hook into admin handler
	// The admin handler calls registry.Global.Refresh() then this hook
	admin.SetReloadHook(func() {
		registry.Global.Refresh()
		GlobalServiceManager.reload()
	})

	log.Println("Admin routes registered at /admin/*")
	log.Println("Dynamic price fetcher ready")

	// Start HTTP server in background
	go startServer()

	// Start price ticker
	go startPriceTicker(GlobalServiceManager)

	select {}
}
