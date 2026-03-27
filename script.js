lucide.createIcons();

let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [{ nome: "Administrador", login: "admin", pass: "123" }];
let modalidades = JSON.parse(localStorage.getItem('modalidades')) || [];
let alunos = JSON.parse(localStorage.getItem('alunos')) || [];
let professores = JSON.parse(localStorage.getItem('professores')) || [];
let presencas = JSON.parse(localStorage.getItem('presencas')) || {};

let usuarioLogado = null;
let streamCamera = null;

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

function validarAdmin() {
    if (!usuarioLogado || usuarioLogado.login !== 'admin') {
        alert("Acesso Negado: Apenas o Administrador pode realizar esta ação.");
        return false;
    }
    return true;
}

// --- CONTROLE DE CÂMERA ---
async function iniciarCamera(tipo) {
    const wrapper = document.getElementById(`camera-wrapper-${tipo}`);
    const video = document.getElementById(`video-${tipo}`);
    try {
        streamCamera = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = streamCamera;
        wrapper.style.display = 'block';
        lucide.createIcons();
    } catch (err) { alert("Não foi possível acessar a câmera."); }
}

function capturarFoto(tipo) {
    const video = document.getElementById(`video-${tipo}`);
    const previewId = tipo === 'aluno' ? 'preview-aluno' : 'preview-professor';
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    document.getElementById(previewId).innerHTML = `<img src="${dataUrl}">`;
    pararCamera(tipo);
}

function pararCamera(tipo) {
    if (streamCamera) { streamCamera.getTracks().forEach(track => track.stop()); streamCamera = null; }
    const wrapper = document.getElementById(`camera-wrapper-${tipo}`);
    if(wrapper) wrapper.style.display = 'none';
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
    const titulos = { 'home': 'Painel Administrativo', 'chamada': 'Controle de Frequência', 'relatorios': 'Relatórios e Documentos', 'dados': 'Consulta de Dados Cadastrados' };
    document.getElementById('page-title').innerText = titulos[tela];
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
}

// --- MODAIS ---
function abrirModal(id) {
    if (id === 'usuario' && !validarAdmin()) return;
    document.getElementById('modal-' + id).classList.add('active');
    if (id === 'aluno') {
        preencherSelectsAluno(); document.getElementById('form-aluno').reset();
        document.getElementById('edit-aluno-index').value = "-1";
        document.getElementById('preview-aluno').innerHTML = '<i data-lucide="camera"></i>';
        document.getElementById('btn-aluno-save').innerText = "Salvar Registro";
        document.getElementById('imc-needle').style.transform = `rotate(-90deg)`;
        pararCamera('aluno'); lucide.createIcons();
    }
    if (id === 'professor') {
        document.getElementById('form-professor').reset();
        document.getElementById('edit-prof-index').value = "-1";
        document.getElementById('preview-professor').innerHTML = '<i data-lucide="camera"></i>';
        document.getElementById('btn-prof-save').innerText = "Salvar Professor";
        pararCamera('prof'); lucide.createIcons();
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

// --- CALCULO IMC E VELOCIMETRO ---
function calcularIMC() {
    const peso = parseFloat(document.getElementById('aluno-peso').value);
    const altura = parseFloat(document.getElementById('aluno-altura').value);
    const fieldIMC = document.getElementById('aluno-imc');
    const needle = document.getElementById('imc-needle');
    if (peso > 0 && altura > 0) {
        const imc = peso / (altura * altura); fieldIMC.value = imc.toFixed(2);
        let deg = -90;
        if (imc < 18.5) deg = -90 + (imc / 18.5) * 27; 
        else if (imc < 25) deg = -63 + ((imc - 18.5) / 6.5) * 54;
        else if (imc < 30) deg = -9 + ((imc - 25) / 5) * 54;
        else deg = 45 + Math.min(((imc - 30) / 10) * 45, 45);
        needle.style.transform = `rotate(${deg}deg)`;
    } else { fieldIMC.value = ""; needle.style.transform = `rotate(-90deg)`; }
}

// --- FUNÇÃO ATUALIZADA: GERAR DIETA EM PDF COM REFEIÇÕES ---
function gerarArquivoDieta() {
    const nome = document.getElementById('aluno-nome').value || "Aluno";
    const imc = parseFloat(document.getElementById('aluno-imc').value);
    const peso = document.getElementById('aluno-peso').value;
    const altura = document.getElementById('aluno-altura').value;

    if (isNaN(imc)) { alert("Preencha Peso e Altura para o cálculo do IMC."); return; }

    let info = { cat: "", cafe: "", lancheM: "", almoco: "", lancheT: "", jantar: "", obs: "" };

    if (imc < 18.5) {
        info.cat = "Abaixo do Peso (Foco: Hipertrofia/Ganho)";
        info.cafe = "Vitamina de banana com aveia e pasta de amendoim + 2 ovos mexidos.";
        info.lancheM = "Mix de castanhas e uma fruta (maçã ou pera).";
        info.almoco = "Arroz, feijão, 150g de carne vermelha ou frango, salada e azeite.";
        info.lancheT = "Sanduíche natural de frango com pão integral.";
        info.jantar = "Macarrão integral com patinho moído e legumes no vapor.";
        info.obs = "Aumente o aporte calórico com gorduras boas.";
    } else if (imc < 25) {
        info.cat = "Peso Normal (Foco: Manutenção e Performance)";
        info.cafe = "Café sem açúcar, pão integral com queijo branco e uma fruta.";
        info.lancheM = "Iogurte natural com granola sem açúcar.";
        info.almoco = "Arroz integral (2 colheres), peito de frango grelhado e muita salada verde.";
        info.lancheT = "Uma fruta e 3 castanhas-do-pará.";
        info.jantar = "Omelete com 3 ovos e espinafre + salada de tomate.";
        info.obs = "Mantenha a hidratação: 35ml de água por kg de peso.";
    } else if (imc < 30) {
        info.cat = "Sobrepeso (Foco: Definição/Redução Gradual)";
        info.cafe = "Café ou chá, 2 ovos cozidos e 1 fatia de mamão.";
        info.lancheM = "1/2 abacate pequeno (sem açúcar).";
        info.almoco = "Proteína magra (peixe ou frango), legumes variados e pouca fonte de carboidrato.";
        info.lancheT = "Iogurte desnatado ou chá verde com torradas integrais.";
        info.jantar = "Sopa de legumes com frango desfiado (sem macarrão/batata).";
        info.obs = "Evite ultraprocessados e doces durante a semana.";
    } else {
        info.cat = "Obesidade (Foco: Reeducação e Déficit Calórico)";
        info.cafe = "Suco detox (couve/limão), 1 ovo cozido.";
        info.lancheM = "Uma maçã.";
        info.almoco = "Salada de folhas à vontade, 120g de proteína magra e brócolis.";
        info.lancheT = "Chá de hibisco e 2 fatias de queijo ricota.";
        info.jantar = "Filé de frango grelhado e mix de folhas.";
        info.obs = "Caminhadas leves de 30 min são fundamentais para iniciar.";
    }

    const htmlContent = `
        <div style="margin-top:20px;">
            <p><strong>ALUNO(A):</strong> ${nome.toUpperCase()}</p>
            <p><strong>PESO:</strong> ${peso}kg | <strong>ALTURA:</strong> ${altura}m | <strong>IMC:</strong> ${imc.toFixed(2)}</p>
            <p><strong>CLASSIFICAÇÃO:</strong> <span style="color:#3b82f6;">${info.cat}</span></p>
            
            <h3 style="background:#f1f5f9; padding:8px; border-left:5px solid #3b82f6; margin-top:25px;">SUGESTÃO DE CARDÁPIO DIÁRIO</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                <tr><td style="padding:10px; border:1px solid #ddd;"><strong>Café da Manhã</strong></td><td style="padding:10px; border:1px solid #ddd;">${info.cafe}</td></tr>
                <tr><td style="padding:10px; border:1px solid #ddd;"><strong>Lanche da Manhã</strong></td><td style="padding:10px; border:1px solid #ddd;">${info.lancheM}</td></tr>
                <tr><td style="padding:10px; border:1px solid #ddd;"><strong>Almoço</strong></td><td style="padding:10px; border:1px solid #ddd;">${info.almoco}</td></tr>
                <tr><td style="padding:10px; border:1px solid #ddd;"><strong>Lanche da Tarde</strong></td><td style="padding:10px; border:1px solid #ddd;">${info.lancheT}</td></tr>
                <tr><td style="padding:10px; border:1px solid #ddd;"><strong>Jantar</strong></td><td style="padding:10px; border:1px solid #ddd;">${info.jantar}</td></tr>
            </table>

            <h3 style="background:#f1f5f9; padding:8px; border-left:5px solid #10b981; margin-top:25px;">ORIENTAÇÕES GERAIS</h3>
            <p style="padding:10px; font-style:italic;">${info.obs}</p>
            <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
    `;

    document.getElementById('pdf-corpo').innerHTML = htmlContent;
    const element = document.getElementById('template-pdf');
    element.style.display = 'block';

    const opt = {
        margin: 10,
        filename: `Dieta_${nome.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
    });
}

// --- SALVAMENTO E OUTROS MÉTODOS MANTIDOS ---
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
    if(document.getElementById('screen-dados').style.display === 'block') renderBuscaGeral();
};

document.getElementById('form-usuario').onsubmit = function(e) {
    e.preventDefault();
    if (!validarAdmin()) return;
    const index = parseInt(document.getElementById('edit-user-index').value);
    const dados = { nome: document.getElementById('new-user-nome').value, login: document.getElementById('new-user-login').value, pass: document.getElementById('new-user-pass').value };
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
    const dados = { nome: document.getElementById('mod-nome').value, professor: document.getElementById('mod-professor').value, dias: diasSel, inicio: document.getElementById('mod-inicio').value, fim: document.getElementById('mod-fim').value };
    if (index === -1) modalidades.push(dados); else modalidades[index] = dados;
    saveAll(); fecharModal('modalidades');
};

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

window.onclick = e => { if (e.target.classList.contains('modal-overlay')) fecharModal(e.target.id.split('-')[1]); };

function renderAcessos() {
    const corpo = document.getElementById('tabela-acessos-corpo');
    corpo.innerHTML = usuarios.map((u, index) => `
        <tr><td>${u.nome}</td><td>${u.login}</td><td>${u.login !== 'admin' ? `<button class="btn-delete" onclick="removerGeral('user', ${index})">Excluir</button>` : '---'}</td></tr>
    `).join('');
}

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

async function importarDados() {
    const url = document.getElementById('link-planilha').value;
    if (!url) return alert("Por favor, insira o link do CSV.");
    try {
        const response = await fetch(url);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        let novosAlunos = 0;
        rows.forEach(row => {
            const cols = row.split(',').map(c => c.trim());
            if (cols.length >= 6 && cols[0] !== "") {
                const aluno = { nome: cols[0], nascimento: cols[1], contato: cols[2], endereco: cols[3], modalidade: cols[4], professor: cols[5], foto: null };
                if (!alunos.some(a => a.nome === aluno.nome)) { alunos.push(aluno); novosAlunos++; }
            }
        });
        saveAll(); renderBuscaGeral();
        alert(`Importação concluída! ${novosAlunos} novos alunos.`);
        document.getElementById('link-planilha').value = "";
    } catch (error) { alert("Erro ao importar dados."); }
}