import { renderizarTarefas } from './renderizacao.js';

export function renderizarEstado(estado, tarefasVisiveis) {
  const quadro = document.getElementById('quadro');
  const status = document.getElementById('status');

  if (!quadro || !status) return;

  if (estado.carregamento === 'carregando') {
    quadro.hidden = true;
    status.textContent = 'Carregando tarefas...';
    return;
  }

  if (estado.carregamento === 'erro') {
    quadro.hidden = true;
    status.textContent = estado.erro || 'Não foi possível carregar as tarefas.';
    return;
  }

  if (estado.tarefas.length === 0) {
    quadro.hidden = true;
    status.textContent = 'Nenhuma tarefa cadastrada na origem.';
    return;
  }

  renderizarTarefas(tarefasVisiveis);
  quadro.hidden = false;

  if (tarefasVisiveis.length === 0) {
    status.textContent = 'Nenhuma tarefa encontrada para os critérios selecionados. Altere ou limpe os filtros.';
    return;
  }

  const quantidadeVisivel = tarefasVisiveis.length;
  const quantidadeTotal = estado.tarefas.length;
  const textoTarefa = quantidadeVisivel === 1 ? 'tarefa' : 'tarefas';

  status.textContent = `${quantidadeVisivel} de ${quantidadeTotal} ${textoTarefa}.`;
}
