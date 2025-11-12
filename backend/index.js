require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// connect mongo
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('Mongo connected'))
    .catch(err => console.error(err));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const floorRoutes = require('./routes/floors');
const spaceRoutes = require('./routes/spaces');
const accessLogRoutes = require('./routes/accessLogs');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/access-logs', accessLogRoutes);


app.get('/', (req, res) => res.send('IBMS backend running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}`));
