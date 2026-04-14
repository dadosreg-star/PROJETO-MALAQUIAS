const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuração do Banco de Dados
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS alunos (id INTEGER PRIMARY KEY AUTO_INCREMENT, nome TEXT, professor TEXT, turma TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS chamada (id INTEGER PRIMARY KEY AUTO_INCREMENT, aluno_id INTEGER, data TEXT, status TEXT)");
});

app.use(express.json());
app.use(express.static('public'));

// Rota para cadastrar aluno
app.post('/api/alunos', (req, res) => {
    const { nome, professor, turma } = req.body;
    db.run("INSERT INTO alunos (nome, professor, turma) VALUES (?, ?, ?)", [nome, professor, turma], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Rota para buscar alunos
app.get('/api/alunos', (req, res) => {
    db.all("SELECT * FROM alunos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});