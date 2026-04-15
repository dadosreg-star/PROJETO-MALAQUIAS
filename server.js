const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

// CONFIGURAÇÃO DO SUPABASE
// Removi os colchetes da sua senha para que a conexão funcione
const connectionString = 'postgresql://postgres:EvertonKamikase@2026@db.rimbskgmespybfgblggu.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Teste de conexão no log do Render
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar no Supabase:', err.stack);
  } else {
    console.log('Conectado ao Supabase com sucesso! Dados sincronizados.');
  }
});

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- ROTAS DA API ---

// 1. Rota para cadastrar aluno
app.post('/api/alunos', async (req, res) => {
    const { nome, professor, turma } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO alunos (nome, professor, turma) VALUES ($1, $2, $3) RETURNING *",
            [nome, professor, turma]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao salvar aluno no banco de dados." });
    }
});

// 2. Rota para listar todos os alunos
app.get('/api/alunos', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM alunos ORDER BY nome ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar alunos." });
    }
});

// 3. Rota para registrar presença (chamada)
app.post('/api/chamada', async (req, res) => {
    const { aluno_id, data, status } = req.body;
    try {
        await pool.query(
            "INSERT INTO chamada (aluno_id, data, status) VALUES ($1, $2, $3)",
            [aluno_id, data, status]
        );
        res.json({ message: "Presença registrada!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao registrar chamada." });
    }
});

// Rota para servir o HTML
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor Malaquias rodando na porta ${port}`);
});