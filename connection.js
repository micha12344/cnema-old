const mongoose = require('mongoose');

//connect mongodb
mongoose.connect('mongodb+srv://:@cluster0-ngaul.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true });
const db = mongoose.connection;

db.on('error', (error) => console.log('db connection err'))

db.once('open', () => console.log('connected to mongo db'))