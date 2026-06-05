// ============================================================
//  SmartUni PFA — index.js (version MQTT + Socket.IO)
//  Remplace l'ancien index.js
// ============================================================

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const { Server } = require('socket.io');

const { startMQTT, setIO } = require('./services/mqttService');

dotenv.config();

const app    = express();
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log(`🔌 Client Socket.IO connecté : ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client déconnecté : ${socket.id}`);
  });
});

// ─── Middlewares ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── MongoDB ─────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    // Démarrer MQTT après connexion DB
    setIO(io);
    startMQTT();
  })
  .catch((err) => {
    console.error('❌ MongoDB :', err.message);
    process.exit(1);
  });

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/sensors', require('./routes/sensorRoutes'));
app.use('/api/rooms',   require('./routes/roomRoutes'));
app.use('/api/parking', require('./routes/parkingRoutes'));
app.use('/api/alerts',  require('./routes/alertRoutes'));

// ─── Route racine ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🎓 SmartUni PFA — API IoT + MQTT opérationnelle',
    version: '2.0.0',
    mqtt:    'broker.hivemq.com:1883',
    routes: ['/api/auth', '/api/sensors', '/api/rooms', '/api/parking', '/api/alerts'],
  });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.originalUrl}` });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur SmartUni sur le port ${PORT}`);
  console.log(`🌐 Socket.IO actif`);
});