// =============================================
// 1. CANVAS Y CONTEXTO
// =============================================
const canvas = document.getElementById('escenario');
const ctx = canvas.getContext('2d');

// =============================================
// 2. CONFIGURACIÓN
// =============================================
const TAMANO_FRAME = 48;      // tamaño de cada frame dentro del sprite sheet (px)
const TAMANO_PERSONAJE = 72;  // tamaño con el que dibujamos al robot en el canvas (px)
const CAJA_ANCHO = 48;        // ancho de la caja de colisión, apoyada en los pies
const CAJA_ALTO = 40;         // alto de la caja de colisión
const OBSTACULO_ANCHO = 100;  // tamaño de cada obstáculo del mapa (px)
const OBSTACULO_ALTO = 70;
const VELOCIDAD = 4;          // píxeles que avanza en cada actualización
const INTERVALO = 40;         // milisegundos entre actualizaciones (25 por segundo)
const ACTUALIZACIONES_POR_FRAME = 4; // cada cuántas actualizaciones cambia el frame
const COLUMNA_REPOSO = 1;     // frame que se muestra cuando está quieto
const TOTAL_COLUMNAS = 4;     // frames por fila en el sprite sheet

// Cada dirección corresponde a una fila del sprite sheet
const FILAS = {
  abajo: 0,
  izquierda: 1,
  derecha: 2,
  arriba: 3,
};

// =============================================
// 3. ESTADO DEL PERSONAJE
// =============================================
let x = (canvas.width - TAMANO_PERSONAJE) / 2;  // empieza en el centro
let y = (canvas.height - TAMANO_PERSONAJE) / 2;
let direccion = 'abajo';
let seMueve = false;
let columna = COLUMNA_REPOSO;
let contador = 0;

const teclas = {
  arriba: false,
  abajo: false,
  izquierda: false,
  derecha: false,
};

// =============================================
// 4. IMÁGENES
// =============================================
const fondo = new Image();
fondo.src = 'assets/fondo.svg';

const sprite = new Image();
sprite.src = 'assets/robot-sprite.svg';

const spriteObstaculo = new Image();
spriteObstaculo.src = 'assets/obstaculo.svg';

// =============================================
// 5. TECLADO
// =============================================
// Convierte la tecla presionada en una dirección (o null si no nos interesa)
function teclaADireccion(tecla) {
  switch (tecla) {
    case 'ArrowUp':    case 'w': case 'W': return 'arriba';
    case 'ArrowDown':  case 's': case 'S': return 'abajo';
    case 'ArrowLeft':  case 'a': case 'A': return 'izquierda';
    case 'ArrowRight': case 'd': case 'D': return 'derecha';
    default: return null;
  }
}

document.addEventListener('keydown', (evento) => {
  const dir = teclaADireccion(evento.key);
  if (dir) {
    evento.preventDefault(); // evita que las flechas desplacen la página
    teclas[dir] = true;
  }
});

document.addEventListener('keyup', (evento) => {
  const dir = teclaADireccion(evento.key);
  if (dir) {
    teclas[dir] = false;
  }
});

// =============================================
// 6. MOVIMIENTO Y LÍMITES
// =============================================
function moverPersonaje() {
  seMueve = false;

  // 1) Averiguar la intención de movimiento (y hacia dónde mira)
  let dx = 0;
  let dy = 0;

  if (teclas.arriba)    { dy -= VELOCIDAD; direccion = 'arriba'; }
  if (teclas.abajo)     { dy += VELOCIDAD; direccion = 'abajo'; }
  if (teclas.izquierda) { dx -= VELOCIDAD; direccion = 'izquierda'; }
  if (teclas.derecha)   { dx += VELOCIDAD; direccion = 'derecha'; }

  // 2) Mover cada eje por separado: si un eje choca, el otro sigue
  //    (así el robot se desliza contra las paredes en diagonal)
  if (dx !== 0 && !hayColision(x + dx, y)) {
    x += dx;
    seMueve = true;
  }

  if (dy !== 0 && !hayColision(x, y + dy)) {
    y += dy;
    seMueve = true;
  }

  // 3) Límites: el personaje no puede salir del canvas
  const maxX = canvas.width - TAMANO_PERSONAJE;
  const maxY = canvas.height - TAMANO_PERSONAJE;

  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x > maxX) x = maxX;
  if (y > maxY) y = maxY;
}

// =============================================
// 7. ANIMACIÓN DEL SPRITE
// =============================================
function animarSprite() {
  if (!seMueve) {
    columna = COLUMNA_REPOSO;
    contador = 0;
    return;
  }

  contador++;
  if (contador >= ACTUALIZACIONES_POR_FRAME) {
    contador = 0;
    columna = (columna + 1) % TOTAL_COLUMNAS; // 0 → 1 → 2 → 3 → 0 ...
  }
}

// =============================================
// 8. DIBUJO
// =============================================
function dibujar() {
  // 1) Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2) Dibujar el fondo completo
  ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

  // 3) Dibujar los obstáculos del mapa (siempre debajo del robot)
  dibujarObstaculos();

  // 4) Recortar el frame actual del sprite sheet y dibujarlo
  const recorteX = columna * TAMANO_FRAME;
  const recorteY = FILAS[direccion] * TAMANO_FRAME;

  ctx.drawImage(
    sprite,
    recorteX, recorteY, TAMANO_FRAME, TAMANO_FRAME,  // qué parte del sprite sheet
    x, y, TAMANO_PERSONAJE, TAMANO_PERSONAJE         // dónde y de qué tamaño en el canvas
  );
}

// =============================================
// 9. ACTUALIZACIÓN PERIÓDICA
// =============================================
function actualizar() {
  moverPersonaje();
  animarSprite();
  dibujar();
}

// Esperamos a que carguen las tres imágenes antes de empezar
let imagenesCargadas = 0;

function imagenLista() {
  imagenesCargadas++;
  if (imagenesCargadas === 3) {
    setInterval(actualizar, INTERVALO);
  }
}

fondo.onload = imagenLista;
sprite.onload = imagenLista;
spriteObstaculo.onload = imagenLista;

// =============================================
// 10. MAPA DE COLISIONES
// =============================================
// Cada obstáculo ocupa un rectángulo de OBSTACULO_ANCHO x OBSTACULO_ALTO.
// Solo guardamos su esquina superior izquierda: el tamaño es común a todos.
const obstaculos = [
  { x:  80, y:  32 },                   , { x: 480, y:  32 }, // fila de arriba
  { x: 160, y: 160 },                                       , // fila del medio
  { x:  80, y: 288 },                     { x: 460, y: 288 }, // fila de abajo
];

// Caja de choque del robot: más chica que el sprite y apoyada en los pies.
// x, y son la esquina superior izquierda del sprite de 72 x 72.
function cajaPersonaje(px, py) {
  return {
    x: px + (TAMANO_PERSONAJE - CAJA_ANCHO) / 2,
    y: py + (TAMANO_PERSONAJE - CAJA_ALTO),
    ancho: CAJA_ANCHO,
    alto: CAJA_ALTO,
  };
}

// ¿La caja del robot en (px, py) se superpone con algún obstáculo?
function hayColision(px, py) {
  const caja = cajaPersonaje(px, py);

  return obstaculos.some(function (o) {
    return caja.x < o.x + OBSTACULO_ANCHO &&
           caja.x + caja.ancho > o.x &&
           caja.y < o.y + OBSTACULO_ALTO &&
           caja.y + caja.alto > o.y;
  });
}

// Dibuja cada obstáculo del mapa en su posición
function dibujarObstaculos() {
  obstaculos.forEach(function (o) {
    ctx.drawImage(spriteObstaculo, o.x, o.y, OBSTACULO_ANCHO, OBSTACULO_ALTO);
  });
}
