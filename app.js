import { carregarTarefas } from './api.js';
import { renderizarEstado } from './estados.js';

const estado = {
  tarefas: [],
  busca: '',
  status: 'todos',
  prioridade: 'todas',
  ordenacao: 'prazo-crescente',
  carregamento: 'carregando',
  erro: null,
};

function derivarTarefas(estadoAtual) {
  let tarefasVisiveis = estadoAtual.tarefas.filter((tarefa) => {
    const titulo = tarefa.titulo.toLowerCase();
    const busca = estadoAtual.busca.toLowerCase();
    const statusValido = estadoAtual.status === 'todos'
      || tarefa.status === estadoAtual.status;
    const prioridadeValida = estadoAtual.prioridade === 'todas'
      || tarefa.prioridade.toLowerCase() === estadoAtual.prioridade;

    return titulo.includes(busca) && statusValido && prioridadeValida;
  });

  if (estadoAtual.ordenacao === 'prazo-crescente') {
    tarefasVisiveis.sort((a, b) => compararPrazos(a.prazo, b.prazo));
  }

  if (estadoAtual.ordenacao === 'prazo-decrescente') {
    tarefasVisiveis.sort((a, b) => compararPrazos(b.prazo, a.prazo));
  }

  return tarefasVisiveis;
}

function compararPrazos(prazoA, prazoB) {
  const [diaA, mesA, anoA] = prazoA.split('/').map(Number);
  const [diaB, mesB, anoB] = prazoB.split('/').map(Number);

  const dataA = new Date(anoA, mesA - 1, diaA);
  const dataB = new Date(anoB, mesB - 1, diaB);

  return dataA - dataB;
}

function sincronizarControles() {
  const busca = document.getElementById('busca');
  const ordenacao = document.getElementById('ordenacao');

  if (busca) {
    busca.value = estado.busca;
  }

  if (ordenacao) {
    ordenacao.value = estado.ordenacao;
  }

  document.querySelectorAll('input[name="status"]').forEach((controle) => {
    controle.checked = controle.value === estado.status;
  });

  document.querySelectorAll('input[name="prioridade"]').forEach((controle) => {
    controle.checked = controle.value === estado.prioridade;
  });
}

function renderizarAplicacao() {
  sincronizarControles();

  const tarefasVisiveis = derivarTarefas(estado);
  renderizarEstado(estado, tarefasVisiveis);
}

function configurarControles() {
  const busca = document.getElementById('busca');
  const ordenacao = document.getElementById('ordenacao');
  const limpar = document.getElementById('limpar-filtros');

  if (busca) {
    busca.addEventListener('input', (evento) => {
      estado.busca = evento.target.value;
      renderizarAplicacao();
    });
  }

  document.querySelectorAll('input[name="status"]').forEach((controle) => {
    controle.addEventListener('change', (evento) => {
      estado.status = evento.target.value;
      renderizarAplicacao();
    });
  });

  document.querySelectorAll('input[name="prioridade"]').forEach((controle) => {
    controle.addEventListener('change', (evento) => {
      estado.prioridade = evento.target.value;
      renderizarAplicacao();
    });
  });

  if (ordenacao) {
    ordenacao.addEventListener('change', (evento) => {
      estado.ordenacao = evento.target.value;
      renderizarAplicacao();
    });
  }

  if (limpar) {
    limpar.addEventListener('click', () => {
      estado.busca = '';
      estado.status = 'todos';
      estado.prioridade = 'todas';
      estado.ordenacao = 'prazo-crescente';
      renderizarAplicacao();
    });
  }
}

async function iniciar() {
  configurarControles();

  estado.carregamento = 'carregando';
  estado.erro = null;
  renderizarAplicacao();

  try {
    const tarefas = await carregarTarefas();

    estado.tarefas = tarefas;
    estado.carregamento = 'sucesso';
    estado.erro = null;
    renderizarAplicacao();
  } catch (erro) {
    estado.carregamento = 'erro';
    estado.erro = 'Não foi possível carregar as tarefas.';

    if (erro.name === 'TypeError') {
      estado.erro = 'Falha de rede: verifique sua conexão e tente novamente.';
    } else if (erro.name === 'SyntaxError') {
      estado.erro = 'Os dados recebidos estão em um formato inválido.';
    } else if (erro.name === 'ErroHTTP') {
      estado.erro = `O servidor respondeu com erro (HTTP ${erro.status}).`;
    }

    renderizarAplicacao();
  }
}

iniciar();
