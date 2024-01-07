const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Antal saltvarv för att öka säkerheten
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');




//show all users
router.get('/get-users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error executing query: ', error);
    res.status(500).json({ error: 'Database error' });
  }
});

//Create a user
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Alla fält måste fyllas i' });
    }

    // Hasha lösenordet med bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await db.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email]);

    res.status(201).json({ message: 'Användare skapad', userId: result.insertId });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Något gick fel' });
  }
});

// Delete a user
router.delete('/delete-user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    await db.execute('DELETE FROM users WHERE user_id = ?', [userId]);
    res.status(200).json({ message: 'Användare raderad', userId });
  } catch (error) {
    console.error('Error during deletion:', error);
    res.status(500).json({ error: 'Något gick fel' });
  }
});


//-------------------------------
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Retrieve user from the database based on the username
    const [user] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

    if (!user.length) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check the password
    const passwordMatch = await bcrypt.compare(password, user[0].password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate a JWT and store it in the database
    const token = jwt.sign({ userId: user[0].user_id }, 'your-secret-key', { expiresIn: '1h' });

    await db.execute('UPDATE users SET session_token = ? WHERE user_id = ?', [token, user[0].user_id]);

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


//----------------------------------------



// Function to generate a reset token using jsonwebtoken
function generateResetToken() {
  return jwt.sign({ data: 'resetToken' }, 'your-secret-key', { expiresIn: '1h' });
}


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL,
    pass: EMAIL_PASSWORD
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email exists in the database
    const [user] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (!user.length) {
      return res.status(404).json({ error: 'No user found with that email address' });
    }

    // Generate a reset token (you can use a library like crypto or uuid for this)
    const resetToken = generateResetToken();

    // Set the reset token and expiration date in the database
    await db.execute('UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE user_id = ?', [resetToken, new Date(), user[0].user_id]);

    const emailSent = await sendResetEmail(user[0].email, resetToken);
    if (!emailSent) {
      console.error('Error sending email:', emailSent);
      return res.status(500).json({ error: 'Error sending email' });
    }

    res.status(200).json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    console.error('Error during forgot password:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Function to send reset email
async function sendResetEmail(email, resetToken) {
  try {
    // Define the email content
    const mailOptions = {
      from: 'ma7645ja-s@student.lu.se', // replace with your application's email
      to: email,
      subject: 'Password Reset',
      text: `Here is you token to reset you password: ${resetToken}`
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info);

    return true; // Return true if the email is sent successfully
  } catch (error) {
    console.error('Error sending email:', error);
    return false; // Return false if there is an error sending the email
  }
}

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    console.log('Received reset token:', resetToken);


    // Check if the reset token is valid and not expired
    console.log('Reset Token:', resetToken);
    const [user] = await db.execute('SELECT * FROM users WHERE reset_token = ?', [resetToken]);
console.log('Database Query Result:', user);

    if (!user.length) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await db.execute('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE user_id = ?', [hashedPassword, user[0].user_id]);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});




module.exports = router;
