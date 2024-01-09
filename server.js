const express = require('express'); //verkty
const cors = require('cors'); //säkerhetsvertyg
const app = express();
const port = 5000;

app.use(cors()); //Säkerhetssystemet tillåter kommunikation till servern
app.use(express.json());

const usersRoutes = require('./users');
app.use('/api/users', usersRoutes);

app.get('/api', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ message: 'Hello on the server!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
