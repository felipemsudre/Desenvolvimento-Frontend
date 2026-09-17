const LISTAS_POR_STATUS = {
  'a-fazer': 'lista-a-fazer',
  andamento: 'lista-andamento',
  revisao: 'lista-revisao',
  concluida: 'lista-concluida',
};

const CLASSES_POR_PRIORIDADE = {
  baixa: 'priority-low',
  média: 'priority-medium',
  alta: 'priority-high',
};

function criarCartao(tarefa) {
  const li = document.createElement('li');
  const article = document.createElement('article');
  article.className = 'mission-card';

  const topo = document.createElement('div');
  topo.className = 'card-top';

  const codigo = document.createElement('span');
  codigo.className = 'mission-code';
  codigo.textContent = `MISSION // ${String(tarefa.id).padStart(2, '0')}`;

  const prioridade = document.createElement('span');
  prioridade.className = `priority ${CLASSES_POR_PRIORIDADE[tarefa.prioridade.toLowerCase()] || ''}`;
  prioridade.textContent = tarefa.prioridade.toUpperCase();

  topo.append(codigo, prioridade);

  const icone = document.createElement('div');
  icone.className = 'card-icon';
  icone.textContent = '●';

  const titulo = document.createElement('h4');
  titulo.textContent = tarefa.titulo;

  const linha = document.createElement('div');
  linha.className = 'card-line';

  const prazo = document.createElement('div');
  prazo.innerHTML = `<span>DEADLINE</span><strong>${tarefa.prazo}</strong>`;

  const status = document.createElement('div');
  status.innerHTML = `<span>STATUS</span><strong>${nomeStatus(tarefa.status)}</strong>`;

  linha.append(prazo, status);
  article.append(topo, icone, titulo, linha);
  li.append(article);

  return li;
}

function nomeStatus(status) {
  const nomes = {
    'a-fazer': 'TO DO',
    andamento: 'ACTIVE',
    revisao: 'REVIEW',
    concluida: 'DONE',
  };

  return nomes[status] || status.toUpperCase();
}

export function renderizarTarefas(tarefas) {
  const listas = {};

  Object.entries(LISTAS_POR_STATUS).forEach(([status, id]) => {
    const ul = document.getElementById(id);

    if (ul) {
      ul.textContent = '';
      listas[status] = ul;
    }
  });

  tarefas.forEach((tarefa) => {
    const ul = listas[tarefa.status];

    if (!ul) return;

    ul.append(criarCartao(tarefa));
  });
}
