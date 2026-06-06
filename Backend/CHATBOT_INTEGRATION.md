# Integration Checklist - Step by Step

## ✅ Phase 1: Backend Setup (Completed Files Created)

### Files Created:
- ✅ `Backend/internal/services/chatbot/chatbot.go` - Core chatbot logic
- ✅ `Backend/internal/services/chatbot/analysis.go` - Data analysis service
- ✅ `Backend/api/chatbot/handler.go` - HTTP handlers
- ✅ `Backend/api/chatbot/routes.go` - Route registration
- ✅ `Backend/.env.example` - Environment variables template

### Next: Update Your Existing main.go

**File:** `Backend/cmd/main.go`

**Add these imports at the top:**
```go
import (
    "os"
    chatbotAPI "exchangego/api/chatbot"
    // ... your other imports
)
```

**Add this in your main() function (before server start):**
```go
func main() {
    mux := http.NewServeMux()
    
    // ... your existing routes ...
    
    // Initialize chatbot with OpenAI API key
    openaiKey := os.Getenv("OPENAI_API_KEY")
    if openaiKey == "" {
        log.Println("WARNING: OPENAI_API_KEY not set. ChatBot will not work.")
        // Optionally: panic("OPENAI_API_KEY environment variable not set")
    } else {
        chatbotAPI.RegisterRoutes(mux, openaiKey)
        log.Println("✅ ChatBot service initialized")
    }
    
    // Start your server
    log.Println("Server starting on :8080")
    http.ListenAndServe(":8080", mux)
}
```

---

## ✅ Phase 2: Frontend Setup (Completed Files Created)

### Files Created:
- ✅ `Frontend/src/components/ChatBot/ChatBot.tsx` - React component
- ✅ `Frontend/src/components/ChatBot/ChatBot.module.css` - Styling

### Next: Add ChatBot to Your App

**File:** `Frontend/src/App.tsx`

**Add import:**
```tsx
import ChatBot from './components/ChatBot/ChatBot';
```

**Add component to JSX (typically at end of App):**
```tsx
function App() {
  return (
    <div className="App">
      {/* ... your existing components ... */}
      <ChatBot />
    </div>
  );
}
```

**Example:**
```tsx
import './App.css'
import ChatBot from './components/ChatBot/ChatBot'
import Header from './components/Header/Header'
import Home from './pages/Home'

function App() {
  return (
    <>
      <Header />
      <Home />
      <ChatBot />  {/* Add here */}
    </>
  )
}

export default App
```

---

## 🔧 Phase 3: Dependencies

### Backend Dependencies

**Run in Backend folder:**
```bash
go get github.com/sashabaranov/go-openai
go mod tidy
```

**Update go.mod:**
Your `Backend/go.mod` should now include:
```
require (
    // ... existing requirements ...
    github.com/sashabaranov/go-openai v1.X.X
)
```

### Frontend Dependencies

**Already included in package.json** - No additional packages needed!

---

## 🔐 Phase 4: Environment Configuration

### Create .env File

**In Backend folder, create file named `.env`:**

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=8080
```

⚠️ **SECURITY WARNING:**
- Never commit .env to git
- Add to .gitignore:
  ```
  .env
  .env.local
  *.key
  ```

---

## 🚀 Phase 5: Testing

### Verify Installation

**1. Check Go package installed:**
```bash
cd Backend
go list github.com/sashabaranov/go-openai
```
Should output: `github.com/sashabaranov/go-openai`

**2. Check backend compiles:**
```bash
cd Backend/cmd
go build -o main.go
```
Should create executable without errors

**3. Check frontend builds:**
```bash
cd Frontend
npm run build
```
Should create build/ folder without errors

---

## ▶️ Running the Application

### Terminal 1 - Backend:
```bash
cd Backend/cmd
go run main.go
```
Expected output:
```
✅ ChatBot service initialized
Server starting on :8080
```

### Terminal 2 - Frontend:
```bash
cd Frontend
npm run dev
```
Expected output:
```
VITE v4.X.X ready in XXX ms
➜ Local: http://localhost:5173/
```

### Terminal 3 - Testing (Optional):
```bash
curl http://localhost:8080/api/chatbot/health
```
Expected output:
```json
{"status":"ok","service":"chatbot"}
```

---

## 📱 Verification Checklist

- [ ] Backend runs without errors
- [ ] Frontend loads at localhost:5173
- [ ] 💬 Chat button visible on page
- [ ] Health check endpoint responds
- [ ] Can send message and get response
- [ ] Disclaimer shows in chat
- [ ] No CORS errors in console
- [ ] No console errors in DevTools

---

## 🎯 Make Your First Test Call

### Browser Test:
1. Open http://localhost:5173
2. Click 💬 button (bottom right)
3. Type: "Hello! Which exchange would you recommend?"
4. Press send or click arrow

### Expected Result:
- Message appears in chat
- Disclaimer shows
- AI response about exchanges
- No errors in browser console

---

## 🔄 Integrating Real Data

**See:** `CHATBOT_SETUP.md` → "Integrating Real Exchange Data" section

Current implementation uses mock data. To use real exchange data:

1. Update `Backend/api/chatbot/handler.go` line ~30:
```go
// Replace this:
exchangeContext := GetSystemContext(map[string]map[string]float64{...})

// With this:
recentPrices, _ := h.priceRepository.GetRecentPrices(ctx)
exchangeContext := service.GetSystemContext(recentPrices)
```

2. Inject your PriceRepository into ChatHandler
3. See `Backend/internal/services/chatbot/analysis.go` for examples

---

## 🚨 Troubleshooting

### Issue: "OPENAI_API_KEY environment variable not set"
**Solution:**
1. Check .env file exists in Backend folder
2. Verify key is correct format: `sk-...`
3. Restart server

### Issue: CORS Error in Browser Console
**Solution:**
Add CORS middleware in Backend/cmd/main.go:
```go
func corsMiddleware(handler http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        handler.ServeHTTP(w, r)
    })
}

// Then wrap routes:
http.ListenAndServe(":8080", corsMiddleware(mux))
```

### Issue: "404 Not Found" on /api/chatbot/chat
**Solution:**
Verify RegisterRoutes was called in main.go before server starts

### Issue: Empty Responses from AI
**Solution:**
Check OpenAI API status at https://status.openai.com

### Issue: Very Slow Responses
**Solution:**
- Change model from GPT-4 to GPT-3.5-turbo in chatbot.go
- Reduce MaxTokens from 1000 to 500

---

## 📊 Next Steps After Setup

1. ✅ Get basic version working (you are here)
2. Add real exchange data integration
3. Add user authentication
4. Implement chat history persistence
5. Add rate limiting
6. Monitor OpenAI costs
7. Fine-tune responses with custom data
8. Deploy to production

---

## 📚 Reference Documents

| Document | Purpose |
|----------|---------|
| CHATBOT_SETUP.md | Detailed technical setup |
| CHATBOT_QUICKSTART.md | Quick 5-minute setup |
| CHATBOT_TESTING.md | Testing methods |
| This file | Integration checklist |

---

**Successfully completed all steps?** You're ready to use the chatbot! 🎉
