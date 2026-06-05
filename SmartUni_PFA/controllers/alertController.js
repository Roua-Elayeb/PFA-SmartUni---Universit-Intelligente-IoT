const Alert = require('../models/Alert');

const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json({ count: alerts.length, alerts });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

const createAlert = async (req, res) => {
  try {
    const { type, message, location } = req.body;
    if (!type || !message)
      return res.status(400).json({ message: 'Le type et le message sont obligatoires.' });
    const VALID_TYPES = ['urgence', 'sécurité', 'technique'];
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ message: `Type invalide. Types acceptés : ${VALID_TYPES.join(', ')}` });
    const alert = await Alert.create({ type, message, location, createdBy: req.user._id });
    res.status(201).json({ message: 'Alerte créée.', alert });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alerte introuvable.' });
    res.json({ message: 'Alerte marquée comme lue.', alert });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

const triggerAlarm = async (req, res) => {
  try {
    const { message, location } = req.body;
    const alarm = await Alert.create({
      type: 'urgence',
      message: message || '🚨 ALARME GÉNÉRALE DÉCLENCHÉE',
      location: location || 'Tout le bâtiment',
      isAlarm: true,
      createdBy: req.user._id,
    });
    res.status(201).json({ message: 'Alarme générale déclenchée.', alarm });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { getAlerts, createAlert, markAsRead, triggerAlarm };