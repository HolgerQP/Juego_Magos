# 🧙‍♂️ Duelo Mágico

Juego de cartas y combate por turnos desarrollado como proyecto académico utilizando HTML, CSS y JavaScript.

## 🎮 Descripción

**Duelo Mágico** es un juego de combate entre dos magos. Cada jugador utiliza un mazo de 40 cartas con diferentes habilidades mágicas para atacar, defenderse, recuperar vida, obtener mana y mejorar sus estadísticas.

El proyecto incluye combate por turnos, animaciones, partículas, efectos de sonido y comunicación P2P mediante WebRTC.

## 🃏 Sistema de cartas

El juego utiliza 40 cartas basadas en 20 tipos diferentes de habilidades.

Cada jugador puede mantener un máximo de 5 cartas en su mano.

Las habilidades incluyen:

- 🔥 Ataques
- 🛡️ Defensas
- 💚 Curaciones
- ⚡ Mejoras
- 🌀 Habilidades especiales

Entre las cartas disponibles se encuentran Bola de fuego, Rayo, Lanza de hielo, Explosión arcana, Tornado, Meteorito, Orbe oscuro, Escudo mágico, Barrera, Reflejo mágico, Teletransporte, Curación, Regeneración, Gran curación, Poder arcano, Sobrecarga, Concentración, Sacrificio y Visión arcana.

## ⚔️ Combate

Las partidas funcionan mediante turnos. En cada turno el jugador roba una carta, recupera mana, utiliza una habilidad y después el turno pasa al oponente.

El objetivo es reducir los puntos de vida del rival hasta 0.

Cada jugador dispone de:

- ❤️ Vida
- 🔵 Mana
- 🛡️ Escudo
- 🃏 Mano de cartas

## ✨ Animaciones

Los hechizos tienen efectos visuales propios, incluyendo proyectiles, rayos, hielo, tornados, meteoritos, explosiones, escudos, curaciones, auras, teletransporte y partículas.

Las animaciones se ejecutan localmente mediante Canvas, CSS y JavaScript.

## 🔊 Audio

El proyecto utiliza **Web Audio API** para generar efectos de sonido y cuenta con música ambiental.

Incluye controles para:

- 🔊 Activar/desactivar sonido
- 🎵 Activar/desactivar música
- Volumen de efectos
- Volumen de música

Las preferencias se guardan mediante `localStorage`.

## 🌐 Multijugador P2P

El proyecto incorpora comunicación mediante **WebRTC** y `RTCDataChannel`.

La arquitectura utiliza un jugador host y un jugador invitado. El host mantiene el estado autoritativo de la partida y los clientes intercambian únicamente los eventos necesarios.

### 🔐 Privacidad de las cartas

La mano de cada jugador es privada.

Cuando un jugador roba una carta, el contenido se envía únicamente a ese jugador. El oponente recibe solamente una notificación pública de que se realizó un robo.

Cuando una carta es jugada, la acción pasa a ser información pública.

## 🔒 Seguridad

El proyecto está diseñado para ejecutarse dentro del navegador y no necesita acceso directo al sistema operativo.

No requiere:

- Ejecución de comandos de Windows
- Acceso arbitrario a archivos del usuario
- Cámara
- Micrófono
- Geolocalización
- Instalación de programas

WebRTC se utiliza exclusivamente para la comunicación del juego entre jugadores.

## 🛠️ Tecnologías

- HTML5
- CSS3
- JavaScript
- Canvas API
- Web Audio API
- WebRTC
- RTCDataChannel
- BroadcastChannel
- LocalStorage

El núcleo del juego no utiliza frameworks externos.

## 📁 Estructura

```text
Juego_Magos/
├── index.html
├── style.css
├── game.js
├── README.md
└── audio/
```

## ▶️ Ejecutar

El proyecto puede ejecutarse desde un navegador web.

Para las funciones de red se recomienda utilizar un servidor local o alojar el proyecto mediante HTTPS.

## 🚧 Estado del proyecto

- [x] Interfaz principal
- [x] Arena de combate
- [x] Sistema de cartas
- [x] Mazo de 40 cartas
- [x] Mano máxima de 5 cartas
- [x] Combate por turnos
- [x] Vida
- [x] Mana
- [x] Escudos
- [x] Efectos de cartas
- [x] Animaciones
- [x] Partículas
- [x] Sistema de audio
- [x] WebRTC
- [x] Conexión P2P de prueba
- [x] Sincronización de partida
- [x] Protección de la mano privada
- [ ] Signaling público para conexión entre dispositivos
- [ ] Pruebas finales entre diferentes redes
- [ ] Publicación definitiva

## 🎓 Propósito

Proyecto académico orientado a aplicar conceptos de programación web, programación orientada a eventos, lógica de programación, interfaces gráficas, desarrollo de videojuegos y comunicación P2P.

## 👨‍💻 Autor

**HolgerQP**

Proyecto académico - 2026.
