📦 Prerequisites
- Install Docker
- Install Docker Compose (usually included)

▶️ Steps of running backend

- git clone <your-repo-url>
- cd ExchangeGO/Backend
- docker-compose up --build

🧠 If ports are defined (example)

Check your docker-compose.yml, you’ll see something like:

ports:
  - "8080:8080"

Then backend runs at:

http://localhost:8080
  

👉 Run Frontend (Web)
cd ../Frontend
npm install
npm run dev

👉 Frontend runs on:

http://localhost:5173