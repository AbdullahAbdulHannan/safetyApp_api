require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(cors({
  origin: '*', // or replace with specific Snack origin if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);
const contactsRoutes = require('./routes/contactsRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const callRoutes = require('./routes/callRoutes');
app.use('/api/contacts', contactsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calls', callRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`)); 