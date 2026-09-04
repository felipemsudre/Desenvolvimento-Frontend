import { carregarTarefas } from './api.js';
import { renderizarEstado } from './estados.js';

async function iniciar() {
  renderizarEstado('carregando');

  try {
    const tarefas = await carregarTarefas();

    if (tarefas.length === 0) {
      renderizarEstado('vazio');
      return;
    }

    renderizarEstado('sucesso', tarefas);
  } catch (erro) {
    let mensagem = 'Não foi possível carregar as tarefas.';

    if (erro.name === 'TypeError') {
      mensagem = 'Falha de rede: verifique sua conexão e tente novamente.';
    } else if (erro.name === 'SyntaxError') {
      mensagem = 'Os dados recebidos estão em um formato inválido.';
    } else if (erro.name === 'ErroHTTP') {
      mensagem = `O servidor respondeu com erro (HTTP ${erro.status}).`;
    }

    renderizarEstado('erro', mensagem);
  }
}

iniciar();
