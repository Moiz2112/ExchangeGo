# 🚀 Quick Start Guide - ExchangeGO ChatBot

## 5-Minute Setup

### Step 1: Get OpenAI API Key (2 minutes)

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (you won't see it again!)

### Step 2: Configure Backend (1 minute)

```bash
cd Backend

# Copy environment template
cp .env.example .env

# Edit .env with your API key
# On Windows: notepad .env
# On Mac/Linux: nano .env
```

Add your key:
```env
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Install Dependencies (1 minute)

```bash
cd Backend
go get github.com/sashabaranov/go-openai
go mod tidy

cd ../Frontend
npm install
```

### Step 4: Start Server (1 minute)

**Terminal 1 - Backend:**
```bash
cd Backend/cmd
go run main.go
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

✅ Open http://localhost:5173 and look for the 💬 chat button!

---

## 📱 Testing the ChatBot

### Via Browser:
1. Open http://localhost:5173
2. Click 💬 button (bottom right)
3. Ask: "Which exchange has the best Bitcoin prices?"

### Via cURL (API Testing):

```bash
curl -X POST http://localhost:8080/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Compare BTC prices across exchanges",
    "history": []
  }'
```

---

## 🎯 What the ChatBot Can Do

✅ **Analyze exchanges**: "Which exchange has lowest fees?"
✅ **Compare coins**: "How does ETH perform on Binance vs Coinbase?"
✅ **Predict trends**: "Which altcoin has best growth potential?"
✅ **Historical analysis**: "Show me Bitcoin performance over time"
✅ **Recommendations**: "Best exchange for small traders?"

---

## ⚠️ Important Notes

1. **Costs Money**: Every message costs a few cents with OpenAI
   - Budget: ~$0.0003 per message (GPT-3.5)
   - Set spending limits in OpenAI dashboard

2. **Not Financial Advice**: Always show disclaimer
   - ✅ Included in component

3. **Real Data**: Currently uses mock data
   - See CHATBOT_SETUP.md for real data integration

4. **Rate Limiting**: Add limits to prevent spam
   - Protect your API usage budget

---

## 📊 File Structure

```
Backend/
├── api/chatbot/
│   ├── handler.go    ← HTTP endpoints
│   └── routes.go     ← Route registration
└── internal/services/chatbot/
    └── chatbot.go    ← AI logic

Frontend/
└── src/components/ChatBot/
    ├── ChatBot.tsx         ← Chat UI
    └── ChatBot.module.css  ← Styling
```

---

## 🔧 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "API key not found" | Copy key to .env file |
| CORS errors | Add CORS middleware in main.go |
| Slow responses | Use GPT-3.5 instead of GPT-4 |
| High costs | Reduce MaxTokens in chatbot.go |
| Chat not showing | Import ChatBot in App.tsx |

---

## 💡 Next Steps

1. ✅ Get this working
2. Add real exchange data (see CHATBOT_SETUP.md)
3. Add user authentication
4. Store chat history in database
5. Monitor costs and usage
6. Fine-tune responses with your data

---

## 📚 Documentation Files

- **CHATBOT_SETUP.md** - Detailed setup guide
- **.env.example** - Environment variables template
- **This file** - Quick start

---

**Questions?** Check CHATBOT_SETUP.md for detailed explanations!
