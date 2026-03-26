lucide.createIcons();

// --- BANCO DE DADOS LOCAL ---
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [{ nome: "Administrador", login: "admin", pass: "123" }];
let modalidades = JSON.parse(localStorage.getItem('modalidades')) || [];
let alunos = JSON.parse(localStorage.getItem('alunos')) || [];
let professores = JSON.parse(localStorage.getItem('professores')) || [];
let presencas = JSON.parse(localStorage.getItem('presencas')) || {};

let usuarioLogado = null;

// --- LOGIN ---
function autenticar() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const user = usuarios.find(x => x.login === u && x.pass === p);
    
    if (user) {
        usuarioLogado = user;
        document.getElementById('login-container').classList.remove('active');
        document.getElementById('main-dashboard').classList.add('active');
        document.getElementById('user-display-name').innerText = user.nome || user.login;
        document.getElementById('user-avatar').innerText = (user.nome || user.login).charAt(0).toUpperCase();
        
        const hoje = new Date().toISOString().substring(0, 7);
        document.getElementById('filtro-mes').value = hoje;
        document.getElementById('rel-mes').value = hoje;
    } else { alert("Usuário ou senha inválidos."); }
}

function validarAdmin() {
    if (!usuarioLogado || usuarioLogado.login !== 'admin') {
        alert("Acesso Negado: Apenas o Administrador pode realizar esta ação.");
        return false;
    }
    return true;
}

// --- NAVEGAÇÃO ---
function irPara(tela) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('screen-' + tela).style.display = 'block';
    
    const navBtn = document.getElementById('nav-' + tela);
    if(navBtn) navBtn.classList.add('active');
    
    if(tela === 'chamada' || tela === 'relatorios') preencherFiltros(tela);
    if(tela === 'dados') renderBuscaGeral();
    
    const titulos = { 
        'home': 'Painel Administrativo', 
        'chamada': 'Controle de Frequência', 
        'relatorios': 'Relatórios e Documentos',
        'dados': 'Consulta de Dados Cadastrados' 
    };
    document.getElementById('page-title').innerText = titulos[tela];
}

// --- BUSCA GERAL ---
function renderBuscaGeral() {
    const cat = document.getElementById('busca-categoria').value;
    const term = document.getElementById('input-busca-geral').value.toLowerCase();
    const head = document.getElementById('head-busca-geral');
    const body = document.getElementById('body-busca-geral');
    
    let htmlHead = "";
    let htmlBody = "";

    if (cat === 'alunos') {
        htmlHead = "<tr><th>Nome</th><th>Modalidade</th><th>Contato</th><th>Ações</th></tr>";
        const filtrados = alunos.filter(a => a.nome.toLowerCase().includes(term));
        htmlBody = filtrados.map((a, i) => `<tr><td>${a.nome}</td><td>${a.modalidade}</td><td>${a.contato}</td><td><button class="btn-edit" onclick="editarGeral('aluno', ${alunos.indexOf(a)})">Editar</button> <button class="btn-delete" onclick="removerGeral('aluno', ${alunos.indexOf(a)})">Excluir</button></td></tr>`).join('');
    } else if (cat === 'professores') {
        htmlHead = "<tr><th>Nome</th><th>CPF</th><th>Contato</th><th>Ações</th></tr>";
        const filtrados = professores.filter(p => p.nome.toLowerCase().includes(term));
        htmlBody = filtrados.map((p, i) => `<tr><td>${p.nome}</td><td>${p.cpf}</td><td>${p.contato}</td><td><button class="btn-edit" onclick="editarGeral('prof', ${professores.indexOf(p)})">Editar</button> <button class="btn-delete" onclick="removerGeral('prof', ${professores.indexOf(p)})">Excluir</button></td></tr>`).join('');
    } else if (cat === 'modalidades') {
        htmlHead = "<tr><th>Modalidade</th><th>Professor</th><th>Horário</th><th>Ações</th></tr>";
        const filtrados = modalidades.filter(m => m.nome.toLowerCase().includes(term));
        htmlBody = filtrados.map((m, i) => `<tr><td>${m.nome}</td><td>${m.professor}</td><td>${m.inicio}</td><td><button class="btn-edit" onclick="editarGeral('mod', ${modalidades.indexOf(m)})">Editar</button> <button class="btn-delete" onclick="removerGeral('mod', ${modalidades.indexOf(m)})">Excluir</button></td></tr>`).join('');
    } else if (cat === 'usuarios') {
        htmlHead = "<tr><th>Nome</th><th>Login</th><th>Ações</th></tr>";
        const filtrados = usuarios.filter(u => u.nome.toLowerCase().includes(term));
        htmlBody = filtrados.map((u, i) => `<tr><td>${u.nome}</td><td>${u.login}</td><td>${u.login !== 'admin' ? `<button class="btn-edit" onclick="editarGeral('user', ${usuarios.indexOf(u)})">Editar</button> <button class="btn-delete" onclick="removerGeral('user', ${usuarios.indexOf(u)})">Excluir</button>` : '---'}</td></tr>`).join('');
    }

    head.innerHTML = htmlHead;
    body.innerHTML = htmlBody;
}

// --- EDIÇÃO E REMOÇÃO ---
function editarGeral(tipo, index) {
    if (tipo === 'user' && !validarAdmin()) return;

    if(tipo === 'aluno') {
        const a = alunos[index];
        abrirModal('aluno');
        document.getElementById('edit-aluno-index').value = index;
        document.getElementById('aluno-nome').value = a.nome;
        document.getElementById('aluno-nascimento').value = a.nascimento;
        document.getElementById('aluno-contato').value = a.contato;
        document.getElementById('aluno-endereco').value = a.endereco;
        document.getElementById('aluno-modalidade').value = a.modalidade;
        document.getElementById('aluno-professor').value = a.professor;
        document.getElementById('aluno-peso').value = a.peso || '';
        document.getElementById('aluno-altura').value = a.altura || '';
        document.getElementById('aluno-imc').value = a.imc || '';
        document.getElementById('aluno-cintura').value = a.cintura || '';
        document.getElementById('aluno-torax').value = a.torax || '';
        document.getElementById('aluno-quadril').value = a.quadril || '';
        document.getElementById('aluno-obs').value = a.obs || '';
        if(a.foto) document.getElementById('preview-aluno').innerHTML = `<img src="${a.foto}">`;
        document.getElementById('btn-aluno-save').innerText = "Salvar Alterações";
    } else if (tipo === 'prof') {
        const p = professores[index];
        abrirModal('professor');
        document.getElementById('edit-prof-index').value = index;
        document.getElementById('prof-nome').value = p.nome;
        document.getElementById('prof-cpf').value = p.cpf;
        document.getElementById('prof-contato').value = p.contato;
        if(p.foto) document.getElementById('preview-professor').innerHTML = `<img src="${p.foto}">`;
        document.getElementById('btn-prof-save').innerText = "Salvar Alterações";
    } else if (tipo === 'mod') {
        const m = modalidades[index];
        abrirModal('modalidades');
        document.getElementById('mod-index').value = index;
        document.getElementById('mod-nome').value = m.nome;
        document.getElementById('mod-professor').value = m.professor;
        document.getElementById('mod-inicio').value = m.inicio;
        document.getElementById('mod-fim').value = m.fim;
        document.querySelectorAll('input[name="dia"]').forEach(cb => cb.checked = m.dias.includes(cb.value));
        document.getElementById('btn-salvar-modalidade').innerText = "Salvar Alterações";
    } else if (tipo === 'user') {
        const u = usuarios[index];
        abrirModal('usuario');
        document.getElementById('edit-user-index').value = index;
        document.getElementById('new-user-nome').value = u.nome;
        document.getElementById('new-user-login').value = u.login;
        document.getElementById('new-user-pass').value = u.pass;
        document.getElementById('btn-user-save').innerText = "Salvar Alterações";
    }
}

function removerGeral(tipo, index) {
    if (tipo === 'user' && !validarAdmin()) return;
    if(!confirm("Tem certeza que deseja excluir?")) return;
    if(tipo === 'aluno') alunos.splice(index, 1);
    else if(tipo === 'prof') professores.splice(index, 1);
    else if(tipo === 'mod') modalidades.splice(index, 1);
    else if(tipo === 'user') usuarios.splice(index, 1);
    saveAll(); renderBuscaGeral();
}

function saveAll() {
    localStorage.setItem('alunos', JSON.stringify(alunos));
    localStorage.setItem('professores', JSON.stringify(professores));
    localStorage.setItem('modalidades', JSON.stringify(modalidades));
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

// --- MODAIS ---
function abrirModal(id) {
    if (id === 'usuario' && !validarAdmin()) return;
    document.getElementById('modal-' + id).classList.add('active');
    if (id === 'aluno') {
        preencherSelectsAluno();
        document.getElementById('form-aluno').reset();
        document.getElementById('edit-aluno-index').value = "-1";
        document.getElementById('preview-aluno').innerHTML = '<i data-lucide="camera"></i>';
        document.getElementById('btn-aluno-save').innerText = "Salvar Registro";
        lucide.createIcons();
    }
    if (id === 'acesso') renderAcessos();
}

function fecharModal(id) { 
    document.getElementById('modal-' + id).classList.remove('active'); 
}

function preencherSelectsAluno() {
    const sMod = document.getElementById('aluno-modalidade');
    const sProf = document.getElementById('aluno-professor');
    sMod.innerHTML = modalidades.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('');
    sProf.innerHTML = professores.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
}

function calcularIMC() {
    const peso = parseFloat(document.getElementById('aluno-peso').value);
    const altura = parseFloat(document.getElementById('aluno-altura').value);
    const fieldIMC = document.getElementById('aluno-imc');
    if (peso > 0 && altura > 0) {
        fieldIMC.value = (peso / (altura * altura)).toFixed(2);
    } else { fieldIMC.value = ""; }
}

// --- SALVAMENTO ---
document.getElementById('form-aluno').onsubmit = function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('edit-aluno-index').value);
    const dados = {
        nome: document.getElementById('aluno-nome').value,
        nascimento: document.getElementById('aluno-nascimento').value,
        contato: document.getElementById('aluno-contato').value,
        endereco: document.getElementById('aluno-endereco').value,
        modalidade: document.getElementById('aluno-modalidade').value,
        professor: document.getElementById('aluno-professor').value,
        peso: document.getElementById('aluno-peso').value,
        altura: document.getElementById('aluno-altura').value,
        imc: document.getElementById('aluno-imc').value,
        cintura: document.getElementById('aluno-cintura').value,
        torax: document.getElementById('aluno-torax').value,
        quadril: document.getElementById('aluno-quadril').value,
        obs: document.getElementById('aluno-obs').value,
        foto: document.querySelector('#preview-aluno img')?.src || null
    };
    if(index === -1) alunos.push(dados); else alunos[index] = dados;
    saveAll(); fecharModal('aluno');
    if(document.getElementById('screen-dados').style.display === 'block') renderBuscaGeral();
};

document.getElementById('form-professor').onsubmit = function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('edit-prof-index').value);
    const dados = {
        nome: document.getElementById('prof-nome').value,
        cpf: document.getElementById('prof-cpf').value,
        contato: document.getElementById('prof-contato').value,
        foto: document.querySelector('#preview-professor img')?.src || null
    };
    if(index === -1) professores.push(dados); else professores[index] = dados;
    saveAll(); fecharModal('professor');
};

document.getElementById('form-usuario').onsubmit = function(e) {
    e.preventDefault();
    if (!validarAdmin()) return;
    const index = parseInt(document.getElementById('edit-user-index').value);
    const dados = {
        nome: document.getElementById('new-user-nome').value,
        login: document.getElementById('new-user-login').value,
        pass: document.getElementById('new-user-pass').value
    };
    if(index === -1) {
        if (usuarios.some(u => u.login === dados.login)) return alert("Login já existe!");
        usuarios.push(dados);
    } else { usuarios[index] = dados; }
    saveAll(); fecharModal('usuario');
};

document.getElementById('form-modalidade').onsubmit = function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('mod-index').value);
    const diasSel = Array.from(document.querySelectorAll('input[name="dia"]:checked')).map(el => el.value);
    const dados = {
        nome: document.getElementById('mod-nome').value,
        professor: document.getElementById('mod-professor').value,
        dias: diasSel,
        inicio: document.getElementById('mod-inicio').value,
        fim: document.getElementById('mod-fim').value
    };
    if (index === -1) modalidades.push(dados); else modalidades[index] = dados;
    saveAll(); fecharModal('modalidades');
};

// --- UTILITÁRIOS ---
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => document.getElementById(previewId).innerHTML = `<img src="${e.target.result}">`;
        reader.readAsDataURL(input.files[0]);
    }
}

function preencherFiltros(tela) {
    const prefix = tela === 'chamada' ? 'filtro' : 'rel';
    const optM = '<option value="Todos">Todas Modalidades</option>' + modalidades.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('');
    const sMod = document.getElementById(`${prefix}-modalidade`);
    if(sMod) sMod.innerHTML = optM; 

    const sProf = document.getElementById(`${prefix}-professor`);
    if(sProf) {
        const optP = '<option value="Todos">Todos Professores</option>' + professores.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
        sProf.innerHTML = optP;
    }
}

function logout() { location.reload(); }

window.onclick = e => { 
    if (e.target.classList.contains('modal-overlay')) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }
};

function renderAcessos() {
    const corpo = document.getElementById('tabela-acessos-corpo');
    corpo.innerHTML = usuarios.map((u, index) => `
        <tr><td>${u.nome}</td><td>${u.login}</td><td>${u.login !== 'admin' ? `<button class="btn-delete" onclick="removerGeral('user', ${index})">Excluir</button>` : '---'}</td></tr>
    `).join('');
}

// --- CHAMADA ---
function gerarTabelaChamada() {
    const mesRef = document.getElementById('filtro-mes').value;
    const modF = document.getElementById('filtro-modalidade').value;
    const profF = document.getElementById('filtro-professor').value;
    if(!mesRef) return;
    const [ano, mes] = mesRef.split('-').map(Number);
    const dias = new Date(ano, mes, 0).getDate();
    let h = `<tr><th>Aluno</th>`;
    for(let i=1; i<=dias; i++) h += `<th>${i}</th>`;
    document.getElementById('head-chamada').innerHTML = h + `</tr>`;
    const filtrados = alunos.filter(a => (modF === "Todos" || a.modalidade === modF) && (profF === "Todos" || a.professor === profF));
    document.getElementById('body-chamada').innerHTML = filtrados.map(aluno => {
        let r = `<tr><td>${aluno.nome}</td>`;
        for(let d=1; d<=dias; d++) {
            const k = `${aluno.nome}_${ano}_${mes}_${d}`;
            r += `<td><input type="checkbox" ${presencas[k]?'checked':''} onchange="marcarPresenca('${k}', this.checked)"></td>`;
        }
        return r + `</tr>`;
    }).join('');
}

function marcarPresenca(k, s) {
    if(s) presencas[k] = true; else delete presencas[k];
    localStorage.setItem('presencas', JSON.stringify(presencas));
}

function gerarRelatorio(tipo) {
    const body = document.getElementById('body-relatorio');
    const head = document.getElementById('head-relatorio');
    const info = document.getElementById('info-relatorio');
    if (tipo === 'geral') {
        info.innerText = "Lista Geral de Alunos";
        head.innerHTML = "<th>Nome</th><th>Modalidade</th><th>Contato</th>";
        body.innerHTML = alunos.map(a => `<tr><td>${a.nome}</td><td>${a.modalidade}</td><td>${a.contato}</td></tr>`).join('');
    } else {
        const mesRef = document.getElementById('rel-mes').value;
        const modF = document.getElementById('rel-modalidade').value;
        if(!mesRef) return alert("Selecione um mês");
        const [ano, mes] = mesRef.split('-').map(Number);
        const dias = new Date(ano, mes, 0).getDate();
        info.innerText = `Frequência de ${mes}/${ano} - ${modF}`;
        head.innerHTML = "<th>Aluno</th><th>Presenças</th><th>%</th>";
        const filtrados = alunos.filter(a => (modF === "Todos" || a.modalidade === modF));
        body.innerHTML = filtrados.map(aluno => {
            let pCount = 0;
            for(let d=1; d<=dias; d++) if(presencas[`${aluno.nome}_${ano}_${mes}_${d}`]) pCount++;
            return `<tr><td>${aluno.nome}</td><td>${pCount}</td><td>${((pCount/dias)*100).toFixed(0)}%</td></tr>`;
        }).join('');
    }
}

// --- FUNÇÃO DE IMPORTAÇÃO (NOVA) ---
async function importarDados() {
    const url = document.getElementById('link-planilha').value;
    if (!url) return alert("Por favor, insira o link do CSV.");

    try {
        const response = await fetch(url);
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Ignora o cabeçalho

        let novosAlunos = 0;
        rows.forEach(row => {
            const cols = row.split(',').map(c => c.trim());
            if (cols.length >= 6 && cols[0] !== "") {
                const aluno = {
                    nome: cols[0],
                    nascimento: cols[1],
                    contato: cols[2],
                    endereco: cols[3],
                    modalidade: cols[4],
                    professor: cols[5],
                    foto: null
                };
                // Verifica se já existe para não duplicar exatamente igual
                if (!alunos.some(a => a.nome === aluno.nome)) {
                    alunos.push(aluno);
                    novosAlunos++;
                }
            }
        });

        saveAll();
        renderBuscaGeral();
        alert(`Importação concluída! ${novosAlunos} novos alunos adicionados.`);
        document.getElementById('link-planilha').value = "";
    } catch (error) {
        console.error(error);
        alert("Erro ao importar dados. Verifique se o link está correto e se a planilha está pública como CSV.");
    }
}