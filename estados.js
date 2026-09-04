import { renderizarTarefas } from './renderizacao.js';

export function renderizarEstado(estado, dados) {
  const quadro = document.getElementById('quadro');
  const status = document.getElementById('status');

  if (!quadro || !status) return;

  switch (estado) {
    case 'carregando':
      quadro.hidden = true;
      status.textContent = 'Carregando tarefas...';
      break;

    case 'sucesso': {
      renderizarTarefas(dados);
      quadro.hidden = false;
      const quantidade = dados.length;
      status.textContent = quantidade === 1
        ? '1 tarefa carregada.'
        : `${quantidade} tarefas carregadas.`;
      break;
    }

    case 'vazio':
      quadro.hidden = true;
      status.textContent = 'Nenhuma tarefa encontrada.';
      break;

    case 'erro':
      quadro.hidden = true;
      status.textContent = dados || 'Não foi possível carregar as tarefas.';
      break;

    default:
      break;
  }
}
