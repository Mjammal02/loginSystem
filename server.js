const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
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
