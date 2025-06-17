# CryptoChat Palace

CryptoChat Palace is a secure messaging web application featuring end-to-end encryption, built with React, TypeScript, Vite, Tailwind CSS, and shadcn-ui. The backend is powered by Python (Flask).

## Features

- Secure user authentication (register/login)
- End-to-end encrypted messaging using Diffie-Hellman key exchange and AES
- Modern, responsive UI with shadcn-ui and Tailwind CSS
- Real-time chat interface
- User-friendly onboarding and encryption status indicators

## Technologies Used

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn-ui](https://ui.shadcn.com/)
- [Flask](https://flask.palletsprojects.com/) (backend)
- [MongoDB](https://www.mongodb.com/) (database)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) & npm
- [Python 3](https://www.python.org/)
- [MongoDB](https://www.mongodb.com/try/download/community)

### Installation

1. **Clone the repository**
   ```sh
   git clone <[YOUR_GIT_URL](https://github.com/leohum69/Secure-Chat-Application)>
   cd <Secure-Chat-Application>
   ```

2. **Install frontend dependencies**
   ```sh
   npm install
   ```

3. **Install backend dependencies**
   ```sh
   cd server
   pip install -r requirements.txt
   ```

4. **Start MongoDB**  
   Make sure your MongoDB server is running.

5. **Start the backend server**
   ```sh
   cd server
   python server.py
   ```

6. **Start the frontend development server**
   ```sh
   npm run dev
   ```

7. **Open your browser**  
   Visit [http://localhost:8000](http://localhost:8000) (or the port shown in your terminal).

## Project Structure

```
proj/
├── public/              # Static assets
├── server/              # Flask backend
│   └── server.py
├── src/                 # Frontend source code
│   ├── api/             # API calls
│   ├── components/      # React components
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities
│   ├── pages/           # Page components
│   └── main.tsx         # App entry point
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```


## License

This project is for educational purposes.

---

**CryptoChat Palace** – Secure your conversations!
