const LISTAS_POR_STATUS = {
  'a-fazer': 'lista-a-fazer',
  'andamento': 'lista-andamento',
  'revisao': 'lista-revisao',
  'concluida': 'lista-concluida',
};

function criarCartao(tarefa) {
  const li = document.createElement('li');
  const article = document.createElement('article');

  const titulo = document.createElement('h3');
  titulo.textContent = tarefa.titulo;
  titulo.title = tarefa.titulo;

  const prazo = document.createElement('p');
  prazo.textContent = `Prazo: ${tarefa.prazo}`;

  const prioridade = document.createElement('p');
  prioridade.textContent = `Prioridade: ${tarefa.prioridade}`;

  article.append(titulo, prazo, prioridade);
  li.append(article);
  return li;
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
