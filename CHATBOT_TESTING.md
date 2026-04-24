# Testing the ExchangeGO ChatBot

## 🧪 Test Methods

### Method 1: Browser (Easiest)
1. Start frontend: `npm run dev` in Frontend folder
2. Open http://localhost:5173
3. Click 💬 button
4. Type message and send

---

### Method 2: cURL (Command Line)

#### Basic Test:
```bash
curl -X POST http://localhost:8080/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Which exchange has the best Bitcoin prices?",
    "history": []
  }'
```

#### With Chat History:
```bash
curl -X POST http://localhost:8080/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about Ethereum?",
    "history": [
      {
        "role": "user",
        "content": "Which exchange has the best Bitcoin prices?"
      },
      {
        "role": "assistant",
        "content": "Based on current market data, Binance and Coinbase offer competitive BTC prices..."
      }
    ]
  }'
```

---

### Method 3: Postman (GUI Tool)

1. Download Postman from postman.com
2. Create new POST request
3. URL: `http://localhost:8080/api/chatbot/chat`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "message": "Compare SOL and ADA performance",
  "history": []
}
```
6. Click Send

---

### Method 4: Python Script

Create `test_chatbot.py`:

```python
import requests
import json

BASE_URL = "http://localhost:8080/api/chatbot"

def test_basic_chat():
    """Test basic chatbot message"""
    payload = {
        "message": "Which exchange has the lowest fees?",
        "history": []
    }
    
    response = requests.post(
        f"{BASE_URL}/chat",
        json=payload,
        timeout=30
    )
    
    print("Status:", response.status_code)
    print("Response:")
    print(json.dumps(response.json(), indent=2))

def test_conversation():
    """Test multi-turn conversation"""
    history = []
    
    messages = [
        "What are the top 5 cryptocurrencies by market cap?",
        "Which of these performs best on Binance?",
        "What are the fees for trading on Binance?"
    ]
    
    for msg in messages:
        payload = {
            "message": msg,
            "history": history
        }
        
        response = requests.post(
            f"{BASE_URL}/chat",
            json=payload,
            timeout=30
        )
        
        data = response.json()
        print(f"\n📝 User: {msg}")
        print(f"🤖 Assistant: {data['message'][:200]}...")
        
        # Update history with response
        history = data.get('history', history)

def test_health():
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print("Health Status:", response.json())

if __name__ == "__main__":
    print("Testing ChatBot...\n")
    
    print("1️⃣ Testing health endpoint:")
    test_health()
    
    print("\n2️⃣ Testing basic chat:")
    test_basic_chat()
    
    print("\n3️⃣ Testing conversation:")
    test_conversation()
```

Run it:
```bash
python test_chatbot.py
```

---

### Method 5: JavaScript/Node.js Test

Create `test_chatbot.js`:

```javascript
const BASE_URL = 'http://localhost:8080/api/chatbot';

async function testBasicChat() {
  try {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Compare Bitcoin prices across exchanges',
        history: []
      })
    });

    const data = await response.json();
    console.log('✅ Response:', data.message);
    console.log('⚠️ Disclaimer:', data.disclaimer);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testConversation() {
  let history = [];
  
  const questions = [
    'What is the best exchange for beginners?',
    'Which coins are trending on that exchange?'
  ];

  for (const question of questions) {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        history: history
      })
    });

    const data = await response.json();
    console.log(`Q: ${question}`);
    console.log(`A: ${data.message}\n`);
    
    history = data.history;
  }
}

testBasicChat();
// testConversation();
```

Run it:
```bash
node test_chatbot.js
```

---

## ✅ Test Cases

### Test Case 1: Basic Functionality
**Input:** "Which exchange has the best Bitcoin prices?"
**Expected:** Response about Bitcoin prices and exchanges
**Status:** ✓ Pass / ✗ Fail

### Test Case 2: Multi-turn Conversation
**Step 1:** Ask about exchanges
**Step 2:** Ask about specific coins
**Expected:** Maintains context from previous message
**Status:** ✓ Pass / ✗ Fail

### Test Case 3: Error Handling
**Input:** Empty message or invalid JSON
**Expected:** Clear error message
**Status:** ✓ Pass / ✗ Fail

### Test Case 4: Disclaimer Presence
**Expected:** Every response includes disclaimer
**Status:** ✓ Pass / ✗ Fail

### Test Case 5: Response Time
**Expected:** Response within 30 seconds
**Status:** ✓ Pass / ✗ Fail

---

## 🐛 Debugging Tips

### 1. Check Backend Logs
```bash
cd Backend/cmd
go run main.go 2>&1 | tee debug.log
```

### 2. Monitor API Calls
```bash
# Install tcpdump or use Wireshark
# Or just check browser DevTools Network tab
```

### 3. Test with Verbose Output
```bash
curl -v -X POST http://localhost:8080/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[]}'
```

### 4. Check OpenAI API Status
```bash
# Visit: https://status.openai.com
# Or test API directly:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key"
```

### 5. Environment Variable Check
```bash
# On Windows
echo %OPENAI_API_KEY%

# On Mac/Linux
echo $OPENAI_API_KEY
```

---

## 📊 Common Test Results

### ✅ Success Response
```json
{
  "message": "Based on current market data...",
  "history": [...],
  "disclaimer": "⚠️ DISCLAIMER: This AI analysis...",
  "success": true
}
```

### ❌ Error Response (Missing API Key)
```json
{
  "error": "openai api error: invalid authentication",
  "success": false
}
```

### ❌ Error Response (Invalid Request)
```json
{
  "error": "Message cannot be empty",
  "success": false
}
```

---

## 📈 Performance Metrics to Check

| Metric | Target | How to Check |
|--------|--------|-------------|
| Response Time | < 5s | Use cURL with time |
| Token Usage | < 500/msg | Check OpenAI dashboard |
| Uptime | 99%+ | Monitor logs |
| Error Rate | < 1% | Count failures |

---

## 🔄 Continuous Testing

### Option 1: Simple Bash Script
```bash
#!/bin/bash
echo "Testing chatbot every 5 minutes..."
while true; do
  curl -s -X POST http://localhost:8080/api/chatbot/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test","history":[]}' | grep -q "success"
  
  if [ $? -eq 0 ]; then
    echo "✅ $(date): ChatBot is working"
  else
    echo "❌ $(date): ChatBot failed"
  fi
  
  sleep 300
done
```

### Option 2: GitHub Actions (CI/CD)
```yaml
name: Test ChatBot API

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test ChatBot Endpoint
        run: |
          curl -X POST http://localhost:8080/api/chatbot/chat \
            -H "Content-Type: application/json" \
            -d '{"message":"test","history":[]}'
```

---

## 📋 Test Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] OpenAI API key configured
- [ ] Health check passes
- [ ] Basic message gets response
- [ ] Response includes disclaimer
- [ ] Chat history is maintained
- [ ] Error messages are clear
- [ ] No CORS errors
- [ ] Response time acceptable
- [ ] No unexpected charges

---

**Ready to test?** Start with Method 1 (Browser) for the easiest experience!
