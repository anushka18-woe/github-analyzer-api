const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database.');
});

app.post('/api/analyze/:username', async (req, res) => {
    const username = req.params.username;

    try {
        
        const response = await axios.get(`https://api.github.com/users/${username}`);
        const { name, public_repos, followers, following } = response.data;

        
        const sql = `INSERT INTO profiles (username, name, public_repos, followers, following) 
                     VALUES (?, ?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE name=?, public_repos=?, followers=?, following=?`;
        
        db.query(sql, [username, name, public_repos, followers, following, name, public_repos, followers, following], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: "Profile analyzed and saved successfully!", 
                data: { username, name, public_repos, followers, following } 
            });
        });

    } catch (error) {
        res.status(404).json({ message: "GitHub user not found or GitHub API issue" });
    }
});


app.get('/api/profiles', (req, res) => {
    const sql = 'SELECT * FROM profiles';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/profiles/:username', (req, res) => {
    const sql = 'SELECT * FROM profiles WHERE username = ?';
    db.query(sql, [req.params.username], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: "Profile not found in database" });
        res.json(result[0]);
    });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));