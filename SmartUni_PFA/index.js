const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// ── Middlewares globaux ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Connexion MongoDB ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté avec succès'))
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  });

// ── Import des routes ────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const sensorRoutes  = require('./routes/sensorRoutes');
const roomRoutes    = require('./routes/roomRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const alertRoutes   = require('./routes/alertRoutes');

// ── Déclaration des routes ───────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/rooms',   roomRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/alerts',  alertRoutes);

// ── Route racine ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🎓 SmartUni PFA — API IoT opérationnelle',
    version: '1.0.0',
    routes: ['/api/auth', '/api/sensors', '/api/rooms', '/api/parking', '/api/alerts'],
  });
});

// ── Route 404 personnalisée ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.originalUrl}` });
});

// ── Démarrage du serveur ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur SmartUni démarré sur le port ${PORT}`);
  console.log(`📡 Mode : ${process.env.NODE_ENV || 'développement'}`);
});