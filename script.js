// ==========================================
// 1. CARRUSEL INFINITO Y ARRASTRABLE (MÉTODO DE CLONES)
// ==========================================
const track = document.getElementById('carousel-track');
const wrapper = document.querySelector('.carousel-wrapper');

// Bloqueamos nativamente que la imagen se intente "guardar" al arrastrarla
track.addEventListener('dragstart', (e) => e.preventDefault());

let slides = Array.from(track.children);

// Clonamos la primera y última imagen para crear la ilusión de infinito perfecto
const firstClone = slides[0].cloneNode(true);
const lastClone = slides[slides.length - 1].cloneNode(true);

firstClone.id = 'first-clone';
lastClone.id = 'last-clone';

track.appendChild(firstClone);
track.insertBefore(lastClone, slides[0]);

// Actualizamos la lista de slides incluyendo los nuevos clones
slides = Array.from(track.children);

let currentIndex = 1; // Empezamos en la primera imagen original (índice 1)
let isDragging = false;
let startX = 0;
let currentTranslate = 0;
let prevTranslate = currentIndex * -100;
let intervalo;

// Posición inicial sin animación
track.style.transform = `translateX(${prevTranslate}%)`;

function iniciarIntervalo() {
    clearInterval(intervalo);
    intervalo = setInterval(siguienteSlide, 5000);
}

function siguienteSlide() {
    if (currentIndex >= slides.length - 1) return; 
    currentIndex++;
    track.style.transition = 'transform 0.5s ease-in-out';
    track.style.transform = `translateX(${currentIndex * -100}%)`;
}

// MAGIA INFINITA: Cuando termina la transición, revisamos si estamos viendo un clon
track.addEventListener('transitionend', () => {
    if (slides[currentIndex].id === 'first-clone') {
        track.style.transition = 'none';
        currentIndex = 1; // Brinco silencioso a la imagen original 1
        track.style.transform = `translateX(${currentIndex * -100}%)`;
    }
    if (slides[currentIndex].id === 'last-clone') {
        track.style.transition = 'none';
        currentIndex = slides.length - 2; // Brinco silencioso a la última imagen original
        track.style.transform = `translateX(${currentIndex * -100}%)`;
    }
});

// --- LÓGICA DE ARRASTRE (MOUSE Y TOUCH) ---
track.addEventListener('mousedown', dragStart);
track.addEventListener('touchstart', dragStart, {passive: true});
track.addEventListener('mousemove', drag);
track.addEventListener('touchmove', drag, {passive: true});
track.addEventListener('mouseup', dragEnd);
track.addEventListener('mouseleave', dragEnd);
track.addEventListener('touchend', dragEnd);

function dragStart(e) {
    isDragging = true;
    clearInterval(intervalo); // Pausamos el temporizador mientras arrastra
    
    // Obtenemos la coordenada X dependiendo de si es ratón o dedo
    startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    
    track.style.transition = 'none'; // Quitamos la animación para que la imagen siga al dedo
    prevTranslate = currentIndex * -100; 
    currentTranslate = prevTranslate; 
}

function drag(e) {
    if (!isDragging) return;
    
    let actualX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    const diffX = actualX - startX;
    
    // Calculamos el porcentaje arrastrado relativo al ancho del contenedor
    const movePercentage = (diffX / wrapper.clientWidth) * 100;
    currentTranslate = prevTranslate + movePercentage;
    
    track.style.transform = `translateX(${currentTranslate}%)`;
}

function dragEnd() {
    if (!isDragging) return;
    isDragging = false;

    const movedPercentage = currentTranslate - prevTranslate;

    // Si se arrastró más de un 15% hacia un lado, cambiamos a la siguiente foto
    if (movedPercentage < -15) {
        currentIndex++;
    } else if (movedPercentage > 15) {
        currentIndex--;
    }

    // Volvemos a activar la animación para que termine de acomodarse
    track.style.transition = 'transform 0.3s ease-in-out';
    track.style.transform = `translateX(${currentIndex * -100}%)`;
    
    iniciarIntervalo(); // Reanudamos el temporizador
}
iniciarIntervalo();

// ==========================================
// 2. LÓGICA DE BOLETOS 
// ==========================================
const totalBoletos = 3000; 
let seleccionados = [];
let disponibles = [];
let vendidos = [];

const grid = document.getElementById('grid-boletos');
const stickyPanel = document.getElementById('sticky-panel-container');
const txtNumeros = document.getElementById('numeros-seleccionados');
const txtContador = document.getElementById('contador-boletos');

function crearCuadricula() {
    for (let i = 1; i <= totalBoletos; i++) {
        let numStr = i.toString().padStart(5, '0');
        let div = document.createElement('div');
        div.className = 'boleto';
        div.id = 'boleto-' + numStr;
        div.innerText = numStr;

        if (Math.random() < 0.65) { 
            div.classList.add('vendido');
            vendidos.push(numStr);
        } else {
            disponibles.push(numStr);
            div.onclick = () => seleccionarBoleto(numStr);
        }
        grid.appendChild(div);
    }
}

// ==========================================
// 3. SELECCIÓN DE BOLETOS
// ==========================================
function seleccionarBoleto(num) {
    if (!seleccionados.includes(num)) {
        seleccionados.push(num);
        let elementoHTML = document.getElementById('boleto-' + num);
        if(elementoHTML) {
            elementoHTML.classList.add('seleccionado'); 
        }
        seleccionados.sort();
        actualizarPanel();
        validarBuscador(); 
    }
}

function eliminarBoleto(num) {
    seleccionados = seleccionados.filter(n => n !== num);
    let elementoHTML = document.getElementById('boleto-' + num);
    if(elementoHTML) {
        elementoHTML.classList.remove('seleccionado'); 
    }
    actualizarPanel();
    validarBuscador(); 
}

function actualizarPanel() {
    if (seleccionados.length > 0) {
        stickyPanel.style.display = 'block'; 
        txtNumeros.innerHTML = '';
        
        seleccionados.forEach(num => {
            let btnObj = document.createElement('div');
            btnObj.className = 'boleto-arriba';
            btnObj.innerText = num;
            btnObj.onclick = () => eliminarBoleto(num);
            txtNumeros.appendChild(btnObj);
        });

        let texto = seleccionados.length === 1 ? 'BOLETO SELECCIONADO' : 'BOLETOS SELECCIONADOS';
        txtContador.innerText = `${seleccionados.length} ${texto}`;
    } else {
        stickyPanel.style.display = 'none'; 
    }
}

// ==========================================
// 4. LÓGICA DEL BUSCADOR EN VIVO
// ==========================================
const buscadorInput = document.getElementById('buscador-input');
const resDiv = document.getElementById('resultado-busqueda');
const estadoIcono = document.getElementById('estado-icono');
const estadoTexto = document.getElementById('estado-texto');
const btnElegirBusqueda = document.getElementById('btn-elegir-busqueda');

const iconCheck = `<svg viewBox="36 47 128 106" xmlns="http://www.w3.org/2000/svg"><g><path d="M136.701 58.951l15.34 15.323-66.836 66.777-37.247-37.207 15.34-15.328L85.205 110.4l51.496-51.449zm0-11.951L85.204 98.454 63.297 76.569 36 103.846 85.205 153 164 74.274 136.701 47z" fill="green"></path></g></svg>`;

const iconCross = `<svg viewBox="43.5 43.5 113 113" xmlns="http://www.w3.org/2000/svg"><g><path d="M129.207 55.466l15.329 15.329L115.33 100l29.205 29.203-15.329 15.331-29.207-29.205-29.206 29.205-15.33-15.331L84.67 100 55.464 70.795l15.33-15.329L100 84.669l29.207-29.203zm0-11.966L99.999 72.705 70.793 43.5 43.5 70.795 72.705 100 43.5 129.201 70.793 156.5l29.206-29.205 29.207 29.205 27.293-27.299L127.295 100 156.5 70.795 129.207 43.5z" fill="red"></path></g></svg>`;

buscadorInput.addEventListener('input', validarBuscador);

function validarBuscador() {
    let val = buscadorInput.value.trim();
    const btnMaquinita = document.querySelector('.btn-outline'); 
    
    if(val.length === 0) {
        resDiv.style.display = 'none';
        if(btnMaquinita) btnMaquinita.style.display = 'block'; 
        return;
    }

    let numBuscado = val.padStart(5, '0');
    resDiv.style.display = 'block';

    if (seleccionados.includes(numBuscado)) {
        estadoIcono.innerHTML = `${iconCross} Número ya seleccionado por ti`;
        estadoIcono.style.color = "var(--red-btn)";
        estadoTexto.style.display = 'none';
        btnElegirBusqueda.style.display = 'none';
        if(btnMaquinita) btnMaquinita.style.display = 'block'; 
    } else if (vendidos.includes(numBuscado) || !disponibles.includes(numBuscado)) {
        estadoIcono.innerHTML = `${iconCross} Número no disponible`;
        estadoIcono.style.color = "var(--red-btn)";
        estadoTexto.style.display = 'none';
        btnElegirBusqueda.style.display = 'none';
        if(btnMaquinita) btnMaquinita.style.display = 'block'; 
    } else {
        estadoIcono.innerHTML = `${iconCheck} Número disponible`;
        estadoIcono.style.color = "#000"; 
        estadoTexto.innerHTML = `Éstos serían tus números: <strong>${numBuscado}</strong>`;
        estadoTexto.style.display = 'block';
        
        btnElegirBusqueda.style.display = 'inline-block';
        if(btnMaquinita) btnMaquinita.style.display = 'none'; 
        
        btnElegirBusqueda.onclick = function() {
            seleccionarBoleto(numBuscado);
            buscadorInput.value = ''; 
            resDiv.style.display = 'none'; 
            if(btnMaquinita) btnMaquinita.style.display = 'block'; 
        };
    }
}

// ==========================================
// 5. LÓGICA DE LA MAQUINITA DE LA SUERTE
// ==========================================
const modal = document.getElementById('modal-maquinita');
const btnTirar = document.getElementById('btn-tirar');
const btnAceptar = document.getElementById('btn-aceptar-azar');
const divNumerosAzar = document.getElementById('numeros-azar');

function abrirModal() {
    modal.style.display = 'flex';
    btnTirar.style.display = 'block';
    btnAceptar.style.display = 'none';
    divNumerosAzar.style.display = 'none';
}

function cerrarModal() { modal.style.display = 'none'; }

function generarAlAzar() {
    let cantidad = parseInt(document.getElementById('select-cantidad').value);
    let elegidosAzar = [];

    for(let i=0; i < cantidad; i++) {
        if(disponibles.length > 0) {
            let indiceRandom = Math.floor(Math.random() * disponibles.length);
            let numElegido = disponibles[indiceRandom];
            
            if(!seleccionados.includes(numElegido) && !elegidosAzar.includes(numElegido)) {
                elegidosAzar.push(numElegido);
                disponibles.splice(indiceRandom, 1);
            } else { i--; }
        }
    }

    elegidosAzar.forEach(num => { seleccionarBoleto(num); });

    btnTirar.style.display = 'none';
    divNumerosAzar.innerText = elegidosAzar.join(', ');
    divNumerosAzar.style.display = 'block';
    btnAceptar.style.display = 'block';
}

// ==========================================
// 6. INICIALIZACIÓN
// ==========================================
window.onload = () => {
    crearCuadricula(); 
};

// ==========================================
// 7. OCULTAR PÍLDORA DE "SEGUROS" AL HACER SCROLL
// ==========================================
const pillSeguro = document.getElementById('pill-seguro');
if (pillSeguro) {
    window.addEventListener('scroll', () => {
        // Se oculta después de bajar 200px (pasando el banner inicial)
        if (window.scrollY > 200) {
            pillSeguro.classList.add('oculto');
        } else {
            pillSeguro.classList.remove('oculto');
        }
    });
}