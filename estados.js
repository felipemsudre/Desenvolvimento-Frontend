import { renderizarTarefas } from './renderizacao.js';

export function renderizarEstado(estado, tarefasVisiveis) {
  const quadro = document.getElementById('quadro');
  const status = document.getElementById('status');

  if (!quadro || !status) return;

  if (estado.carregamento === 'carregando') {
    quadro.hidden = true;
    status.textContent = 'CONNECTING TO MISSION DATABASE...';
    return;
  }

  if (estado.carregamento === 'erro') {
    quadro.hidden = true;
    status.textContent = estado.erro || 'DATABASE CONNECTION FAILED.';
    return;
  }

  if (estado.tarefas.length === 0) {
    quadro.hidden = true;
    status.textContent = 'NO MISSIONS REGISTERED IN THE DATABASE.';
    return;
  }

  renderizarTarefas(tarefasVisiveis);
  quadro.hidden = false;

  const resultCount = document.getElementById('result-count');
  if (resultCount) {
    resultCount.textContent = `${tarefasVisiveis.length} / ${estado.tarefas.length} MISSIONS`;
  }

  if (tarefasVisiveis.length === 0) {
    status.textContent = 'RADAR CLEAR. NO MISSION MATCHES THESE PARAMETERS.';
    return;
  }

  status.textContent = `RADAR LOCKED // ${tarefasVisiveis.length} MISSION(S) DETECTED.`;

  atualizarMetricas(estado.tarefas);
}

function atualizarMetricas(tarefas) {
  const total = document.getElementById('metric-total');
  const active = document.getElementById('metric-active');
  const completed = document.getElementById('metric-completed');

  const quantidadeAtiva = tarefas.filter((tarefa) =>
    tarefa.status === 'andamento' || tarefa.status === 'revisao'
  ).length;

  const quantidadeConcluida = tarefas.filter((tarefa) =>
    tarefa.status === 'concluida'
  ).length;

  if (total) total.textContent = String(tarefas.length).padStart(2, '0');
  if (active) active.textContent = String(quantidadeAtiva).padStart(2, '0');
  if (completed) completed.textContent = String(quantidadeConcluida).padStart(2, '0');
}
