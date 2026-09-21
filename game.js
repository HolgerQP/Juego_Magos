const AudioManager = (() => {
  const storageKeys = {
    sound: 'duelo.soundEnabled',
    music: 'duelo.musicEnabled',
    effectsVolume: 'duelo.effectsVolume',
    musicVolume: 'duelo.musicVolume',
  };
  const settings = {
    soundEnabled: localStorage.getItem(storageKeys.sound) !== 'off',
    musicEnabled: localStorage.getItem(storageKeys.music) !== 'off',
    effectsVolume: Number(localStorage.getItem(storageKeys.effectsVolume) || 65),
    musicVolume: Number(localStorage.getItem(storageKeys.musicVolume) || 28),
  };
  let audioContext = null;
  let effectsBus = null;
  let musicBus = null;
  let musicElement = null;
  let unlocked = false;

  function ensureContext() {
    if (audioContext) {
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    audioContext = new Context();
    effectsBus = audioContext.createGain();
    musicBus = audioContext.createGain();
    effectsBus.connect(audioContext.destination);
    musicBus.connect(audioContext.destination);
    musicElement = new Audio(encodeURI('Medieval Minstrel Music – Castle Bard.mp3'));
    musicElement.loop = true;
    musicElement.preload = 'auto';
    musicElement.volume = 1;
    musicElement.load();
    updateBusVolumes();
    if (settings.musicEnabled) startMusic();
    return audioContext;
  }

  function updateBusVolumes() {
    if (effectsBus) effectsBus.gain.value = settings.soundEnabled ? settings.effectsVolume / 100 : 0;
    if (musicBus) musicBus.gain.value = 1;
    if (musicElement) musicElement.volume = settings.musicEnabled ? settings.musicVolume / 100 : 0;
  }

  function tone(frequency, duration, type = 'sine', volume = .15, endFrequency = frequency, bus = effectsBus, delay = 0) {
    if (!audioContext || !bus) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(bus);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  }

  function noise(duration = .18, volume = .12, filterFrequency = 1200, delay = 0) {
    if (!audioContext || !effectsBus) return;
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + delay;
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(effectsBus);
    source.start(start);
  }

  function startMusic() {
    if (!audioContext || !musicElement || !settings.musicEnabled) return;
    const playMusic = () => musicElement.play().catch(() => {});
    if (audioContext.state === 'suspended') audioContext.resume().then(playMusic).catch(() => {});
    else playMusic();
  }

  function stopMusic() {
    if (!musicElement) return;
    musicElement.pause();
    musicElement.currentTime = 0;
  }

  function play(name) {
    if (!unlocked || !settings.soundEnabled || !ensureContext()) return;
    switch (name) {
      case 'button': tone(280, .07, 'sine', .08, 380); break;
      case 'restart': tone(220, .12, 'triangle', .08, 440); tone(440, .16, 'sine', .06, 660, effectsBus, .08); break;
      case 'card-select': tone(420, .09, 'triangle', .1, 620); break;
      case 'draw-card': tone(360, .08, 'triangle', .08, 520); tone(720, .12, 'sine', .06, 860, effectsBus, .05); break;
      case 'mana-error': tone(130, .18, 'sawtooth', .12, 90); break;
      case 'hand-full': tone(180, .1, 'square', .1, 130); tone(120, .15, 'square', .08, 90, effectsBus, .1); break;
      case 'turn': tone(300, .25, 'sine', .08, 450); break;
      case 'victory': [523, 659, 784].forEach((note, index) => tone(note, .4, 'sine', .1, note, effectsBus, index * .13)); break;
      case 'defeat': tone(220, .6, 'sawtooth', .1, 90); break;
      case 'fireball-launch': tone(150, .36, 'sawtooth', .16, 620); noise(.2, .08, 900); break;
      case 'fireball-impact': noise(.32, .2, 1500); tone(90, .3, 'sawtooth', .12, 45); break;
      case 'lightning-launch': tone(900, .18, 'square', .12, 1500); noise(.12, .1, 3000); break;
      case 'lightning-impact': noise(.4, .24, 3500); tone(70, .2, 'sine', .13, 35); break;
      case 'ice-spear-launch': tone(700, .35, 'sine', .1, 1100); tone(1200, .2, 'triangle', .06, 700, effectsBus, .08); break;
      case 'ice-spear-impact': tone(1000, .25, 'triangle', .12, 300); noise(.16, .08, 2600); break;
      case 'arcane-blast-launch': tone(260, .4, 'sine', .12, 720); break;
      case 'arcane-blast-impact': noise(.38, .2, 1800); tone(180, .35, 'sine', .12, 60); break;
      case 'tornado-launch': noise(.7, .1, 850); tone(120, .5, 'sine', .08, 240); break;
      case 'tornado-impact': noise(.25, .12, 1200); break;
      case 'meteor-launch': tone(480, .55, 'sawtooth', .13, 70); noise(.35, .1, 1000); break;
      case 'meteor-impact': noise(.5, .24, 1400); tone(55, .4, 'sawtooth', .15, 25); break;
      case 'dark-orb-launch': tone(95, .5, 'sine', .13, 180); tone(310, .4, 'triangle', .05, 90); break;
      case 'dark-orb-impact': noise(.28, .17, 700); tone(70, .3, 'sine', .1, 30); break;
      case 'flare-launch': noise(.2, .1, 1800); tone(240, .2, 'sawtooth', .1, 500); break;
      case 'flare-impact': noise(.2, .12, 1600); break;
      case 'magic-shield': tone(340, .35, 'sine', .1, 820); break;
      case 'barrier': tone(130, .35, 'square', .1, 230); tone(510, .2, 'sine', .06, 720, effectsBus, .12); break;
      case 'magic-reflection': tone(520, .4, 'triangle', .1, 980); break;
      case 'reflect-impact': tone(900, .2, 'square', .11, 450); break;
      case 'teleport': tone(600, .25, 'sine', .1, 90); break;
      case 'teleport-arrive': tone(100, .25, 'sine', .1, 700); break;
      case 'healing': tone(420, .5, 'sine', .1, 760); tone(630, .4, 'sine', .06, 980, effectsBus, .12); break;
      case 'regeneration': tone(260, .7, 'triangle', .08, 520); break;
      case 'greater-healing': tone(300, .6, 'sine', .13, 900); tone(450, .5, 'sine', .08, 1200, effectsBus, .12); break;
      case 'arcane-power': tone(220, .45, 'sawtooth', .1, 660); break;
      case 'overload': tone(500, .3, 'square', .12, 1400); noise(.22, .1, 2600); break;
      case 'focus': tone(480, .3, 'sine', .1, 780); break;
      case 'sacrifice': tone(170, .25, 'sawtooth', .12, 80); tone(420, .4, 'sine', .09, 780, effectsBus, .18); break;
      case 'arcane-vision': tone(380, .6, 'triangle', .1, 1100); break;
      default: tone(300, .08, 'sine', .06, 420); break;
    }
  }

  function unlock() {
    unlocked = true;
    ensureContext();
    if (settings.musicEnabled) startMusic();
  }

  function setSoundEnabled(enabled) {
    settings.soundEnabled = enabled;
    localStorage.setItem(storageKeys.sound, enabled ? 'on' : 'off');
    updateBusVolumes();
  }

  function setMusicEnabled(enabled) {
    settings.musicEnabled = enabled;
    localStorage.setItem(storageKeys.music, enabled ? 'on' : 'off');
    updateBusVolumes();
    if (enabled) startMusic(); else stopMusic();
  }

  function setEffectsVolume(value) {
    settings.effectsVolume = Number(value);
    localStorage.setItem(storageKeys.effectsVolume, settings.effectsVolume);
    updateBusVolumes();
  }

  function setMusicVolume(value) {
    settings.musicVolume = Number(value);
    localStorage.setItem(storageKeys.musicVolume, settings.musicVolume);
    updateBusVolumes();
  }

  return {
    play,
    unlock,
    setSoundEnabled,
    setMusicEnabled,
    setEffectsVolume,
    setMusicVolume,
    getSettings: () => ({ ...settings }),
  };
})();

let localPlayerId = null;
let remotePlayerId = null;
let isHost = false;

const P2PManager = (() => {
  let peerConnection = null;
  let dataChannel = null;
  let signalChannel = null;
  let roomCode = '';
  let onStateChange = () => {};
  let onReady = () => {};
  let onMessage = () => {};

  function makeRoomCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  }

  function waitForIceGathering() {
    if (!peerConnection || peerConnection.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
      const finish = () => {
        if (peerConnection.iceGatheringState === 'complete') {
          peerConnection.removeEventListener('icegatheringstatechange', finish);
          resolve();
        }
      };
      peerConnection.addEventListener('icegatheringstatechange', finish);
      window.setTimeout(resolve, 4000);
    });
  }

  function sendSignal(message) {
    if (signalChannel) signalChannel.postMessage({ ...message, roomCode });
  }

  function setState(state, message) {
    onStateChange(state, message);
  }

  function setupPeerConnection() {
    const Connection = window.RTCPeerConnection;
    if (!Connection) throw new Error('WebRTC no está disponible en este navegador.');
    peerConnection = new Connection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (state === 'connecting') setState('connecting', '🟡 CONECTANDO...');
      if (state === 'connected') setState('connected', '🟢 CONECTADO');
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setState('lost', '🔴 CONEXIÓN PERDIDA');
        onMessage({ event: 'player_disconnected' });
      }
    };
  }

  function setupDataChannel(channel) {
    dataChannel = channel;
    dataChannel.onopen = () => {
      setState('connected', '🟢 CONECTADO');
      if (isHost) dataChannel.send(JSON.stringify({ type: 'HELLO' }));
    };
    dataChannel.onclose = () => {
      setState('lost', '🔴 CONEXIÓN PERDIDA');
      onMessage({ event: 'player_disconnected' });
    };
    dataChannel.onerror = () => setState('lost', '🔴 CONEXIÓN PERDIDA');
    dataChannel.onmessage = (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch (error) { return; }
      if (message.type === 'HELLO') {
        dataChannel.send(JSON.stringify({ type: 'HELLO_BACK' }));
        setState('ready', '🟢 CONECTADO');
      }
      if (message.type === 'HELLO_BACK' && isHost) {
        setState('ready', '🟢 CONECTADO');
        dataChannel.send(JSON.stringify({ event: 'player_joined', playerId: 'player2' }));
        dataChannel.send(JSON.stringify({ type: 'START_ARENA' }));
        onReady();
      }
      if (message.type === 'START_ARENA' && !isHost) onReady();
      if (message.event) onMessage(message);
    };
  }

  async function broadcastOffer() {
    await waitForIceGathering();
    sendSignal({ type: 'OFFER', description: { type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp } });
  }

  async function handleSignal(message) {
    if (!peerConnection) return;
    if (message.type === 'JOIN_REQUEST' && isHost) {
      await broadcastOffer();
      return;
    }
    if (message.type === 'OFFER' && !isHost) {
      await peerConnection.setRemoteDescription(message.description);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await waitForIceGathering();
      sendSignal({ type: 'ANSWER', description: { type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp } });
    }
    if (message.type === 'ANSWER' && isHost) await peerConnection.setRemoteDescription(message.description);
  }

  function openSignalChannel(code) {
    if (!window.BroadcastChannel) throw new Error('BroadcastChannel no está disponible en este navegador.');
    signalChannel = new BroadcastChannel(`duelo-magico-signal-${code}`);
    signalChannel.onmessage = (event) => handleSignal(event.data).catch(() => setState('lost', '🔴 CONEXIÓN PERDIDA'));
  }

  async function createRoom(callbacks) {
    disconnect();
    roomCode = makeRoomCode();
    localPlayerId = 'player1';
    remotePlayerId = 'player2';
    isHost = true;
    onStateChange = callbacks.onStateChange;
    onReady = callbacks.onReady;
    onMessage = callbacks.onMessage || (() => {});
    setupPeerConnection();
    openSignalChannel(roomCode);
    setupDataChannel(peerConnection.createDataChannel('duelo-magic'));
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await broadcastOffer();
    return roomCode;
  }

  async function joinRoom(code, callbacks) {
    disconnect();
    roomCode = code;
    localPlayerId = 'player2';
    remotePlayerId = 'player1';
    isHost = false;
    onStateChange = callbacks.onStateChange;
    onReady = callbacks.onReady;
    onMessage = callbacks.onMessage || (() => {});
    setupPeerConnection();
    peerConnection.ondatachannel = (event) => setupDataChannel(event.channel);
    openSignalChannel(roomCode);
    setState('connecting', '🟡 CONECTANDO...');
    sendSignal({ type: 'JOIN_REQUEST' });
  }

  function disconnect() {
    if (dataChannel) dataChannel.close();
    if (peerConnection) peerConnection.close();
    if (signalChannel) signalChannel.close();
    dataChannel = null;
    peerConnection = null;
    signalChannel = null;
  }

  function send(message) {
    if (dataChannel && dataChannel.readyState === 'open') dataChannel.send(JSON.stringify(message));
  }

  return { createRoom, joinRoom, disconnect, send, getRoomCode: () => roomCode };
})();

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const deckCountElement = document.getElementById('deck-count');
const handCountElement = document.getElementById('hand-count');
const handElement = document.getElementById('hand');
const drawButton = document.getElementById('draw-button');
const toastElement = document.getElementById('toast');
const shuffleOverlay = document.getElementById('shuffle-overlay');
const turnIndicator = document.getElementById('turn-indicator');
const combatEffects = document.getElementById('combat-effects');
const resultOverlay = document.getElementById('result-overlay');
const resultTitle = document.getElementById('result-title');
const restartButton = document.getElementById('restart-button');
const soundToggle = document.getElementById('sound-toggle');
const musicToggle = document.getElementById('music-toggle');
const effectsVolume = document.getElementById('effects-volume');
const musicVolume = document.getElementById('music-volume');

function syncAudioControls() {
  const settings = AudioManager.getSettings();
  soundToggle.textContent = `${settings.soundEnabled ? '🔊 SONIDO ON' : '🔇 SONIDO OFF'}`;
  musicToggle.textContent = `${settings.musicEnabled ? '🎵 MÚSICA ON' : '🎵 MÚSICA OFF'}`;
  effectsVolume.value = settings.effectsVolume;
  musicVolume.value = settings.musicVolume;
}

soundToggle.addEventListener('click', () => {
  AudioManager.unlock();
  const nextValue = !AudioManager.getSettings().soundEnabled;
  AudioManager.setSoundEnabled(nextValue);
  if (nextValue) AudioManager.play('button');
  syncAudioControls();
});

musicToggle.addEventListener('click', () => {
  AudioManager.unlock();
  const nextValue = !AudioManager.getSettings().musicEnabled;
  AudioManager.setMusicEnabled(nextValue);
  AudioManager.play('button');
  syncAudioControls();
});

effectsVolume.addEventListener('input', () => {
  AudioManager.unlock();
  AudioManager.setEffectsVolume(effectsVolume.value);
});

musicVolume.addEventListener('input', () => {
  AudioManager.unlock();
  AudioManager.setMusicVolume(musicVolume.value);
});

syncAudioControls();

document.addEventListener('pointerdown', () => AudioManager.unlock(), { capture: true, once: true });

const lobbyScreen = document.getElementById('lobby-screen');
const lobbyMenu = document.getElementById('lobby-menu');
const hostPanel = document.getElementById('host-panel');
const joinPanel = document.getElementById('join-panel');
const roomCodeElement = document.getElementById('room-code');
const roomCodeInput = document.getElementById('room-code-input');
const hostState = document.getElementById('host-state');
const joinState = document.getElementById('join-state');
const connectionBadge = document.getElementById('connection-badge');

function showLobbyPanel(panel) {
  [lobbyMenu, hostPanel, joinPanel].forEach((currentPanel) => { currentPanel.hidden = currentPanel !== panel; });
}

function updateConnectionState(state, message) {
  hostState.textContent = message;
  joinState.textContent = message;
  if (state === 'connected' || state === 'ready') {
    connectionBadge.hidden = false;
    connectionBadge.classList.remove('lost');
    connectionBadge.textContent = '🟢 CONECTADO';
  }
  if (state === 'lost') {
    connectionBadge.hidden = false;
    connectionBadge.classList.add('lost');
    connectionBadge.textContent = '🔴 CONEXIÓN PERDIDA';
    showToast('CONEXIÓN PERDIDA');
  }
}

function enterArena() {
  lobbyScreen.classList.add('hidden');
  connectionBadge.hidden = false;
  connectionBadge.classList.remove('lost');
  connectionBadge.textContent = '🟢 CONECTADO';
  showToast('CONEXIÓN P2P ESTABLECIDA');
  networkGame.online = true;
  if (isHost) startNetworkHost();
  else shuffleOverlay.classList.add('hidden');
}

document.getElementById('create-game-button').addEventListener('click', async () => {
  AudioManager.unlock();
  AudioManager.play('button');
  showLobbyPanel(hostPanel);
  hostState.textContent = '🟡 CREANDO SALA...';
  try {
    const code = await P2PManager.createRoom({ onStateChange: updateConnectionState, onReady: enterArena, onMessage: applyNetworkMessage });
    roomCodeElement.textContent = code;
    hostState.textContent = '🟡 ESPERANDO AL OPONENTE...';
  } catch (error) {
    hostState.textContent = `🔴 ${error.message}`;
  }
});

document.getElementById('join-game-button').addEventListener('click', () => {
  AudioManager.unlock();
  AudioManager.play('button');
  showLobbyPanel(joinPanel);
  roomCodeInput.focus();
});
  
  document.getElementById('local-play-button').addEventListener('click', () => {
    AudioManager.unlock();
    AudioManager.play('button');
    networkGame.online = false;
    lobbyScreen.classList.add('hidden');
    connectionBadge.hidden = true;
    startGame();
  });

document.getElementById('connect-game-button').addEventListener('click', async () => {
  AudioManager.unlock();
  AudioManager.play('button');
  const code = roomCodeInput.value.trim().toUpperCase();
  if (code.length !== 5) {
    joinState.textContent = '🔴 CÓDIGO INVÁLIDO';
    return;
  }
  joinState.textContent = '🟡 CONECTANDO...';
  try {
    await P2PManager.joinRoom(code, { onStateChange: updateConnectionState, onReady: enterArena, onMessage: applyNetworkMessage });
  } catch (error) {
    joinState.textContent = `🔴 ${error.message}`;
  }
});

roomCodeInput.addEventListener('input', () => { roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z2-9]/g, ''); });

document.getElementById('copy-code-button').addEventListener('click', async () => {
  AudioManager.unlock();
  AudioManager.play('button');
  try {
    await navigator.clipboard.writeText(roomCodeElement.textContent);
    hostState.textContent = '🟡 CÓDIGO COPIADO';
  } catch (error) {
    hostState.textContent = '🟡 COPIA EL CÓDIGO MANUALMENTE';
  }
});

document.getElementById('host-back-button').addEventListener('click', () => { P2PManager.disconnect(); showLobbyPanel(lobbyMenu); });
document.getElementById('join-back-button').addEventListener('click', () => { P2PManager.disconnect(); showLobbyPanel(lobbyMenu); });

function initializeLobby() {
  showLobbyPanel(lobbyMenu);
  connectionBadge.hidden = true;
}

const CARD_TYPES = [
  ['fireball', 'Bola de fuego', 'Daño mágico', 15, '🔥', '#ff9b68', '#442938'],
  ['lightning', 'Rayo', 'Daño eléctrico', 20, '⚡', '#f4db72', '#403d2b'],
  ['ice-spear', 'Lanza de hielo', 'Daño de hielo', 12, '❄️', '#8cdcff', '#263e50'],
  ['arcane-blast', 'Explosión arcana', 'Energía pura', 25, '💥', '#c797ff', '#3b2950'],
  ['tornado', 'Tornado', 'Viento caótico', 15, '🌪️', '#a8e4db', '#254347'],
  ['meteor', 'Meteorito', 'Fuego celeste', 30, '☄️', '#ff8b70', '#49282b'],
  ['dark-orb', 'Orbe oscuro', 'Magia sombría', 20, '🟣', '#d493ff', '#3d2452'],
  ['flare', 'Llamarada', 'Luz abrasadora', 10, '🔥', '#ffcf70', '#4b3728'],
  ['magic-shield', 'Escudo mágico', 'Defensa arcana', 10, '🛡️', '#8cbaff', '#263b5b'],
  ['barrier', 'Barrera', 'Muro protector', 20, '🧱', '#d7b08a', '#44372d'],
  ['magic-reflection', 'Reflejo mágico', 'Espejo de energía', 18, '✨', '#e6c7ff', '#40324f'],
  ['teleport', 'Teletransporte', 'Paso entre sombras', 15, '🌀', '#8baaff', '#29355a'],
  ['healing', 'Curación', 'Energía vital', 15, '💚', '#87e0a0', '#274334'],
  ['regeneration', 'Regeneración', 'Vida constante', 15, '🌿', '#a7da7d', '#35452a'],
  ['greater-healing', 'Gran curación', 'Recuperación mayor', 25, '❤️', '#ff9ba6', '#4c2934'],
  ['arcane-power', 'Poder arcano', 'Potencia mágica', 20, '🔥', '#ffae85', '#4d2d35'],
  ['overload', 'Sobrecarga', 'Energía extrema', 30, '⚡', '#ffe28b', '#4c4127'],
  ['focus', 'Concentración', 'Recupera mana', 0, '🔵', '#88caff', '#273e56'],
  ['sacrifice', 'Sacrificio', 'Pacto peligroso', 0, '🩸', '#e7869f', '#482936'],
  ['arcane-vision', 'Visión arcana', 'Roba dos cartas', 10, '👁️', '#d1b1ff', '#3d3050'],
];

const players = {
  1: createPlayer(),
  2: createPlayer(),
};

const game = {
  deck: [],
  discard: [],
  activePlayer: 1,
  running: false,
  actionLocked: false,
  turnNumber: 0,
  opponentTimer: null,
};

const networkGame = {
  online: false,
  started: false,
};

function isNetworkGame() {
  return networkGame.online && Boolean(localPlayerId);
}

function localHandPlayerId() {
  return isNetworkGame() ? Number(localPlayerId.replace('player', '')) : game.activePlayer;
}

function sendNetworkEvent(event, payload = {}) {
  if (isNetworkGame() && isHost) P2PManager.send({ event, ...payload });
}

function sendPublicState() {
  if (!isNetworkGame() || !isHost) return;
  [1, 2].forEach((playerId) => {
    sendNetworkEvent('hp_update', { playerId, value: players[playerId].hp });
    sendNetworkEvent('mana_update', { playerId, value: players[playerId].mana });
    sendNetworkEvent('shield_update', { playerId, value: players[playerId].shield });
    sendNetworkEvent('effect_update', { playerId, effects: { ...players[playerId].effects } });
  });
  sendNetworkEvent('turn_change', { activePlayer: game.activePlayer });
}

function sendPrivateDraw(playerId, card) {
  if (!isNetworkGame() || !isHost) return;
  if (playerId === 2) P2PManager.send({ event: 'draw_private', playerId, card });
  P2PManager.send({ event: 'draw_public', playerId, deckCount: game.deck.length });
}

const scene = {
  width: 0,
  height: 0,
  time: 0,
  stars: [],
  motes: [],
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const visualState = {
  projectiles: [],
  particles: [],
  frameActive: false,
};

function getMagePoint(playerId) {
  return {
    x: scene.width * (playerId === 1 ? .25 : .75),
    y: scene.height * .7 - 86,
  };
}

function addVisualParticle(x, y, color, velocityX, velocityY, life = 420) {
  const particle = document.createElement('span');
  particle.className = 'spell-particle';
  particle.style.setProperty('--particle-color', color);
  combatEffects.appendChild(particle);
  visualState.particles.push({ particle, x, y, velocityX, velocityY, born: performance.now(), life });
}

function runVisualFrame(timestamp) {
  visualState.projectiles = visualState.projectiles.filter((projectile) => {
    const progress = clamp((timestamp - projectile.started) / projectile.duration, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const x = projectile.start.x + (projectile.end.x - projectile.start.x) * eased;
    const y = projectile.start.y + (projectile.end.y - projectile.start.y) * eased;
    projectile.element.style.left = `${x}px`;
    projectile.element.style.top = `${y}px`;
    if (Math.random() < .55) {
      addVisualParticle(x, y, projectile.color, (Math.random() - .5) * 1.6, (Math.random() - .5) * 1.6, 300);
    }
    if (progress >= 1) {
      projectile.element.remove();
      projectile.onImpact();
      return false;
    }
    return true;
  });

  visualState.particles = visualState.particles.filter((particle) => {
    const age = timestamp - particle.born;
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;
    particle.particle.style.left = `${particle.x}px`;
    particle.particle.style.top = `${particle.y}px`;
    particle.particle.style.opacity = `${1 - age / particle.life}`;
    if (age >= particle.life) {
      particle.particle.remove();
      return false;
    }
    return true;
  });

  if (visualState.projectiles.length || visualState.particles.length) {
    requestAnimationFrame(runVisualFrame);
  } else {
    visualState.frameActive = false;
  }
}

function startVisualFrame() {
  if (!visualState.frameActive) {
    visualState.frameActive = true;
    requestAnimationFrame(runVisualFrame);
  }
}

function animateSpell(type, sourceId, targetId, onImpact) {
  const start = getMagePoint(sourceId);
  const end = getMagePoint(targetId);
  const element = document.createElement('span');
  element.className = `spell-projectile spell-${type}`;
  element.textContent = { fireball: '🔥', lightning: '', 'ice-spear': '', 'arcane-blast': '✦', tornado: '', meteor: '', 'dark-orb': '', flare: '' }[type] || '';
  const fromTop = type === 'lightning' || type === 'meteor';
  const origin = fromTop ? { x: end.x, y: -55 } : start;
  const colors = { fireball: '#ff7d39', lightning: '#fff2a1', 'ice-spear': '#bfeaff', 'arcane-blast': '#c993ff', tornado: '#a8e4db', meteor: '#ff814f', 'dark-orb': '#bd75ff', flare: '#ffb44c' };
  AudioManager.play(`${type}-launch`);
  combatEffects.appendChild(element);
  visualState.projectiles.push({
    element,
    start: origin,
    end,
    color: colors[type] || '#fff',
    started: performance.now(),
    duration: fromTop ? 620 : 560,
    onImpact: () => {
      showImpact(type, end);
      onImpact();
    },
  });
  startVisualFrame();
}

function showImpact(type, point) {
  const impact = document.createElement('span');
  impact.className = `fx-impact ${type === 'meteor' || type === 'arcane-blast' ? 'large' : ''}`;
  impact.style.left = `${point.x}px`;
  impact.style.top = `${point.y}px`;
  impact.style.setProperty('--impact-color', { fireball: '#ff9b68', lightning: '#fff0a3', 'ice-spear': '#aee9ff', 'arcane-blast': '#c797ff', tornado: '#a8e4db', meteor: '#ff814f', 'dark-orb': '#b76bff', flare: '#ffbd5e' }[type] || '#fff');
  impact.textContent = { fireball: '🔥', lightning: '⚡', 'ice-spear': '❄️', 'arcane-blast': '✦', tornado: '🌪️', meteor: '☄️', 'dark-orb': '🟣', flare: '🔥' }[type] || '✦';
  AudioManager.play(`${type}-impact`);
  combatEffects.appendChild(impact);
  impact.addEventListener('animationend', () => impact.remove());
  for (let index = 0; index < (type === 'meteor' ? 12 : 6); index += 1) {
    addVisualParticle(point.x, point.y, impact.style.getPropertyValue('--impact-color'), (Math.random() - .5) * 4, (Math.random() - .5) * 4, 500);
  }
  if (type === 'lightning' || type === 'meteor') flashScreen();
}

function flashScreen() {
  const shell = document.querySelector('.game-shell');
  shell.classList.remove('screen-flash');
  void shell.offsetWidth;
  shell.classList.add('screen-flash');
}

function showAura(playerId, tone, duration = 1000) {
  const point = getMagePoint(playerId);
  const aura = document.createElement('span');
  aura.className = `fx-aura ${tone}`;
  aura.style.left = `${point.x}px`;
  aura.style.top = `${point.y}px`;
  combatEffects.appendChild(aura);
  window.setTimeout(() => aura.remove(), duration);
  for (let index = 0; index < 5; index += 1) {
    addVisualParticle(point.x + (Math.random() - .5) * 55, point.y + (Math.random() - .5) * 80, aura.style.getPropertyValue('--aura-color'), (Math.random() - .5) * 1.2, -Math.random() * 1.5, duration);
  }
  startVisualFrame();
}

function animateCardCast(cardIndex, card, onComplete) {
  const cardElement = handElement.querySelector(`[data-card-index="${cardIndex}"]`);
  if (!cardElement) {
    onComplete();
    return;
  }
  const shell = document.querySelector('.game-shell').getBoundingClientRect();
  const cardBounds = cardElement.getBoundingClientRect();
  const target = getMagePoint(game.activePlayer === 1 ? 2 : 1);
  cardElement.style.setProperty('--cast-x', `${target.x - (cardBounds.left - shell.left + cardBounds.width / 2)}px`);
  cardElement.style.setProperty('--cast-y', `${target.y - (cardBounds.top - shell.top + cardBounds.height / 2)}px`);
  cardElement.classList.add('casting');
  cardElement.disabled = true;
  window.setTimeout(onComplete, 360);
}

function createPlayer() {
  return {
    hp: 100,
    mana: 50,
    shield: 0,
    hand: [],
    effects: {
      reflect: false,
      teleport: false,
      regenerationTurns: 0,
      arcanePower: false,
      overload: false,
    },
  };
}

function createDeck() {
  return CARD_TYPES.flatMap((cardType) => [cardType, cardType]).map((cardType, index) => ({
    id: `${cardType[0]}-${index + 1}`,
    nombre: cardType[1],
    tipo: cardType[0],
    descripcion: cardType[2],
    costeMana: cardType[3],
    icono: cardType[4],
    accent: cardType[5],
    tint: cardType[6],
  }));
}

function findCardType(cardId) {
  return CARD_TYPES.find((cardType) => cardType[0] === cardId);
}

function getPublicCardResult(cardId) {
  const results = {
    fireball: { damage: 25 }, lightning: { damage: 30 }, 'ice-spear': { damage: 20 },
    'arcane-blast': { damage: 35 }, tornado: { damage: 18 }, meteor: { damage: 40 },
    'dark-orb': { damage: 28 }, flare: { damage: 15 }, 'magic-shield': { shield: 25 },
    barrier: { shield: 40 }, healing: { healing: 25 }, regeneration: { effect: 'regeneration' },
    'greater-healing': { healing: 40 }, 'arcane-power': { effect: 'arcanePower' },
    overload: { effect: 'overload' }, focus: { mana: 20 }, sacrifice: { damage: 15, mana: 30 },
    'magic-reflection': { effect: 'reflect' }, teleport: { effect: 'teleport' },
    'arcane-vision': { draw: 2 },
  };
  return results[cardId] || {};
}

function publicGameStart() {
  return {
    hp: { 1: players[1].hp, 2: players[2].hp },
    mana: { 1: players[1].mana, 2: players[2].mana },
    shield: { 1: players[1].shield, 2: players[2].shield },
    activePlayer: game.activePlayer,
    deckCount: game.deck.length,
  };
}

function startNetworkHost() {
  players[1] = createPlayer();
  players[2] = createPlayer();
  game.deck = shuffleDeck(createDeck());
  game.discard = [];
  game.activePlayer = 1;
  game.running = true;
  game.actionLocked = true;
  networkGame.started = true;
  resultOverlay.classList.remove('visible');
  resultOverlay.setAttribute('aria-hidden', 'true');
  shuffleOverlay.classList.remove('hidden');
  renderHand();
  window.setTimeout(() => {
    shuffleOverlay.classList.add('hidden');
    sendNetworkEvent('game_start', { state: publicGameStart() });
    beginAuthoritativeTurn(1);
  }, 1800);
}

function startNetworkGuest(state) {
  players[1] = createPlayer();
  players[2] = createPlayer();
  players[1].hp = state.hp[1];
  players[2].hp = state.hp[2];
  players[1].mana = state.mana[1];
  players[2].mana = state.mana[2];
  players[1].shield = state.shield[1];
  players[2].shield = state.shield[2];
  game.deck = Array.from({ length: state.deckCount });
  game.discard = [];
  game.activePlayer = state.activePlayer;
  game.running = true;
  game.actionLocked = game.activePlayer !== 2;
  networkGame.started = true;
  resultOverlay.classList.remove('visible');
  resultOverlay.setAttribute('aria-hidden', 'true');
  shuffleOverlay.classList.add('hidden');
  renderHand();
}

function sendAuthoritativeState() {
  sendPublicState();
  sendNetworkEvent('turn_start', { playerId: game.activePlayer });
}

function beginAuthoritativeTurn(playerId) {
  if (!isNetworkGame() || !isHost || gameOver()) return;
  game.activePlayer = playerId;
  game.actionLocked = playerId !== 1;
  game.turnNumber += 1;
  applyTurnStartEffects(playerId);
  sendAuthoritativeState();
  renderHand();
}

function playPublicCardAnimation(cardId, playerId, targetId) {
  const cardType = findCardType(cardId);
  if (!cardType) return;
  const attackTypes = ['fireball', 'lightning', 'ice-spear', 'arcane-blast', 'tornado', 'meteor', 'dark-orb', 'flare'];
  if (attackTypes.includes(cardId)) {
    animateSpell(cardId, playerId, targetId, () => {});
    return;
  }
  const visualByCard = {
    'magic-shield': ['🛡️', 'blue'], barrier: ['🧱', 'blue'], 'magic-reflection': ['✨', 'purple'],
    teleport: ['🌀', 'purple'], healing: ['💚', 'green'], regeneration: ['🌿', 'green'],
    'greater-healing': ['❤️', 'green'], 'arcane-power': ['🔥', 'gold'], overload: ['⚡', 'gold'],
    focus: ['🔵', 'blue'], sacrifice: ['🩸', 'red'], 'arcane-vision': ['👁️', 'purple'],
  };
  const visual = visualByCard[cardId];
  if (visual) showDefenseAura(playerId, visual[0], visual[1]);
}

function applyNetworkMessage(message) {
  if (message.event === 'player_disconnected') {
    networkGame.online = false;
    showToast('CONEXIÓN PERDIDA');
    return;
  }
  if (isHost && message.event === 'play_card') {
    handleHostPlayIntent(2, message.cardId);
    return;
  }
  if (isHost && message.event === 'restart_request') {
    sendNetworkEvent('restart');
    startNetworkHost();
    return;
  }
  if (message.event === 'game_start' && !isHost) {
    startNetworkGuest(message.state);
    return;
  }
  if (message.event === 'player_joined') {
    showToast('OPONENTE CONECTADO');
    return;
  }
  if (message.event === 'draw_private' && message.playerId === 2) {
    players[2].hand.push(message.card);
    AudioManager.play('draw-card');
    renderHand();
    return;
  }
  if (message.event === 'draw_public') {
    game.deck = Array.from({ length: message.deckCount });
    if (message.playerId !== Number(localPlayerId.replace('player', ''))) showToast(`JUGADOR ${message.playerId} ROBÓ`);
    updateHud();
    return;
  }
  if (message.event === 'card_played' && !isHost) {
    const ownId = Number(localPlayerId.replace('player', ''));
    if (message.playerId === ownId) {
      const handIndex = players[ownId].hand.findIndex((card) => card.tipo === message.cardId);
      if (handIndex >= 0) {
        const card = players[ownId].hand[handIndex];
        animateCardCast(handIndex, card, () => {
          players[ownId].hand.splice(handIndex, 1);
          renderHand();
          playPublicCardAnimation(message.cardId, message.playerId, message.targetId);
        });
        return;
      }
    }
    playPublicCardAnimation(message.cardId, message.playerId, message.targetId);
    return;
  }
  if (message.event === 'hp_update' || message.event === 'mana_update' || message.event === 'shield_update') {
    const player = players[message.playerId];
    const key = message.event.replace('_update', '');
    const previous = player[key];
    player[key] = message.value;
    if (key === 'hp' && message.value < previous) showFloatingNumber(`-${previous - message.value}`, message.playerId, '#ff9a9a');
    if (key === 'hp' && message.value > previous) showFloatingNumber(`+${message.value - previous}`, message.playerId, '#8deda7');
    updateHud();
    return;
  }
  if (message.event === 'effect_update') {
    players[message.playerId].effects = { ...players[message.playerId].effects, ...message.effects };
    return;
  }
  if (message.event === 'turn_change' || message.event === 'turn_start') {
    game.activePlayer = message.activePlayer || message.playerId;
    game.actionLocked = game.activePlayer !== Number(localPlayerId.replace('player', ''));
    updateHud();
    renderHand();
    return;
  }
  if (message.event === 'action_rejected') {
    game.actionLocked = false;
    showToast(message.reason === 'mana' ? 'MANÁ INSUFICIENTE' : 'ACCIÓN NO VÁLIDA');
    return;
  }
  if (message.event === 'victory' || message.event === 'defeat') {
    game.running = false;
    resultTitle.textContent = message.event === 'victory' ? '🏆 VICTORIA' : '💀 DERROTA';
    resultOverlay.classList.add('visible');
    return;
  }
  if (message.event === 'restart') {
    game.running = false;
    networkGame.started = false;
    resultOverlay.classList.remove('visible');
    shuffleOverlay.classList.remove('hidden');
  }
}

function shuffleDeck(deck) {
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]];
  }
  return deck;
}

function updateHud() {
  [1, 2].forEach((playerId) => {
    const player = players[playerId];
    document.getElementById(`player${playerId}-hp`).textContent = player.hp;
    document.getElementById(`player${playerId}-mana`).textContent = player.mana;
    document.getElementById(`player${playerId}-shield`).textContent = player.shield;
  });
  deckCountElement.textContent = game.deck.length;
  const visiblePlayer = localHandPlayerId();
  handCountElement.textContent = `${players[visiblePlayer].hand.length}/5`;
  document.getElementById('active-hand-label').textContent = `MANO DEL JUGADOR ${visiblePlayer}`;
  const nextTurnLabel = isNetworkGame()
    ? (game.activePlayer === localHandPlayerId() ? 'TU TURNO' : 'TURNO DEL OPONENTE')
    : (game.activePlayer === 1 ? 'TU TURNO' : 'TURNO DEL OPONENTE');
  if (turnIndicator.textContent !== nextTurnLabel) {
    turnIndicator.classList.remove('turn-change');
    void turnIndicator.offsetWidth;
    turnIndicator.classList.add('turn-change');
    turnIndicator.textContent = nextTurnLabel;
    AudioManager.play('turn');
  }
}

function renderHand() {
  const visiblePlayer = localHandPlayerId();
  const hand = players[visiblePlayer].hand;
  handElement.innerHTML = hand.map((card, index) => `
    <button class="playing-card" type="button" data-card-index="${index}" ${isNetworkGame() ? (game.activePlayer !== visiblePlayer || !game.running ? 'disabled' : '') : (game.activePlayer === 2 || !game.running ? 'disabled' : '')} style="--card-accent: ${card.accent}; --card-tint: ${card.tint}; animation-delay: ${index * 60}ms" aria-label="Jugar ${card.nombre}">
      <span class="card-icon" aria-hidden="true">${card.icono}</span>
      <strong class="card-name">${card.nombre.toUpperCase()}</strong>
      <span class="card-description">${card.descripcion}</span>
      <span class="card-cost">🔵 ${card.costeMana} MANA</span>
    </button>
  `).join('');
  updateHud();
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add('visible');
  if (message === 'MANÁ INSUFICIENTE') AudioManager.play('mana-error');
  if (message === 'MANO LLENA') AudioManager.play('hand-full');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toastElement.classList.remove('visible'), 1300);
}

function drawCard(playerId = game.activePlayer) {
  const hand = players[playerId].hand;
  if (hand.length >= 5) {
    showToast('MANO LLENA');
    return false;
  }
  if (game.deck.length === 0) {
    showToast('MAZO VACÍO');
    return false;
  }
  hand.push(game.deck.pop());
  AudioManager.play('draw-card');
  if (isNetworkGame() && isHost) sendPrivateDraw(playerId, hand[hand.length - 1]);
  renderHand();
  return true;
}

function showFloatingNumber(text, playerId, color) {
  const panel = document.querySelector(playerId === 1 ? '.player-one' : '.player-two');
  const shell = document.querySelector('.game-shell').getBoundingClientRect();
  const bounds = panel.getBoundingClientRect();
  const number = document.createElement('span');
  number.className = 'floating-number';
  number.style.setProperty('--effect-color', color);
  number.style.left = `${bounds.left - shell.left + bounds.width / 2}px`;
  number.style.top = `${bounds.top - shell.top + bounds.height / 2}px`;
  number.textContent = text;
  combatEffects.appendChild(number);
  number.addEventListener('animationend', () => number.remove());
}

function showCombatAnimation(icon, color) {
  const burst = document.createElement('div');
  burst.className = 'combat-burst';
  burst.style.setProperty('--burst-color', color);
  burst.textContent = icon;
  combatEffects.appendChild(burst);
  burst.addEventListener('animationend', () => burst.remove());
}

function showDefenseAura(playerId, icon, tone) {
  showCombatAnimation(icon, tone === 'blue' ? '#8cbaff' : tone === 'green' ? '#87e0a0' : '#d1b1ff');
  showAura(playerId, tone);
  const panel = document.querySelector(playerId === 1 ? '.player-one' : '.player-two');
  if (icon === '🌀') {
    panel.classList.remove('teleporting');
    void panel.offsetWidth;
    panel.classList.add('teleporting');
    window.setTimeout(() => AudioManager.play('teleport-arrive'), 420);
  }
}

function healPlayer(playerId, amount) {
  const player = players[playerId];
  const healed = Math.min(amount, 100 - player.hp);
  player.hp += healed;
  if (healed > 0) showFloatingNumber(`+${healed}`, playerId, '#8deda7');
}

function addShield(playerId, amount) {
  players[playerId].shield += amount;
  showFloatingNumber(`+${amount} 🛡️`, playerId, '#b6d5ff');
}

function changeMana(playerId, amount) {
  const player = players[playerId];
  const changed = Math.min(amount, 50 - player.mana);
  player.mana = clamp(player.mana + amount, 0, 50);
  if (changed > 0) showFloatingNumber(`+${changed} 🔵`, playerId, '#8dcbff');
}

function applyDamage(targetId, amount, sourceId, ignoreEffects = false, spellType = 'arcane-blast') {
  const target = players[targetId];
  let damage = amount;
  if (!ignoreEffects && target.effects.teleport) {
    damage = Math.ceil(damage * .5);
    target.effects.teleport = false;
  }
  const shieldDamage = Math.min(target.shield, damage);
  target.shield -= shieldDamage;
  target.hp = Math.max(0, target.hp - (damage - shieldDamage));
  showFloatingNumber(`-${damage}`, targetId, '#ff9a9a');
  const targetPanel = document.querySelector(targetId === 1 ? '.player-one' : '.player-two');
  targetPanel.classList.remove('damage-hit');
  void targetPanel.offsetWidth;
  targetPanel.classList.add('damage-hit');
  if (spellType === 'ice-spear') {
    targetPanel.classList.add('freeze-hit');
    window.setTimeout(() => targetPanel.classList.remove('freeze-hit'), 550);
  }
  if (!ignoreEffects && target.effects.reflect) {
    const reflectionPanel = document.querySelector(targetId === 1 ? '.player-one' : '.player-two');
    reflectionPanel.classList.remove('reflect-hit');
    void reflectionPanel.offsetWidth;
    reflectionPanel.classList.add('reflect-hit');
    AudioManager.play('reflect-impact');
  }
  if (!ignoreEffects && target.effects.reflect && sourceId) {
    target.effects.reflect = false;
    applyDamage(sourceId, Math.ceil(damage * .5), targetId, true);
  }
  updateHud();
  checkVictory();
}

function performAttack(sourceId, targetId, amount, icon, color, spellType, onComplete) {
  const attacker = players[sourceId];
  let damage = amount;
  if (attacker.effects.arcanePower) {
    damage = Math.ceil(damage * 1.25);
    attacker.effects.arcanePower = false;
  }
  if (attacker.effects.overload) {
    damage *= 2;
    attacker.effects.overload = false;
  }
  animateSpell(spellType, sourceId, targetId, () => {
    applyDamage(targetId, damage, sourceId, false, spellType);
    onComplete();
  });
}

function executeCard(card, sourceId, onComplete = () => {}) {
  const targetId = sourceId === 1 ? 2 : 1;
  const effects = players[sourceId].effects;
  switch (card.tipo) {
    case 'fireball': performAttack(sourceId, targetId, 25, '🔥', '#ff9b68', 'fireball', onComplete); break;
    case 'lightning': performAttack(sourceId, targetId, 30, '⚡', '#f4db72', 'lightning', onComplete); break;
    case 'ice-spear': performAttack(sourceId, targetId, 20, '❄️', '#8cdcff', 'ice-spear', onComplete); break;
    case 'arcane-blast': performAttack(sourceId, targetId, 35, '💥', '#c797ff', 'arcane-blast', onComplete); break;
    case 'tornado': performAttack(sourceId, targetId, 18, '🌪️', '#a8e4db', 'tornado', onComplete); break;
    case 'meteor': performAttack(sourceId, targetId, 40, '☄️', '#ff8b70', 'meteor', onComplete); break;
    case 'dark-orb': performAttack(sourceId, targetId, 28, '🟣', '#d493ff', 'dark-orb', onComplete); break;
    case 'flare': performAttack(sourceId, targetId, 15, '🔥', '#ffcf70', 'flare', onComplete); break;
    case 'magic-shield': AudioManager.play('magic-shield'); addShield(sourceId, 25); showDefenseAura(sourceId, '🛡️', 'blue'); onComplete(); break;
    case 'barrier': AudioManager.play('barrier'); addShield(sourceId, 40); showDefenseAura(sourceId, '🧱', 'blue'); onComplete(); break;
    case 'magic-reflection': AudioManager.play('magic-reflection'); effects.reflect = true; showDefenseAura(sourceId, '✨', 'purple'); onComplete(); break;
    case 'teleport': AudioManager.play('teleport'); effects.teleport = true; showDefenseAura(sourceId, '🌀', 'purple'); onComplete(); break;
    case 'healing': AudioManager.play('healing'); healPlayer(sourceId, 25); showDefenseAura(sourceId, '💚', 'green'); onComplete(); break;
    case 'regeneration': AudioManager.play('regeneration'); effects.regenerationTurns = 3; showDefenseAura(sourceId, '🌿', 'green'); onComplete(); break;
    case 'greater-healing': AudioManager.play('greater-healing'); healPlayer(sourceId, 40); showDefenseAura(sourceId, '❤️', 'green'); onComplete(); break;
    case 'arcane-power': AudioManager.play('arcane-power'); effects.arcanePower = true; showDefenseAura(sourceId, '🔥', 'gold'); onComplete(); break;
    case 'overload': AudioManager.play('overload'); effects.overload = true; showDefenseAura(sourceId, '⚡', 'gold'); onComplete(); break;
    case 'focus': AudioManager.play('focus'); changeMana(sourceId, 20); showDefenseAura(sourceId, '🔵', 'blue'); onComplete(); break;
    case 'sacrifice': AudioManager.play('sacrifice'); players[sourceId].hp = Math.max(0, players[sourceId].hp - 15); showFloatingNumber('-15', sourceId, '#ff9a9a'); flashScreen(); checkVictory(); changeMana(sourceId, 30); showAura(sourceId, 'red', 600); onComplete(); break;
    case 'arcane-vision': AudioManager.play('arcane-vision'); drawCard(sourceId); drawCard(sourceId); showDefenseAura(sourceId, '👁️', 'purple'); onComplete(); break;
    default: onComplete(); break;
  }
}

function handleHostPlayIntent(playerId, cardId) {
  if (!isNetworkGame() || !isHost) return false;
  const player = players[playerId];
  const targetId = playerId === 1 ? 2 : 1;
  const cardIndex = player.hand.findIndex((card) => card.tipo === cardId);
  const reject = (reason) => {
    if (playerId === 1) showToast(reason === 'mana' ? 'MANÁ INSUFICIENTE' : 'ACCIÓN NO VÁLIDA');
    else P2PManager.send({ event: 'action_rejected', reason });
    return false;
  };
  if (!game.running || game.activePlayer !== playerId || cardIndex < 0) return reject('invalid');
  const card = player.hand[cardIndex];
  if (player.mana < card.costeMana) return reject('mana');
  game.actionLocked = true;
  player.mana -= card.costeMana;
  player.hand.splice(cardIndex, 1);
  game.discard.push(card);
  sendNetworkEvent('card_played', { playerId, cardId: card.tipo, targetId, result: getPublicCardResult(card.tipo) });
  animateCardCast(cardIndex, card, () => {
    executeCard(card, playerId, () => {
      renderHand();
      sendPublicState();
      if (gameOver()) return;
      window.setTimeout(() => beginAuthoritativeTurn(targetId), 350);
    });
  });
  return true;
}

function playCard(cardIndex, sourceId = game.activePlayer) {
  if (isNetworkGame()) {
    const playerId = Number(localPlayerId.replace('player', ''));
    if (game.activePlayer !== playerId || game.actionLocked) return false;
    const card = players[playerId].hand[cardIndex];
    if (!card) return false;
    if (isHost) return handleHostPlayIntent(1, card.tipo);
    game.actionLocked = true;
    P2PManager.send({ event: 'play_card', cardId: card.tipo });
    return true;
  }
  if (!game.running || (game.actionLocked && sourceId === 1) || sourceId !== game.activePlayer) return false;
  const player = players[sourceId];
  const card = player.hand[cardIndex];
  if (!card) return false;
  if (player.mana < card.costeMana) {
    showToast('MANÁ INSUFICIENTE');
    return false;
  }
  game.actionLocked = true;
  player.mana -= card.costeMana;
  animateCardCast(cardIndex, card, () => {
    player.hand.splice(cardIndex, 1);
    renderHand();
    executeCard(card, sourceId, () => {
      renderHand();
      if (!gameOver()) window.setTimeout(() => beginTurn(sourceId === 1 ? 2 : 1), 350);
    });
  });
  return true;
}

function applyTurnStartEffects(playerId) {
  const player = players[playerId];
  player.mana = Math.min(50, player.mana + 5);
  if (player.effects.regenerationTurns > 0) {
    healPlayer(playerId, 10);
    player.effects.regenerationTurns -= 1;
  }
  drawCard(playerId);
}

function beginTurn(playerId) {
  if (isNetworkGame()) return;
  if (gameOver()) return;
  game.activePlayer = playerId;
  game.actionLocked = false;
  game.turnNumber += 1;
  applyTurnStartEffects(playerId);
  updateHud();
  renderHand();
  if (playerId === 2) {
    game.actionLocked = true;
    game.opponentTimer = window.setTimeout(playOpponentTurn, 900);
  }
}

function playOpponentTurn() {
  if (isNetworkGame()) return;
  if (!game.running || game.activePlayer !== 2 || gameOver()) return;
  const available = players[2].hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.costeMana <= players[2].mana);
  if (available.length === 0) {
    window.setTimeout(() => beginTurn(1), 600);
    return;
  }
  const choice = available[Math.floor(Math.random() * available.length)];
  playCard(choice.index, 2);
}

function gameOver() {
  return !game.running;
}

function checkVictory() {
  if (players[1].hp > 0 && players[2].hp > 0) return false;
  if (!game.running) return true;
  game.running = false;
  game.actionLocked = true;
  window.clearTimeout(game.opponentTimer);
  resultTitle.textContent = players[2].hp <= 0 ? '🏆 VICTORIA' : '💀 DERROTA';
  resultOverlay.classList.add('visible');
  resultOverlay.setAttribute('aria-hidden', 'false');
  AudioManager.play(players[2].hp <= 0 ? 'victory' : 'defeat');
  if (isNetworkGame() && isHost) {
    const winnerId = players[2].hp <= 0 ? 1 : 2;
    sendNetworkEvent(winnerId === 1 ? 'defeat' : 'victory', { winnerId });
  }
  return true;
}

function startGame() {
  window.clearTimeout(game.opponentTimer);
  players[1] = createPlayer();
  players[2] = createPlayer();
  game.deck = shuffleDeck(createDeck());
  game.activePlayer = 1;
  game.turnNumber = 0;
  game.running = true;
  game.actionLocked = true;
  resultOverlay.classList.remove('visible');
  resultOverlay.setAttribute('aria-hidden', 'true');
  shuffleOverlay.classList.remove('hidden');
  renderHand();
  window.setTimeout(() => {
    shuffleOverlay.classList.add('hidden');
    beginTurn(1);
  }, 1800);
}

handElement.addEventListener('click', (event) => {
  const cardButton = event.target.closest('[data-card-index]');
  if (cardButton) {
    AudioManager.unlock();
    AudioManager.play('card-select');
    playCard(Number(cardButton.dataset.cardIndex));
  }
});

restartButton.addEventListener('click', () => {
  AudioManager.unlock();
  AudioManager.play('restart');
  if (isNetworkGame()) {
    if (isHost) {
      sendNetworkEvent('restart');
      startNetworkHost();
    } else {
      P2PManager.send({ event: 'restart_request' });
    }
    return;
  }
  startGame();
});

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  scene.width = window.innerWidth;
  scene.height = window.innerHeight;
  canvas.width = Math.floor(scene.width * pixelRatio);
  canvas.height = Math.floor(scene.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createAtmosphere();
}

function createAtmosphere() {
  const random = (min, max) => min + Math.random() * (max - min);
  scene.stars = Array.from({ length: Math.floor(scene.width / 12) }, () => ({
    x: random(0, scene.width),
    y: random(20, scene.height * .62),
    radius: random(.35, 1.35),
    phase: random(0, Math.PI * 2),
    speed: random(.6, 1.8),
  }));
  scene.motes = Array.from({ length: Math.floor(scene.width / 28) }, () => ({
    x: random(0, scene.width),
    y: random(scene.height * .34, scene.height * .82),
    radius: random(.8, 2.4),
    drift: random(.2, .8),
    phase: random(0, Math.PI * 2),
  }));
}

function drawSky() {
  const gradient = context.createLinearGradient(0, 0, 0, scene.height);
  gradient.addColorStop(0, '#080b20');
  gradient.addColorStop(.52, '#151839');
  gradient.addColorStop(1, '#261d3c');
  context.fillStyle = gradient;
  context.fillRect(0, 0, scene.width, scene.height);

  const haze = context.createRadialGradient(scene.width / 2, scene.height * .54, 20, scene.width / 2, scene.height * .54, scene.width * .55);
  haze.addColorStop(0, 'rgba(103, 95, 190, .18)');
  haze.addColorStop(1, 'rgba(38, 31, 73, 0)');
  context.fillStyle = haze;
  context.fillRect(0, scene.height * .18, scene.width, scene.height * .55);
}

function drawStars() {
  scene.stars.forEach((star) => {
    const twinkle = .38 + Math.sin(scene.time * star.speed + star.phase) * .28;
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(225, 227, 255, ${clamp(twinkle, .08, .8)})`;
    context.fill();
  });
}

function drawMoon() {
  const moonX = scene.width * .78;
  const moonY = scene.height * .23;
  const moonRadius = clamp(scene.width * .045, 28, 52);
  const glow = context.createRadialGradient(moonX, moonY, moonRadius * .5, moonX, moonY, moonRadius * 3.5);
  glow.addColorStop(0, 'rgba(219, 213, 255, .3)');
  glow.addColorStop(1, 'rgba(173, 163, 255, 0)');
  context.fillStyle = glow;
  context.fillRect(moonX - moonRadius * 4, moonY - moonRadius * 4, moonRadius * 8, moonRadius * 8);

  context.beginPath();
  context.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  context.fillStyle = '#eeeaff';
  context.shadowColor = 'rgba(213, 206, 255, .9)';
  context.shadowBlur = 18 + Math.sin(scene.time * 1.5) * 3;
  context.fill();
  context.shadowBlur = 0;

  context.beginPath();
  context.arc(moonX + moonRadius * .34, moonY - moonRadius * .18, moonRadius * .92, 0, Math.PI * 2);
  context.fillStyle = '#0b0e25';
  context.fill();
}

function drawArena() {
  const groundY = scene.height * .7;
  const ground = context.createLinearGradient(0, groundY, 0, scene.height);
  ground.addColorStop(0, '#30274b');
  ground.addColorStop(1, '#0d1024');
  context.fillStyle = ground;
  context.fillRect(0, groundY, scene.width, scene.height - groundY);

  context.beginPath();
  context.moveTo(0, groundY);
  context.quadraticCurveTo(scene.width * .5, groundY - 42, scene.width, groundY);
  context.lineTo(scene.width, scene.height);
  context.lineTo(0, scene.height);
  context.closePath();
  context.fillStyle = 'rgba(12, 13, 30, .42)';
  context.fill();

  context.beginPath();
  context.ellipse(scene.width / 2, groundY + 22, scene.width * .36, 30, 0, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(145, 125, 223, .22)';
  context.lineWidth = 2;
  context.stroke();
}

function drawMotes() {
  scene.motes.forEach((mote) => {
    const x = mote.x + Math.sin(scene.time * mote.drift + mote.phase) * 16;
    const y = mote.y - (scene.time * 4 * mote.drift) % (scene.height * .35);
    const alpha = .2 + (Math.sin(scene.time * 1.6 + mote.phase) + 1) * .14;
    context.beginPath();
    context.arc(x, y, mote.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(175, 218, 255, ${alpha})`;
    context.shadowColor = 'rgba(112, 194, 255, .8)';
    context.shadowBlur = 8;
    context.fill();
    context.shadowBlur = 0;
  });
}

function drawMage(x, groundY, colors, direction) {
  const idle = Math.sin(scene.time * 2.2 + x) * 3;
  const bodyY = groundY - 112 + idle;
  const cloakBottom = groundY + 2 + idle;

  context.save();
  context.translate(x, 0);

  context.beginPath();
  context.ellipse(0, groundY + 4, 48, 9, 0, 0, Math.PI * 2);
  context.fillStyle = 'rgba(2, 4, 15, .48)';
  context.fill();

  context.beginPath();
  context.moveTo(-34, cloakBottom);
  context.quadraticCurveTo(-29, bodyY + 42, -19, bodyY + 12);
  context.lineTo(0, bodyY - 4);
  context.lineTo(19, bodyY + 12);
  context.quadraticCurveTo(29, bodyY + 42, 34, cloakBottom);
  context.quadraticCurveTo(0, cloakBottom + 14, -34, cloakBottom);
  context.fillStyle = colors.cloak;
  context.fill();
  context.strokeStyle = colors.edge;
  context.lineWidth = 2;
  context.stroke();

  context.beginPath();
  context.arc(0, bodyY - 18, 17, 0, Math.PI * 2);
  context.fillStyle = colors.face;
  context.fill();

  context.beginPath();
  context.moveTo(-24, bodyY - 22);
  context.lineTo(0, bodyY - 57);
  context.lineTo(25, bodyY - 22);
  context.closePath();
  context.fillStyle = colors.hat;
  context.fill();
  context.strokeStyle = colors.edge;
  context.stroke();

  context.beginPath();
  context.moveTo(-12, bodyY - 34);
  context.quadraticCurveTo(0, bodyY - 45, 14, bodyY - 34);
  context.strokeStyle = colors.band;
  context.lineWidth = 5;
  context.stroke();

  context.beginPath();
  context.moveTo(direction * 16, bodyY + 8);
  context.lineTo(direction * 43, bodyY - 24);
  context.strokeStyle = colors.staff;
  context.lineWidth = 4;
  context.stroke();
  context.beginPath();
  context.arc(direction * 45, bodyY - 27, 5 + Math.sin(scene.time * 2) * 1.5, 0, Math.PI * 2);
  context.fillStyle = colors.orb;
  context.shadowColor = colors.orb;
  context.shadowBlur = 16;
  context.fill();
  context.shadowBlur = 0;
  context.restore();
}

function render() {
  scene.time += 0.016;
  drawSky();
  drawStars();
  drawMoon();
  drawArena();
  drawMotes();
  const groundY = scene.height * .7;
  drawMage(scene.width * .25, groundY, { cloak: '#172d66', edge: '#72baff', face: '#d7b9a1', hat: '#203d86', band: '#8ed0ff', staff: '#a9c8ed', orb: '#64c5ff' }, 1);
  drawMage(scene.width * .75, groundY, { cloak: '#51264f', edge: '#e183bd', face: '#d7b9a1', hat: '#6c315f', band: '#e69bd0', staff: '#d3a4cf', orb: '#ff7ec6' }, -1);
  requestAnimationFrame(render);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
initializeLobby();
render();
