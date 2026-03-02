import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT ?? 5000;

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : ['https://talentpipeai.vercel.app', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

console.log("CORS allowed for:", process.env.FRONTEND_URL);

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api', apiRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
