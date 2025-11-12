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

// simple auth route (register/login) — omit full code for brevity.
// import routes:
const deviceRoutes = require('./routes/devices');
const readingRoutes = require('./routes/readings');

app.use('/api/devices', deviceRoutes);
app.use('/api/readings', readingRoutes);

app.get('/', (req, res) => res.send('IBMS backend running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}`));
