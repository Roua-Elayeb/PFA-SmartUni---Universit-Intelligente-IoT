const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, level, specialty } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont obligatoires.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Cet email/CIN est déjà utilisé.' });
    }

    const user = await User.create({
      name, email, password,
      role: role || 'user',
      level: level || '',
      specialty: specialty || '',
    });

    res.status(201).json({
      message: 'Inscription réussie.',
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, level: user.level, specialty: user.specialty },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;  // ← reçoit "email" du frontend

    // Cherche par email OU cin
    const user = await User.findOne({
      $or: [{ email: email }, { cin: email }]
    });

    if (!user) {
      return res.status(401).json({ message: 'CIN ou mot de passe incorrect.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'CIN ou mot de passe incorrect.' });
    }

   res.json({
  message: 'Connexion réussie.',
  token: generateToken(user._id),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,    // ← ce champ doit être présent
    level: user.level,
    specialty: user.specialty,
  },
});
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
// GET /api/auth/users — Liste tous les utilisateurs (admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/auth/users/:id — Supprimer un utilisateur (admin)
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
// PUT /api/auth/users/:id — Modifier un utilisateur
const updateUser = async (req, res) => {
  try {
    const { name, email, level, specialty } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, level, specialty },  // ← ajoute level et specialty
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    res.json({ message: 'Utilisateur modifié.', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { register, login, getProfile, getAllUsers, deleteUser, updateUser };
