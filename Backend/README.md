# 🚀 ExchangeGO

A real-time cryptocurrency exchange tracking platform with a scalable backend and modern frontend.

---

## 📦 Prerequisites

Make sure you have the following installed on your system:

* [Docker](https://www.docker.com/)
* Docker Compose (usually bundled with Docker)
* [Node.js](https://nodejs.org/) (v16 or higher recommended)
* npm or yarn

---

## 🛠️ Backend Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
```

### 2. Navigate to Backend Directory

```bash
cd ExchangeGO/Backend
```

### 3. Run Backend using Docker

```bash
docker-compose up --build
```

---

### ⚙️ Backend Configuration

Check your `docker-compose.yml` file for port configuration:

```yaml
ports:
  - "8080:8080"
```

### 🌐 Backend URL

Once running, backend will be available at:

```
http://localhost:8080
```

---

## 💻 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

---

### 🌐 Frontend URL

Frontend will run at:

```
http://localhost:5173
```

---

## 🔄 Project Structure

```
ExchangeGO/
│
├── Backend/      # Golang backend (WebSocket + APIs)
├── Frontend/     # React + TypeScript frontend
└── README.md
```

---

## ⚡ Features

* 📊 Real-time crypto price tracking
* 🔌 WebSocket-based live updates
* ⚛️ Modern React frontend with fast rendering
* 🐳 Dockerized backend for easy deployment
* 📡 Scalable architecture for multiple exchanges

---

## 🚧 Development Notes

* Ensure backend is running before starting frontend
* WebSocket endpoint should match frontend configuration
* Use `.env` files for environment-specific configs

---

## 📌 Future Improvements

* Authentication system
* Advanced charting (TradingView integration)
* AI-based price prediction module
* Multi-exchange comparison dashboard

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.
