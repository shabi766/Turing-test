# Backend - Turing Test Chat App

This folder contains the **Express + MongoDB (Mongoose)** backend for the ChatGPT-like application.

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/shabi766/Turing-test.git
cd Turing-test/backend

2. Install dependencies
npm install

Configure environment variables

Create a .env file in this directory using the provided .env.example.

MONGO_URI=mongodb://shoaibkayani8_db_user:xI71Bs7KOlcDe1wr@ac-2qmjnya-shard-00-00.ejvkt3x.mongodb.net:27017,ac-2qmjnya-shard-00-01.ejvkt3x.mongodb.net:27017,ac-2qmjnya-shard-00-02.ejvkt3x.mongodb.net:27017/?ssl=true&replicaSet=atlas-1pza4t-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=secretkeyforjwt121
PORT=8000

Run the server
npm run dev


Server will run on:

http://localhost:8000


CLIENT_URL=http://localhost:3000