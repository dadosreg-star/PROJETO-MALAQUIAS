const { Pool } = require('pg');

// Substitua pelo link que o Supabase te der
const pool = new Pool({
  connectionString: 'SUA_URL_DO_SUPABASE_AQUI',
  ssl: { rejectUnauthorized: false }
});

// Exemplo de como ficaria a rota de cadastro
app.post('/api/alunos', async (req, res) => {
    const { nome, professor, turma } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO alunos (nome, professor, turma) VALUES ($1, $2, $3) RETURNING *",
            [nome, professor, turma]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});