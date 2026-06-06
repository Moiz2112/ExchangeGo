# ExchangeGO ChatBot Integration Guide

## 🎯 Overview
This guide helps you integrate the AI chatbot into your ExchangeGO platform. The chatbot uses OpenAI's GPT models to answer questions about cryptocurrency exchanges, predict trends, and provide historical performance analysis.

---

## 📋 Prerequisites

### Required:
- OpenAI API Key (get it from https://platform.openai.com)
- Go 1.19+
- Node.js 16+

### Optional:
- Docker (for containerized deployment)

---

## 🔧 Backend Setup

### Step 1: Install OpenAI Go Package

```bash
cd Backend
go get github.com/sashabaranov/go-openai
```

### Step 2: Add Environment Variable

Create or update your `.env` file in the Backend directory:

```env
OPENAI_API_KEY=sk-your-actual-key-here
PORT=8080
```

**Security Warning**: Never commit `.env` files to version control. Add to `.gitignore`:
```
.env
.env.local
```

### Step 3: Update Main.go

Add the chatbot routes to your main.go:

```go
package main

import (
	"os"
	"net/http"
	
	chatbotAPI "exchangego/api/chatbot"
	// ... other imports
)

func main() {
	mux := http.NewServeMux()
	
	// ... existing routes ...
	
	// Initialize chatbot with OpenAI API key
	openaiKey := os.Getenv("OPENAI_API_KEY")
	if openaiKey == "" {
		// Handle missing API key
		panic("OPENAI_API_KEY environment variable not set")
	}
	
	chatbotAPI.RegisterRoutes(mux, openaiKey)
	
	// ... rest of your server setup ...
	
	http.ListenAndServe(":8080", mux)
}
```

### Step 4: Test Backend

```bash
cd Backend/cmd
go run main.go
```

Test the health endpoint:
```bash
curl http://localhost:8080/api/chatbot/health
```

---

## 🎨 Frontend Setup

### Step 1: Integrate ChatBot Component

In your main app component (e.g., [App.tsx](App.tsx)):

```tsx
import ChatBot from './components/ChatBot/ChatBot';

function App() {
  return (
    <div className="App">
      {/* ... existing components ... */}
      <ChatBot />
    </div>
  );
}

export default App;
```

### Step 2: Update CORS (if needed)

If your frontend and backend are on different domains, update your backend CORS middleware:

```go
func corsMiddleware(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		handler.ServeHTTP(w, r)
	})
}
```

### Step 3: Build Frontend

```bash
cd Frontend
npm install
npm run build
```

---

## 🚀 API Endpoints

### 1. Chat Endpoint
**POST** `/api/chatbot/chat`

**Request:**
```json
{
  "message": "Which exchange has the best BTC prices?",
  "history": []
}
```

**Response:**
```json
{
  "message": "Based on current market data...",
  "history": [
    {"role": "user", "content": "Which exchange has the best BTC prices?"},
    {"role": "assistant", "content": "Based on current market data..."}
  ],
  "disclaimer": "⚠️ DISCLAIMER: This AI analysis...",
  "success": true
}
```

### 2. Health Check Endpoint
**GET** `/api/chatbot/health`

**Response:**
```json
{
  "status": "ok",
  "service": "chatbot"
}
```

---

## 📊 Integrating Real Exchange Data

Currently, the chatbot uses mock data. To integrate real data:

### Update [handler.go](Backend/api/chatbot/handler.go):

```go
// Instead of mock data, fetch from your API
func (h *ChatHandler) HandleChat(w http.ResponseWriter, r *http.Request) {
	// ... existing code ...
	
	// Fetch real data from your price repository
	recentPrices, err := h.priceRepository.GetRecentPrices(ctx)
	if err != nil {
		// handle error
	}
	
	exchangeContext := service.GetSystemContext(recentPrices)
	// ... rest of the handler ...
}
```

---

## ⚙️ Configuration Options

### Adjust Model & Parameters

In [chatbot.go](Backend/internal/services/chatbot/chatbot.go):

```go
cs.model = openai.GPT4 // Use GPT-4 instead of GPT-3.5
```

Available models:
- `openai.GPT3Dot5Turbo` (faster, cheaper)
- `openai.GPT4` (smarter, slower)
- `openai.GPT4Turbo` (balanced)

### Temperature (Creativity)

```go
Temperature: 0.7, // Range: 0.0 (deterministic) to 1.0 (creative)
```

### Max Tokens (Response Length)

```go
MaxTokens: 1000, // Adjust based on needs
```

---

## 🐳 Docker Deployment

Update your [Dockerfile](Backend/Dockerfile):

```dockerfile
FROM golang:1.19-alpine AS builder

WORKDIR /app
COPY . .

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]
```

Update [docker-compose.yml](Backend/docker-compose.yml):

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PORT=8080
    depends_on:
      - rabbitmq
```

---

## 💰 Cost Estimation

**OpenAI API Pricing** (as of 2024):
- GPT-3.5 Turbo: ~$0.50 per 1M input tokens, $1.50 per 1M output tokens
- GPT-4: ~$30 per 1M input tokens, $60 per 1M output tokens

**Typical Usage:**
- Average question: ~50 tokens input, ~200 tokens output
- Cost per query: ~$0.00015 (GPT-3.5) or ~$0.0027 (GPT-4)

**Recommendations:**
- Start with GPT-3.5 Turbo for cost efficiency
- Monitor usage via OpenAI dashboard
- Set rate limits to prevent unexpected costs

---

## 🔐 Security Best Practices

1. **Never expose API keys**:
   ```bash
   # ❌ Wrong
   const API_KEY = "sk-xxxxx"; // in frontend code
   
   # ✅ Correct
   // Keep keys in backend environment variables only
   ```

2. **Validate user input**:
   - Check message length
   - Rate limit requests per user/IP
   - Sanitize inputs

3. **Add authentication**:
   ```go
   func authMiddleware(handler http.Handler) http.Handler {
       return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
           token := r.Header.Get("Authorization")
           if !isValidToken(token) {
               http.Error(w, "Unauthorized", http.StatusUnauthorized)
               return
           }
           handler.ServeHTTP(w, r)
       })
   }
   ```

---

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY not set"
**Solution:** Ensure `.env` file exists and contains valid key, or set via environment:
```bash
export OPENAI_API_KEY=sk-your-key
```

### Issue: CORS errors
**Solution:** Add CORS middleware to all routes in main.go

### Issue: 429 Rate Limit Exceeded
**Solution:** Add request throttling and implement backoff strategy

### Issue: Slow responses
**Solution:** 
- Use GPT-3.5 instead of GPT-4
- Reduce MaxTokens
- Implement response caching

---

## 📈 Future Enhancements

1. **Persistent Chat History**: Store conversations in database
2. **User Profiles**: Personalize recommendations
3. **Real-time Price Updates**: Use WebSocket for live data
4. **Analytics**: Track popular questions and improve responses
5. **Multi-language Support**: Support chat in multiple languages
6. **Custom Fine-tuning**: Train on your specific exchange data

---

## 📞 Support

For issues:
1. Check OpenAI API status: https://status.openai.com
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Check logs: `tail -f logs/chatbot.log`

---

## 📄 Files Created

```
Backend/
├── api/chatbot/
│   ├── handler.go      # HTTP handlers for chat endpoints
│   └── routes.go       # Route registration
└── internal/services/chatbot/
    └── chatbot.go      # Core chatbot logic and OpenAI integration

Frontend/
├── src/components/ChatBot/
│   ├── ChatBot.tsx     # React component
│   └── ChatBot.module.css  # Styling
```

---

**Last Updated:** April 2024
**Version:** 1.0.0
