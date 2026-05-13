const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de vérification du token JWT
const protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier que le header Authorization existe et commence par "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la base (sans le mot de passe)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

// Middleware de vérification du rôle admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
};

module.exports = { protect, adminOnly };