const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

// CONFIGURAÇÃO DO SUPABASE (Com correção para ENETUNREACH)
// Adicionamos ?sslmode=require para garantir a rota correta entre Render e Supabase
const connectionString = 'postgresql://postgres:EvertonKamikase@2026@db.rimbskgmespybfgblggu.supabase.co:5432/postgres?sslmode=require';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Configurações extras para estabilizar a conexão em redes IPv6/IPv4 híbridas
  connectionTimeoutMillis: 10000, 
  idleTimeoutMillis: 30000
});

// Teste de conexão com log detalhado
pool.connect((err, client, release) => {
  if (err) {
    console.error('ERRO CRÍTICO: Não foi possível conectar ao Supabase!', err.message);
  } else {
    console.log('SUCESSO: Conectado ao Supabase! Banco de dados pronto.');
    release();
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
        console.error("Erro ao cadastrar:", err.message);
        res.status(500).json({ error: "Erro ao salvar no banco." });
    }
});

// 2. Rota para listar todos os alunos
app.get('/api/alunos', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM alunos ORDER BY nome ASC");
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar:", err.message);
        res.status(500).json({ error: "Erro ao buscar dados." });
    }
});

// 3. Rota para registrar presença
app.post('/api/chamada', async (req, res) => {
    const { aluno_id, data, status } = req.body;
    try {
        await pool.query(
            "INSERT INTO chamada (aluno_id, data, status) VALUES ($1, $2, $3)",
            [aluno_id, data, status]
        );
        res.json({ message: "Presença registrada!" });
    } catch (err) {
        console.error("Erro na chamada:", err.message);
        res.status(500).json({ error: "Erro ao registrar chamada." });
    }
});

// Servir o Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});