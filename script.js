// 1. ESTADO DE LA APP (Memoria local)
let inventario = JSON.parse(localStorage.getItem('stock_data')) || [];
let cajaTotal = parseFloat(localStorage.getItem('stock_caja')) || 0;
let gananciaReal = parseFloat(localStorage.getItem('stock_ganancia_real')) || 0;

window.onload = () => {
    actualizarInterfaz();
};

// 2. NAVEGACIÓN (Estilo Luz & Orden)
function switchView(viewId, btn) {
    // Ocultar todas las vistas
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    // Desactivar todos los botones de la nav
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    // Activar lo seleccionado
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
            precioCompra: costePorUnidad,
            precioVenta: pVentaUnidad,
            stock: unidadesFinales
        };
        inventario.push(nuevoProd);
        guardarYActualizar();
        resetearFormulario();
        if(document.getElementById('divUnidadesPorCaja')) document.getElementById('divUnidadesPorCaja').style.display = 'none';
        switchView('view-inventory', document.querySelector('.nav-item'));
    }
}

function modificarStock(index, cantidad) {
    const prod = inventario[index];
    
    if (cantidad > 0) {
        // Ahora, al pulsar "+", preguntamos cuántos añadir
        const numAñadir = prompt(`¿Cuántas unidades de "${prod.nombre}" quieres añadir al stock?`, "1");
        
        // Convertimos lo que escribió el usuario a un número entero
        const valor = parseInt(numAñadir);

        // Si el usuario escribió un número válido, lo sumamos
        if (!isNaN(valor) && valor > 0) {
            prod.stock += valor;
            alert(`Se han añadido ${valor} unidades.`);
        } else {
            return; // Si cancela o pone algo raro, no hacemos nada
        }

    } else if (cantidad < 0 && prod.stock > 0) {
        // Para la venta (botón "-"), seguimos restando de 1 en 1 para evitar errores
        prod.stock += cantidad;
        cajaTotal += prod.precioVenta;
        gananciaReal += (prod.precioVenta - prod.precioCompra);
    }
    
    guardarYActualizar();
}

// 4. ACTUALIZACIÓN VISUAL
function guardarYActualizar() {
    localStorage.setItem('stock_data', JSON.stringify(inventario));
    localStorage.setItem('stock_caja', cajaTotal);
    localStorage.setItem('stock_ganancia_real', gananciaReal);
    actualizarInterfaz();
}

function actualizarInterfaz() {
    const lista = document.getElementById('listaProductos');
    if (!lista) return;

    lista.innerHTML = '';
    
    inventario.forEach((prod, i) => {
        const item = document.createElement('div');
        item.className = 'task-item gasto-item';
        
        // Calculamos la ganancia por unidad para mostrarla
        const gananciaPorUnidad = prod.precioVenta - prod.precioCompra;

        item.innerHTML = `
            <div style="flex:1">
                <strong style="color:var(--text)">${prod.nombre}</strong><br>
                <small style="color:var(--text-muted)">
                    PVP: ${prod.precioVenta.toFixed(2)}€ | 
                    Compra: ${prod.precioCompra.toFixed(2)}€ | 
                    <span style="color:var(--accent)">Ganas: ${gananciaPorUnidad.toFixed(2)}€</span>
                </small>
            </div>
            <div class="counter" style="display:flex; align-items:center; gap:10px; background:var(--nav-bg); padding:5px 10px; border-radius:12px;">
                <button onclick="modificarStock(${i}, -1)" style="background:none; border:none; color:var(--accent); font-size:1.2rem; cursor:pointer;">-</button>
                <span style="font-weight:bold; min-width:20px; text-align:center">${prod.stock}</span>
                <button onclick="modificarStock(${i}, 1)" style="background:none; border:none; color:var(--accent); font-size:1.2rem; cursor:pointer;">+</button>
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
        const texto = item.innerText.toLowerCase();
        item.style.display = texto.includes(filtro) ? 'flex' : 'none';
    });
}

function resetearFormulario() {
    document.getElementById('nombreProd').value = '';
    document.getElementById('precioCompraTotal').value = '';
    document.getElementById('precioVentaFinal').value = '';
}
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Stock Byte: SW Registrado'))
            .catch(err => console.log('Error al registrar SW', err));
    });
}
// Esta función muestra u oculta el campo de "cuántos vienen" según lo que elijas
function toggleCajaInput() {
    const tipo = document.getElementById('tipoEntrada').value;
    const divCaja = document.getElementById('divUnidadesPorCaja');
    divCaja.style.display = (tipo === 'caja') ? 'block' : 'none';
}

function procesarEntrada() {
    const nombre = document.getElementById('nombreProd').value;
    const pCompraTotal = parseFloat(document.getElementById('precioCompraTotal').value);
    const pVentaUnidad = parseFloat(document.getElementById('precioVentaFinal').value);
    const tipo = document.getElementById('tipoEntrada').value;
    
    let stockParaAñadir = 1;
    let costeUnitarioEfectivo = pCompraTotal;

    // Si es una caja, calculamos el coste de cada unidad
    if (tipo === 'caja') {
        const cantidadEnCaja = parseInt(document.getElementById('unidadesPorCaja').value);
        
        if (isNaN(cantidadEnCaja) || cantidadEnCaja <= 0) {
            alert("Por favor, indica cuántas unidades vienen en la caja.");
            return;
        }
        
        stockParaAñadir = cantidadEnCaja;
        // Matemáticas: Precio Caja / Cantidad = Precio por unidad
        costeUnitarioEfectivo = pCompraTotal / cantidadEnCaja;
    }

    if (nombre && !isNaN(pCompraTotal) && !isNaN(pVentaUnidad)) {
        const nuevoProd = {
            nombre: nombre,
            precioCompra: costeUnitarioEfectivo, // Guardamos lo que te cuesta CADA UNA
            precioVenta: pVentaUnidad,
            stock: stockParaAñadir // Se añade el total de unidades al inventario
        };

        inventario.push(nuevoProd);
        guardarYActualizar();
        resetearFormulario();
        
        // Ocultamos el campo de caja para la próxima vez
        document.getElementById('divUnidadesPorCaja').style.display = 'none';
        
        switchView('view-inventory', document.querySelector('.nav-item'));
    } else {
        alert("Rellena todos los datos para continuar.");
    }
}
function confirmarBorrado() {
    const respuesta = confirm("¿Estás seguro? Se borrarán todos los productos, la caja y las ganancias de forma permanente.");
    if (respuesta) {
        borrarTodo();
    }
}

function borrarTodo() {
    inventario = [];
    cajaTotal = 0;
    gananciaReal = 0;
    localStorage.removeItem('stock_data');
    localStorage.removeItem('stock_caja');
    localStorage.removeItem('stock_ganancia_real');
    actualizarInterfaz();
    alert("Historial borrado correctamente.");
}