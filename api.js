class ErroHTTP extends Error {
  constructor(status) {
    super(`O servidor respondeu com status ${status}.`);
    this.name = 'ErroHTTP';
    this.status = status;
  }
}

export async function carregarTarefas() {
  const resposta = await fetch('./dados.json');

  if (!resposta.ok) {
    throw new ErroHTTP(resposta.status);
  }

  const dados = await resposta.json();
  return dados.tarefas;
}
