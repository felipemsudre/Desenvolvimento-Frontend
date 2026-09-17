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

let somLigado = false;
let contextoAudio = null;
let pacmanScore = 0;
let missoesComidas = 0;

function derivarTarefas(estadoAtual) {
  let tarefasVisiveis = estadoAtual.tarefas.filter((tarefa) => {
    const titulo = tarefa.titulo.toLowerCase();
    const busca = estadoAtual.busca.toLowerCase();

    const statusValido =
      estadoAtual.status === 'todos' ||
      tarefa.status === estadoAtual.status;

    const prioridadeValida =
      estadoAtual.prioridade === 'todas' ||
      tarefa.prioridade.toLowerCase() === estadoAtual.prioridade;

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

function renderizarAplicacao() {
  const tarefasVisiveis = derivarTarefas(estado);
  renderizarEstado(estado, tarefasVisiveis);
  atualizarNucleoPacman();
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
      tocarSom(480, 0.04);
    });
  });

  document.querySelectorAll('input[name="prioridade"]').forEach((controle) => {
    controle.addEventListener('change', (evento) => {
      estado.prioridade = evento.target.value;
      renderizarAplicacao();
      tocarSom(540, 0.04);
    });
  });

  if (ordenacao) {
    ordenacao.addEventListener('change', (evento) => {
      estado.ordenacao = evento.target.value;
      renderizarAplicacao();
      tocarSom(620, 0.04);
    });
  }

  if (limpar) {
    limpar.addEventListener('click', () => {
      estado.busca = '';
      estado.status = 'todos';
      estado.prioridade = 'todas';
      estado.ordenacao = 'prazo-crescente';

      document.querySelectorAll('input[name="status"]').forEach((input) => {
        input.checked = input.value === 'todos';
      });

      document.querySelectorAll('input[name="prioridade"]').forEach((input) => {
        input.checked = input.value === 'todas';
      });

      if (busca) busca.value = '';
      if (ordenacao) ordenacao.value = 'prazo-crescente';

      renderizarAplicacao();
      tocarSom(240, 0.08);
    });
  }
}

function configurarAtalhos() {
  document.addEventListener('keydown', (evento) => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
      evento.preventDefault();
      const busca = document.getElementById('busca');

      if (busca) {
        busca.focus();
        busca.select();
      }
    }

    if (evento.key === 'Enter' && document.body.classList.contains('booting')) {
      finalizarBoot();
    }
  });
}

function configurarRelogio() {
  const clock = document.getElementById('clock');

  setInterval(() => {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');

    if (clock) clock.textContent = `${horas}:${minutos}:${segundos}`;
  }, 1000);
}

function configurarRadar() {
  const botao = document.getElementById('pulse-button');
  const stage = document.getElementById('maze-stage');
  const radar = document.getElementById('radar-status');

  if (!botao || !stage || !radar) return;

  botao.addEventListener('click', () => {
    stage.classList.remove('radar-pulse');
    void stage.offsetWidth;
    stage.classList.add('radar-pulse');

    radar.textContent = 'RADAR SCANNING...';
    tocarSom(720, 0.07);

    setTimeout(() => {
      radar.textContent = 'TARGETS LOCKED';
    }, 900);

    setTimeout(() => {
      radar.textContent = 'RADAR STANDBY';
    }, 2200);
  });
}

function configurarMouse() {
  const glow = document.querySelector('.cursor-glow');

  document.addEventListener('mousemove', (evento) => {
    if (!glow) return;

    glow.style.left = `${evento.clientX}px`;
    glow.style.top = `${evento.clientY}px`;
  });
}

function configurarSom() {
  const botao = document.getElementById('sound-button');
  const estadoSom = document.getElementById('sound-state');

  if (!botao || !estadoSom) return;

  botao.addEventListener('click', () => {
    somLigado = !somLigado;

    if (somLigado) {
      estadoSom.textContent = 'ON';
      tocarSom(700, 0.08);
    } else {
      estadoSom.textContent = 'OFF';
    }
  });
}

function tocarSom(frequencia, duracao) {
  if (!somLigado) return;

  if (!contextoAudio) {
    contextoAudio = new AudioContext();
  }

  const oscilador = contextoAudio.createOscillator();
  const ganho = contextoAudio.createGain();

  oscilador.type = 'square';
  oscilador.frequency.value = frequencia;
  ganho.gain.value = 0.035;

  oscilador.connect(ganho);
  ganho.connect(contextoAudio.destination);

  oscilador.start();
  ganho.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + duracao);
  oscilador.stop(contextoAudio.currentTime + duracao);
}

function finalizarBoot() {
  const boot = document.getElementById('boot');

  if (!boot || !document.body.classList.contains('booting')) return;

  document.body.classList.remove('booting');
  boot.classList.add('boot-finished');

  setTimeout(() => {
    boot.remove();
  }, 700);
}

async function iniciar() {
  document.body.classList.add('booting');

  configurarControles();
  configurarAtalhos();
  configurarRelogio();
  configurarRadar();
  configurarMouse();
  configurarSom();
  configurarMissaoPacman();

  estado.carregamento = 'carregando';
  estado.erro = null;
  renderizarAplicacao();

  setTimeout(finalizarBoot, 2200);

  try {
    const tarefas = await carregarTarefas();

    estado.tarefas = tarefas;
    estado.carregamento = 'sucesso';
    estado.erro = null;
    renderizarAplicacao();
    atualizarNucleoPacman();
  } catch (erro) {
    estado.carregamento = 'erro';
    estado.erro = 'DATABASE CONNECTION FAILED.';

    if (erro.name === 'TypeError') {
      estado.erro = 'NETWORK FAILURE: CHECK CONNECTION.';
    } else if (erro.name === 'SyntaxError') {
      estado.erro = 'INVALID DATA FORMAT RECEIVED.';
    } else if (erro.name === 'ErroHTTP') {
      estado.erro = `SERVER ERROR // HTTP ${erro.status}.`;
    }

    renderizarAplicacao();
  }
}


function atualizarNucleoPacman() {
  const total = estado.tarefas.length;
  const concluidas = estado.tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
  const score = document.getElementById('pacman-score');
  const progresso = document.getElementById('pacman-progress');
  const botao = document.getElementById('pacman-eat-button');

  if (score) score.textContent = String(missoesComidas).padStart(2, '0');
  if (progresso) {
    const porcentagem = total === 0 ? 0 : Math.round((concluidas / total) * 100);
    progresso.textContent = `${String(porcentagem).padStart(2, '0')}%`;
  }
  if (botao) {
    botao.disabled = total === 0 || concluidas === total;
    botao.textContent = concluidas === total ? 'ALL MISSIONS EATEN' : 'EAT NEXT MISSION';
  }
}

function configurarMissaoPacman() {
  const botao = document.getElementById('pacman-eat-button');
  const stage = document.getElementById('pacman-3d-stage');

  if (!botao) return;

  botao.addEventListener('click', () => {
    const proxima = estado.tarefas.find((tarefa) => tarefa.status !== 'concluida');

    if (!proxima) {
      atualizarNucleoPacman();
      return;
    }

    proxima.status = 'concluida';
    missoesComidas += 1;
    renderizarAplicacao();
    atualizarNucleoPacman();
    tocarSom(760, 0.08);

    if (stage) {
      stage.classList.remove('mission-eaten');
      void stage.offsetWidth;
      stage.classList.add('mission-eaten');
    }
  });
}

function configurarControle360() {
  const canvas = document.getElementById('pacman-3d-canvas');
  const stage = document.getElementById('pacman-3d-stage');
  const xReadout = document.getElementById('rot-x');
  const yReadout = document.getElementById('rot-y');
  const zReadout = document.getElementById('rot-z');

  if (!canvas || !stage) return;

  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) {
    stage.innerHTML = '<div style="display:grid;place-items:center;height:100%;padding:2rem;text-align:center;color:#777;font:12px DM Mono,monospace">WEBGL NÃO ESTÁ DISPONÍVEL NESTE NAVEGADOR.</div>';
    return;
  }

  const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uProjection;
    uniform mat4 uModel;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vPosition = world.xyz;
      vNormal = mat3(uModel) * aNormal;
      gl_Position = uProjection * world;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 uColor;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightA = normalize(vec3(-0.55, 0.85, 0.75));
      vec3 lightB = normalize(vec3(0.8, 0.15, -0.35));
      float diffuse = max(dot(normal, lightA), 0.0) * 0.78;
      float rim = pow(1.0 - max(dot(normal, normalize(-vPosition)), 0.0), 2.0) * 0.18;
      float light = 0.22 + diffuse + rim + max(dot(normal, lightB), 0.0) * 0.12;
      gl_FragColor = vec4(uColor * light, 1.0);
    }
  `;

  function criarShader(tipo, codigo) {
    const shader = gl.createShader(tipo);
    gl.shaderSource(shader, codigo);
    gl.compileShader(shader);
    return shader;
  }

  const vertexShader = criarShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = criarShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const loc = {
    position: gl.getAttribLocation(program, 'aPosition'),
    normal: gl.getAttribLocation(program, 'aNormal'),
    projection: gl.getUniformLocation(program, 'uProjection'),
    model: gl.getUniformLocation(program, 'uModel'),
    color: gl.getUniformLocation(program, 'uColor')
  };

  function criarEsfera(raio, latitudes, longitudes, centroX, centroY, centroZ) {
    const vertices = [];
    const normals = [];
    const indices = [];

    for (let lat = 0; lat <= latitudes; lat++) {
      const theta = lat * Math.PI / latitudes;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let lon = 0; lon <= longitudes; lon++) {
        const phi = lon * Math.PI * 2 / longitudes;
        const x = Math.cos(phi) * sinTheta;
        const y = cosTheta;
        const z = Math.sin(phi) * sinTheta;
        vertices.push(centroX + raio * x, centroY + raio * y, centroZ + raio * z);
        normals.push(x, y, z);
      }
    }

    for (let lat = 0; lat < latitudes; lat++) {
      for (let lon = 0; lon < longitudes; lon++) {
        const primeiro = lat * (longitudes + 1) + lon;
        const segundo = primeiro + longitudes + 1;
        indices.push(primeiro, segundo, primeiro + 1, segundo, segundo + 1, primeiro + 1);
      }
    }

    return { vertices, normals, indices };
  }

  function criarPacman(raio, latitudes, longitudes) {
    const vertices = [];
    const normals = [];
    const indices = [];
    const mouthHalf = 0.48;

    for (let lat = 0; lat <= latitudes; lat++) {
      const theta = lat * Math.PI / latitudes;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let lon = 0; lon <= longitudes; lon++) {
        const phi = -Math.PI + lon * Math.PI * 2 / longitudes;
        const x = Math.cos(phi) * sinTheta;
        const y = cosTheta;
        const z = Math.sin(phi) * sinTheta;
        vertices.push(raio * x, raio * y, raio * z);
        normals.push(x, y, z);
      }
    }

    function estaNaBoca(phi) {
      let a = phi;
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return Math.abs(a) < mouthHalf;
    }

    for (let lat = 0; lat < latitudes; lat++) {
      for (let lon = 0; lon < longitudes; lon++) {
        const phiA = -Math.PI + lon * Math.PI * 2 / longitudes;
        const phiB = -Math.PI + (lon + 1) * Math.PI * 2 / longitudes;
        const phiM = (phiA + phiB) / 2;
        if (estaNaBoca(phiM)) continue;
        const primeiro = lat * (longitudes + 1) + lon;
        const segundo = primeiro + longitudes + 1;
        indices.push(primeiro, segundo, primeiro + 1, segundo, segundo + 1, primeiro + 1);
      }
    }

    // Faces internas da boca para dar profundidade ao corte.
    const mouthDepth = 0.02;
    const boundaryAngles = [-mouthHalf, mouthHalf];
    for (let side = 0; side < boundaryAngles.length; side++) {
      const phi = boundaryAngles[side];
      const base = vertices.length / 3;
      for (let lat = 0; lat <= latitudes; lat++) {
        const theta = lat * Math.PI / latitudes;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        vertices.push(raio * Math.cos(phi) * sinTheta + mouthDepth, raio * cosTheta, raio * Math.sin(phi) * sinTheta);
        const nx = side === 0 ? 1 : 1;
        const nz = side === 0 ? -1 : 1;
        normals.push(nx, 0, nz);
      }
      for (let lat = 0; lat < latitudes; lat++) {
        const a = base + lat;
        const b = base + lat + 1;
        const c = (lat * (longitudes + 1)) + Math.round((phi + Math.PI) / (Math.PI * 2) * longitudes);
        const d = ((lat + 1) * (longitudes + 1)) + Math.round((phi + Math.PI) / (Math.PI * 2) * longitudes);
        if (side === 0) indices.push(a, c, b, b, c, d);
        else indices.push(a, b, c, b, d, c);
      }
    }

    return { vertices, normals, indices };
  }

  function enviarMalha(mesh) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    return { positionBuffer, normalBuffer, indexBuffer, count: mesh.indices.length };
  }

  const pacmanMesh = enviarMalha(criarPacman(1.0, 40, 64));
  const eyeMesh = enviarMalha(criarEsfera(0.13, 16, 24, 0.0, 0.42, 0.88));
  const eyeMesh2 = enviarMalha(criarEsfera(0.13, 16, 24, 0.0, 0.42, -0.88));

  function identidade() {
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  }

  function multiplicar(a, b) {
    const r = new Array(16);
    for (let c = 0; c < 4; c++) {
      for (let row = 0; row < 4; row++) {
        r[c * 4 + row] =
          a[row] * b[c * 4] + a[4 + row] * b[c * 4 + 1] +
          a[8 + row] * b[c * 4 + 2] + a[12 + row] * b[c * 4 + 3];
      }
    }
    return r;
  }

  function rotX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
  }

  function rotY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
  }

  function rotZ(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1];
  }

  function perspectiva(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,(2*far*near)*nf,0];
  }

  function translacao(x, y, z) {
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
  }

  let rotXValue = -0.18;
  let rotYValue = 0.65;
  let rotZValue = 0.0;
  let zoom = 3.2;
  let arrastando = false;
  let ultimoX = 0;
  let ultimoY = 0;

  function atualizarNumeros() {
    xReadout.textContent = String(Math.round(((rotXValue * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0');
    yReadout.textContent = String(Math.round(((rotYValue * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0');
    zReadout.textContent = String(Math.round(((rotZValue * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0');
  }

  stage.addEventListener('pointerdown', (evento) => {
    arrastando = true;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
    stage.setPointerCapture(evento.pointerId);
  });

  stage.addEventListener('pointermove', (evento) => {
    if (!arrastando) return;
    const dx = evento.clientX - ultimoX;
    const dy = evento.clientY - ultimoY;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
    rotYValue += dx * 0.012;
    rotXValue += dy * 0.012;
    atualizarNumeros();
  });

  stage.addEventListener('pointerup', (evento) => {
    arrastando = false;
    if (stage.hasPointerCapture(evento.pointerId)) stage.releasePointerCapture(evento.pointerId);
  });

  stage.addEventListener('pointercancel', () => { arrastando = false; });

  stage.addEventListener('wheel', (evento) => {
    evento.preventDefault();
    zoom += evento.deltaY * 0.0025;
    zoom = Math.max(1.7, Math.min(5.2, zoom));
  }, { passive: false });

  function ajustarCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function desenharMesh(mesh, model, color) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
    gl.enableVertexAttribArray(loc.position);
    gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.enableVertexAttribArray(loc.normal);
    gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.uniformMatrix4fv(loc.model, false, new Float32Array(model));
    gl.uniform3fv(loc.color, new Float32Array(color));
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  function renderizar() {
    ajustarCanvas();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.02, 0.02, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const projection = perspectiva(Math.PI / 4, aspect, 0.1, 100);
    gl.uniformMatrix4fv(loc.projection, false, new Float32Array(projection));

    let model = identidade();
    model = multiplicar(model, translacao(0, 0, -zoom));
    model = multiplicar(model, rotY(rotYValue));
    model = multiplicar(model, rotX(rotXValue));
    model = multiplicar(model, rotZ(rotZValue));

    desenharMesh(pacmanMesh, model, [1.0, 0.82, 0.0]);

    const eyeModel = multiplicar(model, translacao(0, 0.0, 0));
    desenharMesh(eyeMesh, eyeModel, [0.015, 0.015, 0.02]);
    desenharMesh(eyeMesh2, eyeModel, [0.015, 0.015, 0.02]);

    requestAnimationFrame(renderizar);
  }

  atualizarNumeros();
  renderizar();
}

configurarControle360();
iniciar();
