// 1. ESTADO DE LA APP (Memoria local)
let inventario = JSON.parse(localStorage.getItem('stock_data')) || [];
let cajaTotal = parseFloat(localStorage.getItem('stock_caja')) || 0;
let gananciaReal = parseFloat(localStorage.getItem('stock_ganancia_real')) || 0;

window.onload = () => {
    actualizarInterfaz();
};

// 2. NAVEGACIÓN
function switchView(viewId, btn) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    document.getElementById(viewId).classList.add('active');
    if(btn) btn.classList.add('active');
    
    window.scrollTo(0,0);
}

// 3. GESTIÓN DE PRODUCTOS
function toggleCajaInput() {
    const tipo = document.getElementById('tipoEntrada').value;
    const divCaja = document.getElementById('divUnidadesPorCaja');
    if(divCaja) divCaja.style.display = (tipo === 'caja') ? 'block' : 'none';
}

function procesarEntrada() {
    const nombre = document.getElementById('nombreProd').value;
    const pCompraTotal = parseFloat(document.getElementById('precioCompraTotal').value);
    const pVentaUnidad = parseFloat(document.getElementById('precioVentaFinal').value);
    const tipo = document.getElementById('tipoEntrada').value;
    const codigo = document.getElementById('codigoProd').value;
    
    let unidadesFinales = 1;
    let costePorUnidad = pCompraTotal;

    if (tipo === 'caja') {
        const udsCaja = parseInt(document.getElementById('unidadesPorCaja').value);
        if (isNaN(udsCaja) || udsCaja <= 0) {
            alert("Indica cuántas unidades vienen en la caja");
            return;
        }
        unidadesFinales = udsCaja;
        costePorUnidad = pCompraTotal / udsCaja;
    }

    if (nombre && !isNaN(pCompraTotal) && !isNaN(pVentaUnidad)) {
        const nuevoProd = {
            nombre: nombre,
            codigo: codigo || "Sin código",
            precioCompra: costePorUnidad,
            precioVenta: pVentaUnidad,
            stock: unidadesFinales
        };

        inventario.push(nuevoProd);
        guardarYActualizar();
        resetearFormulario();
        
        if(document.getElementById('divUnidadesPorCaja')) {
            document.getElementById('divUnidadesPorCaja').style.display = 'none';
        }
        
        switchView('view-inventory', document.querySelector('.nav-item'));
    } else {
        alert("Por favor, rellena los campos obligatorios.");
    }
}

function modificarStock(index, cantidad) {
    const prod = inventario[index];
    
    if (cantidad > 0) {
        const numAñadir = prompt(`¿Cuántas unidades de "${prod.nombre}" quieres añadir?`, "1");
        const valor = parseInt(numAñadir);
        if (!isNaN(valor) && valor > 0) {
            prod.stock += valor;
            alert(`Añadidas ${valor} unidades.`);
        }
    } else if (cantidad < 0 && prod.stock > 0) {
        prod.stock += cantidad;
        cajaTotal += prod.precioVenta;
        gananciaReal += (prod.precioVenta - prod.precioCompra);
    }
    
    guardarYActualizar();
}

// 4. ESCÁNER (HTML5-QRCode)
let html5QrCodeSearch;

async function abrirEscanerBusqueda() {
    const container = document.getElementById('reader-search-container');
    container.style.display = 'block';
    
    html5QrCodeSearch = new Html5Qrcode("reader-search");
    
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0 
    };

    try {
        await html5QrCodeSearch.start(
            { facingMode: "environment" }, 
            config,
            (decodedText) => {
                // Inserta el código en el buscador
                const input = document.getElementById('buscador');
                input.value = decodedText;
                
                // Ejecuta el filtro de la lista
                filtrarProductos();
                
                // Cierra cámara y vibra
                cerrarEscanerBusqueda();
                if (navigator.vibrate) navigator.vibrate(200);
            }
        );
    } catch (err) {
        console.error("Error al abrir cámara:", err);
        alert("No se pudo acceder a la cámara.");
        container.style.display = 'none';
    }
}

function cerrarEscanerBusqueda() {
    if (html5QrCodeSearch) {
        html5QrCodeSearch.stop().then(() => {
            document.getElementById('reader-search-container').style.display = 'none';
            html5QrCodeSearch = null;
        }).catch(err => console.error("Error al detener cámara:", err));
    } else {
        document.getElementById('reader-search-container').style.display = 'none';
    }
}
let html5QrCode;

async function abrirEscaner() {
    document.getElementById('reader-container').style.display = 'block';
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    try {
        await html5QrCode.start(
            { facingMode: "environment" }, 
            config,
            (decodedText) => {
                document.getElementById('codigoProd').value = decodedText;
                cerrarEscaner();
                vibrar();
            }
        );
    } catch (err) {
        alert("Error al abrir cámara. Asegúrate de dar permisos.");
    }
}

function cerrarEscaner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader-container').style.display = 'none';
        });
    }
}

// 5. ACTUALIZACIÓN Y PERSISTENCIA
function guardarYActualizar() {
    localStorage.setItem('stock_data', JSON.stringify(inventario));
    localStorage.setItem('stock_caja', cajaTotal.toString());
    localStorage.setItem('stock_ganancia_real', gananciaReal.toString());
    actualizarInterfaz();
}

function actualizarInterfaz() {
    const lista = document.getElementById('listaProductos');
    if (!lista) return;

    lista.innerHTML = '';
    
    inventario.forEach((prod, i) => {
        const item = document.createElement('div');
        item.className = 'task-item gasto-item';
        const gananciaPorUnidad = prod.precioVenta - prod.precioCompra;

        item.innerHTML = `
            <div style="flex:1">
                <strong style="color:var(--text)">${prod.nombre}</strong><br>
                <small style="color:var(--text-muted)">
                    Cod: ${prod.codigo} | PVP: ${prod.precioVenta.toFixed(2)}€<br>
                    <span style="color:var(--accent)">Margen: ${gananciaPorUnidad.toFixed(2)}€</span>
                </small>
            </div>
            <div class="counter">
                <button onclick="modificarStock(${i}, -1)">-</button>
                <span>${prod.stock}</span>
                <button onclick="modificarStock(${i}, 1)">+</button>
            </div>
        `;
        lista.appendChild(item);
    });

    document.getElementById('cajaActual').textContent = cajaTotal.toFixed(2);
    document.getElementById('gananciaReal').textContent = gananciaReal.toFixed(2);
}

function filtrarProductos() {
    const filtro = document.getElementById('buscador').value.toLowerCase();
    const items = document.querySelectorAll('.task-item');
    items.forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(filtro) ? 'flex' : 'none';
    });
}

function resetearFormulario() {
    document.getElementById('nombreProd').value = '';
    document.getElementById('precioCompraTotal').value = '';
    document.getElementById('precioVentaFinal').value = '';
    document.getElementById('codigoProd').value = '';
}

function borrarTodo() {
    if (confirm("¿Estás seguro? Se borrarán todos los productos y el balance de caja.")) {
        inventario = [];
        cajaTotal = 0;
        gananciaReal = 0;
        localStorage.clear();
        actualizarInterfaz();
    }
}

function vibrar() {
    if (navigator.vibrate) navigator.vibrate(200);
}

// 6. SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
    });
}