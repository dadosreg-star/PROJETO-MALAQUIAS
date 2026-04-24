lucide.createIcons();

let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [{ nome: "Administrador", login: "admin", pass: "123" }];
let modalidades = JSON.parse(localStorage.getItem('modalidades')) || [];
let alunos = JSON.parse(localStorage.getItem('alunos')) || [];
let professores = JSON.parse(localStorage.getItem('professores')) || [];
let presencas = JSON.parse(localStorage.getItem('presencas')) || {};
let avaliacoes = JSON.parse(localStorage.getItem('avaliacoes')) || [];

let usuarioLogado = null;
let streamCamera = null;
let myChart = null; 
let facingMode = "user"; // "user" para frontal, "environment" para traseira

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
        if(document.getElementById('filtro-mes')) document.getElementById('filtro-mes').value = hoje;
        if(document.getElementById('rel-mes')) document.getElementById('rel-mes').value = hoje;
    } else { alert("Usuário ou senha inválidos."); }
}

function logout() {
    usuarioLogado = null;
    document.getElementById('main-dashboard').classList.remove('active');
    document.getElementById('login-container').classList.add('active');
}

function validarAdmin() {
    if (!usuarioLogado || usuarioLogado.login !== 'admin') {
        alert("Acesso Negado: Apenas o Administrador pode realizar esta ação.");
        return false;
    }
    return true;
}

// --- CONTROLE DE CÂMERA MELHORADO ---
async function iniciarCamera(tipo) {
    const wrapper = document.getElementById(`camera-wrapper-${tipo}`);
    const video = document.getElementById(`video-${tipo}`);
    
    // Se já estiver rodando, para antes de trocar
    if (streamCamera) {
        streamCamera.getTracks().forEach(track => track.stop());
    }

    try {
        streamCamera = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facingMode }, 
            audio: false 
        });
        video.srcObject = streamCamera;
        wrapper.style.display = 'block';
        lucide.createIcons();
    } catch (err) { 
        alert("Não foi possível acessar a câmera. Verifique as permissões."); 
    }
}

async function alternarCamera(tipo) {
    facingMode = (facingMode === "user") ? "environment" : "user";
    await iniciarCamera(tipo);
}

function capturarFoto(tipo) {
    const video = document.getElementById(`video-${tipo}`);
    const previewId = tipo === 'aluno' ? 'preview-aluno' : 'preview-professor';
    const canvas = document.createElement('canvas');
    
    // Captura na resolução real do vídeo
    canvas.width = video.videoWidth; 
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    
    // Se estiver usando a frontal, espelha a imagem para ficar natural
    if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    document.getElementById(previewId).innerHTML = `<img src="${dataUrl}">`;
    pararCamera(tipo);
}

function pararCamera(tipo) {
    if (streamCamera) { 
        streamCamera.getTracks().forEach(track => track.stop()); 
        streamCamera = null; 
    }
    const wrapper = document.getElementById(`camera-wrapper-${tipo}`);
    if(wrapper) wrapper.style.display = 'none';
}

function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).innerHTML = `<img src="${e.target.result}">`;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// --- NAVEGAÇÃO ---
function irPara(tela) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('screen-' + tela).style.display = 'block';
    const navBtn = document.getElementById('nav-' + tela);
    if(navBtn) navBtn.classList.add('active');
    
    if(tela !== 'avaliacao') fecharGrafico();
    if(tela === 'chamada' || tela === 'relatorios') preencherFiltros(tela);
    if(tela === 'dados') renderBuscaGeral();
    if(tela === 'avaliacao') renderBuscaAvaliacao();

    const titulos = { 
        'home': 'Painel Administrativo', 
        'chamada': 'Controle de Frequência', 
        'relatorios': 'Relatórios e Documentos', 
        'dados': 'Consulta de Dados Cadastrados',
        'avaliacao': 'Avaliação Física de Alunos'
    };
    document.getElementById('page-title').innerText = titulos[tela];
}

// --- BUSCA AVALIAÇÃO ---
function renderBuscaAvaliacao() {
    const term = document.getElementById('input-busca-avaliacao').value.toLowerCase();
    const body = document.getElementById('body-busca-avaliacao');
    const filtrados = alunos.filter(a => a.nome.toLowerCase().includes(term));
    
    body.innerHTML = filtrados.map(a => `
        <tr>
            <td>${a.nome}</td>
            <td>${a.modalidade}</td>
            <td style="display:flex; gap:5px;">
                <button class="btn-edit" onclick="prepararAvaliacao(${alunos.indexOf(a)})">Avaliar</button>
                <button class="btn-edit" style="background:#818cf8;" onclick="mostrarEvolucao('${a.nome}')">Gráfico</button>
            </td>
        </tr>
    `).join('');
}

function prepararAvaliacao(index) {
    const a = alunos[index];
    abrirModal('fichas');
    document.getElementById('av-aluno-index').value = index;
    document.getElementById('av-aluno-nome').value = a.nome;
    document.getElementById('av-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('av-peso').value = a.peso || '';
    document.getElementById('av-cintura').value = a.cintura || '';
    document.getElementById('av-torax').value = a.torax || '';
    document.getElementById('av-quadril').value = a.quadril || '';
    document.getElementById('av-obs').value = '';
}

document.getElementById('form-avaliacao').onsubmit = function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('av-aluno-index').value);
    const aluno = alunos[index];
    const peso = parseFloat(document.getElementById('av-peso').value);
    const altura = parseFloat(aluno.altura);
    const imc = (peso && altura) ? (peso / (altura * altura)).toFixed(2) : 0;

    const novaAvaliacao = {
        alunoNome: aluno.nome,
        data: document.getElementById('av-data').value,
        peso: peso,
        imc: imc,
        cintura: document.getElementById('av-cintura').value,
        torax: document.getElementById('av-torax').value,
        quadril: document.getElementById('av-quadril').value,
        obs: document.getElementById('av-obs').value
    };
    
    alunos[index].peso = novaAvaliacao.peso;
    alunos[index].imc = imc;
    alunos[index].cintura = novaAvaliacao.cintura;
    alunos[index].torax = novaAvaliacao.torax;
    alunos[index].quadril = novaAvaliacao.quadril;

    avaliacoes.push(novaAvaliacao);
    saveAll();
    alert("Avaliação salva com sucesso!");
    fecharModal('fichas');
    if(document.getElementById('container-grafico-evolucao').style.display === 'block') {
        mostrarEvolucao(aluno.nome);
    }
};

// --- GRÁFICO ---
function mostrarEvolucao(nomeAluno) {
    const dadosAluno = avaliacoes.filter(av => av.alunoNome === nomeAluno).sort((a, b) => new Date(a.data) - new Date(b.data));
    if (dadosAluno.length === 0) { alert("Nenhuma avaliação registrada."); return; }

    document.getElementById('container-grafico-evolucao').style.display = 'block';
    document.getElementById('nome-aluno-grafico').innerText = nomeAluno;

    const labels = dadosAluno.map(av => new Date(av.data).toLocaleDateString('pt-BR'));
    const pesos = dadosAluno.map(av => av.peso);
    const imcs = dadosAluno.map(av => av.imc);

    const ctx = document.getElementById('chartEvolucao').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Peso (kg)', data: pesos, borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.2)', tension: 0.4, fill: true, yAxisID: 'y' },
                { label: 'IMC', data: imcs, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.2)', tension: 0.4, fill: true, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', ticks: { color: '#f8fafc' } },
                y1: { type: 'linear', display: true, position: 'right', ticks: { color: '#f8fafc' }, grid: { drawOnChartArea: false } },
                x: { ticks: { color: '#f8fafc' } }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } }
        }
    });
}

function fecharGrafico() {
    document.getElementById('container-grafico-evolucao').style.display = 'none';
    if(myChart) { myChart.destroy(); myChart = null; }
}

// --- BUSCA GERAL ---
function renderBuscaGeral() {
    const cat = document.getElementById('busca-categoria').value;
    const term = document.getElementById('input-busca-geral').value.toLowerCase();
    const head = document.getElementById('head-busca-geral');
    const body = document.getElementById('body-busca-geral');
    let htmlHead = ""; let htmlBody = "";

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
    head.innerHTML = htmlHead; body.innerHTML = htmlBody;
}

// --- EDIÇÃO E REMOÇÃO ---
function editarGeral(tipo, index) {
    if (tipo === 'user' && !validarAdmin()) return;
    if(tipo === 'aluno') {
        const a = alunos[index]; abrirModal('aluno');
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
        setTimeout(calcularIMC, 100);
    } else if (tipo === 'prof') {
        const p = professores[index]; abrirModal('professor');
        document.getElementById('edit-prof-index').value = index;
        document.getElementById('prof-nome').value = p.nome;
        document.getElementById('prof-cpf').value = p.cpf;
        document.getElementById('prof-contato').value = p.contato;
        if(p.foto) document.getElementById('preview-professor').innerHTML = `<img src="${p.foto}">`;
        document.getElementById('btn-prof-save').innerText = "Salvar Alterações";
    } else if (tipo === 'mod') {
        const m = modalidades[index]; abrirModal('modalidades');
        document.getElementById('mod-index').value = index;
        document.getElementById('mod-nome').value = m.nome;
        document.getElementById('mod-professor').value = m.professor;
        document.getElementById('mod-inicio').value = m.inicio;
        document.getElementById('mod-fim').value = m.fim;
        document.querySelectorAll('input[name="dia"]').forEach(cb => cb.checked = m.dias.includes(cb.value));
        document.getElementById('btn-salvar-modalidade').innerText = "Salvar Alterações";
    } else if (tipo === 'user') {
        const u = usuarios[index]; abrirModal('usuario');
        document.getElementById('edit-user-index').value = index;
        document.getElementById('new-user-nome').value = u.nome;
        document.getElementById('new-user-login').value = u.login;
        document.getElementById('new-user-pass').value = u.pass;
        document.getElementById('btn-user-save').innerText = "Salvar Alterações";
    }
}

function removerGeral(tipo, index) {
    if (tipo === 'user' && !validarAdmin()) return;
    if(!confirm("Deseja excluir?")) return;
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
    localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));
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
        document.getElementById('imc-needle').style.transform = `rotate(-90deg)`;
        pararCamera('aluno');
        lucide.createIcons();
    }
    if (id === 'professor') {
        document.getElementById('form-professor').reset();
        document.getElementById('edit-prof-index').value = "-1";
        document.getElementById('preview-professor').innerHTML = '<i data-lucide="camera"></i>';
        document.getElementById('btn-prof-save').innerText = "Salvar Professor";
        pararCamera('prof');
        lucide.createIcons();
    }
    if (id === 'acesso') renderAcessos();
}

function fecharModal(id) {
    document.getElementById('modal-' + id).classList.remove('active');
    if(id === 'aluno') pararCamera('aluno');
    if(id === 'professor') pararCamera('prof');
}

function preencherSelectsAluno() {
    const sMod = document.getElementById('aluno-modalidade');
    const sProf = document.getElementById('aluno-professor');
    sMod.innerHTML = modalidades.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('');
    sProf.innerHTML = professores.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
}

// --- IMC ---
function calcularIMC() {
    const peso = parseFloat(document.getElementById('aluno-peso').value);
    const altura = parseFloat(document.getElementById('aluno-altura').value);
    const fieldIMC = document.getElementById('aluno-imc');
    const needle = document.getElementById('imc-needle');
    if (peso > 0 && altura > 0) {
        const imc = peso / (altura * altura);
        fieldIMC.value = imc.toFixed(2);
        let deg = -90;
        if (imc < 18.5) deg = -90 + (imc / 18.5) * 27;
        else if (imc < 25) deg = -63 + ((imc - 18.5) / 6.5) * 54;
        else if (imc < 30) deg = -9 + ((imc - 25) / 5) * 54;
        else deg = 45 + Math.min(((imc - 30) / 10) * 45, 45);
        needle.style.transform = `rotate(${deg}deg)`;
    } else {
        fieldIMC.value = "";
        needle.style.transform = `rotate(-90deg)`;
    }
}

// --- SUBMITS ---
document.getElementById('form-aluno').onsubmit = function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('edit-aluno-index').value);
    const fotoImg = document.getElementById('preview-aluno').querySelector('img');
    const aluno = {
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
        foto: fotoImg ? fotoImg.src : null
    };
    if(index === -1) alunos.push(aluno); else alunos[index] = aluno;
    saveAll(); fecharModal('aluno'); renderBuscaGeral();
};

document.getElementById('form-professor').onsubmit = function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('edit-prof-index').value);
    const fotoImg = document.getElementById('preview-professor').querySelector('img');
    const prof = {
        nome: document.getElementById('prof-nome').value,
        cpf: document.getElementById('prof-cpf').value,
        contato: document.getElementById('prof-contato').value,
        foto: fotoImg ? fotoImg.src : null
    };
    if(index === -1) professores.push(prof); else professores[index] = prof;
    saveAll(); fecharModal('professor'); renderBuscaGeral();
};

document.getElementById('form-modalidade').onsubmit = function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('mod-index').value);
    const dias = Array.from(document.querySelectorAll('input[name="dia"]:checked')).map(cb => cb.value);
    const mod = {
        nome: document.getElementById('mod-nome').value,
        professor: document.getElementById('mod-professor').value,
        inicio: document.getElementById('mod-inicio').value,
        fim: document.getElementById('mod-fim').value,
        dias: dias
    };
    if(index === -1) modalidades.push(mod); else modalidades[index] = mod;
    saveAll(); fecharModal('modalidades'); renderBuscaGeral();
};

document.getElementById('form-usuario').onsubmit = function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('edit-user-index').value);
    const user = {
        nome: document.getElementById('new-user-nome').value,
        login: document.getElementById('new-user-login').value,
        pass: document.getElementById('new-user-pass').value
    };
    if(index === -1) usuarios.push(user); else usuarios[index] = user;
    saveAll(); fecharModal('usuario'); renderBuscaGeral();
};

// --- CHAMADA ---
function gerarTabelaChamada() {
    const mesVal = document.getElementById('filtro-mes').value;
    const modF = document.getElementById('filtro-modalidade').value;
    if(!mesVal) return;
    const [ano, mes] = mesVal.split('-');
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const head = document.getElementById('head-chamada');
    const body = document.getElementById('body-chamada');
    
    let htmlHead = `<tr><th>Aluno</th>`;
    for(let d=1; d<=diasNoMes; d++) htmlHead += `<th>${d}</th>`;
    htmlHead += `</tr>`;
    head.innerHTML = htmlHead;

    const filtrados = alunos.filter(a => (modF === "Todos" || a.modalidade === modF));
    body.innerHTML = filtrados.map(aluno => {
        let rows = `<tr><td style="text-align:left; min-width:150px;">${aluno.nome}</td>`;
        for(let d=1; d<=diasNoMes; d++) {
            const key = `${aluno.nome}_${ano}_${mes}_${d}`;
            const checked = presencas[key] ? 'checked' : '';
            rows += `<td><input type="checkbox" class="presenca-check" ${checked} onchange="salvarPresenca('${aluno.nome}', ${ano}, '${mes}', ${d}, this.checked)"></td>`;
        }
        rows += `</tr>`;
        return rows;
    }).join('');
}

function salvarPresenca(nome, ano, mes, dia, valor) {
    const key = `${nome}_${ano}_${mes}_${dia}`;
    if(valor) presencas[key] = true; else delete presencas[key];
    localStorage.setItem('presencas', JSON.stringify(presencas));
}

function preencherFiltros(tela) {
    const prefix = tela === 'chamada' ? 'filtro' : 'rel';
    const sMod = document.getElementById(`${prefix}-modalidade`);
    const sProf = document.getElementById(`${prefix}-professor`);
    if(sMod) sMod.innerHTML = `<option value="Todos">Todas Modalidades</option>` + modalidades.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('');
    if(sProf) sProf.innerHTML = `<option value="Todos">Todos Professores</option>` + professores.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
}

// --- RELATÓRIOS ---
function gerarRelatorio(tipo) {
    const body = document.getElementById('body-relatorio');
    const head = document.getElementById('head-relatorio');
    const info = document.getElementById('info-relatorio');
    
    if(tipo === 'geral') {
        info.innerText = "Lista Geral de Alunos Cadastrados";
        head.innerHTML = "<th>Nome</th><th>Modalidade</th><th>Professor</th><th>Contato</th>";
        body.innerHTML = alunos.map(a => `<tr><td>${a.nome}</td><td>${a.modalidade}</td><td>${a.professor}</td><td>${a.contato}</td></tr>`).join('');
    } else if (tipo === 'filtro') {
        const mesVal = document.getElementById('rel-mes').value;
        const modF = document.getElementById('rel-modalidade').value;
        if(!mesVal) return alert("Selecione o mês");
        const [ano, mes] = mesVal.split('-');
        const dias = new Date(ano, mes, 0).getDate();
        info.innerText = `Frequência Mensal - ${mes}/${ano} - Modalidade: ${modF}`;
        head.innerHTML = "<th>Aluno</th><th>Presenças</th><th>%</th>";
        const filtrados = alunos.filter(a => (modF === "Todos" || a.modalidade === modF));
        body.innerHTML = filtrados.map(aluno => {
            let pCount = 0;
            for(let d=1; d<=dias; d++) if(presencas[`${aluno.nome}_${ano}_${mes}_${d}`]) pCount++;
            return `<tr><td>${aluno.nome}</td><td>${pCount}</td><td>${((pCount/dias)*100).toFixed(0)}%</td></tr>`;
        }).join('');
    }
}

async function importarDados() {
    const url = document.getElementById('link-planilha').value;
    if (!url) return alert("Insira o link do CSV.");
    try {
        const response = await fetch(url);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        rows.forEach(row => {
            const cols = row.split(',').map(c => c.trim());
            if (cols.length >= 6 && cols[0] !== "") {
                const aluno = { nome: cols[0], nascimento: cols[1], contato: cols[2], endereco: cols[3], modalidade: cols[4], professor: cols[5], foto: null };
                if (!alunos.some(a => a.nome === aluno.nome)) alunos.push(aluno);
            }
        });
        saveAll(); renderBuscaGeral(); alert("Importação concluída!");
    } catch (e) { alert("Erro ao importar."); }
}

function gerarArquivoDieta() {
    const imc = parseFloat(document.getElementById('aluno-imc').value);
    if(isNaN(imc)) return alert("Calcule o IMC primeiro.");
    // Lógica simplificada de alerta (PDF exigiria biblioteca externa como jsPDF)
    alert("Gerando PDF de sugestão alimentar baseado no IMC: " + imc);
}

// --- FUNÇÕES DE BACKUP (PC <-> CELULAR) ---
function exportarBackup() {
    const dadosCompletos = {
        alunos,
        professores,
        modalidades,
        usuarios,
        avaliacoes,
        presencas
    };
    const blob = new Blob([JSON.stringify(dadosCompletos)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_malaquias_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    a.click();
}

function importarBackup(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importado = JSON.parse(e.target.result);
            if (confirm("Isso substituirá todos os dados atuais por este backup. Continuar?")) {
                alunos = importado.alunos || [];
                professores = importado.professores || [];
                modalidades = importado.modalidades || [];
                usuarios = importado.usuarios || [];
                avaliacoes = importado.avaliacoes || [];
                presencas = importado.presencas || {};
                saveAll();
                alert("Dados restaurados com sucesso! O sistema irá recarregar.");
                location.reload();
            }
        } catch (err) {
            alert("Erro ao ler o arquivo de backup.");
        }
    };
    reader.readAsText(file);
}

window.onload = () => { lucide.createIcons(); };