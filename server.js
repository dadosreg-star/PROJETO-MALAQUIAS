const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();

// O Render define a porta automaticamente. Se não houver, usa a 10000.
const port = process.env.PORT || 10000;

// Configuração do Banco de Dados SQLite
// O arquivo database.db será criado automaticamente na raiz do projeto
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
    }
});

// Criando as tabelas (Correção do erro AUTOINCREMENT)
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS alunos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        nome TEXT NOT NULL, 
        professor TEXT, 
        turma TEXT
    )`, (err) => {
        if (err) console.error("Erro ao criar tabela alunos:", err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS chamada (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        aluno_id INTEGER, 
        data TEXT, 
        status TEXT,
        FOREIGN KEY (aluno_id) REFERENCES alunos (id)
    )`, (err) => {
        if (err) console.error("Erro ao criar tabela chamada:", err.message);
    });
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve os arquivos HTML, CSS, JS da pasta public

// --- ROTAS DA API ---

// 1. Rota para cadastrar aluno
app.post('/api/alunos', (req, res) => {
    const { nome, professor, turma } = req.body;
    const sql = "INSERT INTO alunos (nome, professor, turma) VALUES (?, ?, ?)";
    
    db.run(sql, [nome, professor, turma], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            message: "Aluno cadastrado com sucesso!",
            id: this.lastID 
        });
    });
});

// 2. Rota para listar todos os alunos
app.get('/api/alunos', (req, res) => {
    const sql = "SELECT * FROM alunos ORDER BY nome ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 3. Rota para registrar presença (chamada)
app.post('/api/chamada', (req, res) => {
    const { aluno_id, data, status } = req.body;
    const sql = "INSERT INTO chamada (aluno_id, data, status) VALUES (?, ?, ?)";
    
    db.run(sql, [aluno_id, data, status], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Presença registrada!" });
    });
});

// Rota principal para servir o HTML caso acesse a raiz
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});