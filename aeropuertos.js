const buscador = document.getElementById("buscar-aeropuerto");
const resultadosBusqueda = document.getElementById("resultados-busqueda");
buscador.disabled = true;

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function mostrarAeropuertos(aeropuertos, total) {
    const limite = 50;
    const visibles = aeropuertos.slice(0, limite);
    const filas = document.createDocumentFragment();

    for (const aeropuerto of visibles) {
        const fila = document.createElement("tr");

        for (const valor of [
            aeropuerto.iata,
            aeropuerto.airport,
            aeropuerto.country_code
        ]) {
            const celda = document.createElement("td");
            celda.textContent = valor;
            fila.appendChild(celda);
        }

        filas.appendChild(fila);
    }

    document.getElementById("tabla-aeropuertos").replaceChildren(filas);

    resultadosBusqueda.textContent = aeropuertos.length === 0
        ? `No se encontraron aeropuertos. 0 de ${total} resultados.`
        : `Mostrando ${visibles.length} de ${aeropuertos.length} coincidencias (${total} aeropuertos en total).`;
}

async function cargarAeropuertos() {
    const respuesta = await fetch(
        "https://raw.githubusercontent.com/aashishvanand/airport-data-js/refs/heads/main/data/airports.json"
    );

    if (!respuesta.ok) {
        throw new Error(`Error al cargar los aeropuertos: ${respuesta.status}`);
    }

    const aeropuertos = await respuesta.json();

    if (!Array.isArray(aeropuertos) || !aeropuertos.every((aeropuerto) =>
        aeropuerto !== null &&
        typeof aeropuerto.iata === "string" &&
        typeof aeropuerto.airport === "string" &&
        typeof aeropuerto.country_code === "string"
    )) {
        throw new Error("El JSON no tiene el formato esperado.");
    }

    console.log("Total de aeropuertos:", aeropuertos.length);

    const indiceBusqueda = aeropuertos.map((aeropuerto) => ({
        aeropuerto,
        texto: normalizarTexto(
            `${aeropuerto.iata} ${aeropuerto.airport} ${aeropuerto.country_code}`
        )
    }));

    function filtrarAeropuertos() {
        const consulta = normalizarTexto(buscador.value.trim());

        let coincidencias;

        if (!consulta) {
            coincidencias = aeropuertos;
        } else {
            const porIata = aeropuertos.filter(
                (a) => normalizarTexto(a.iata) === consulta
            );

            const porPais = aeropuertos.filter(
                (a) => normalizarTexto(a.country_code) === consulta
            );

            if (porIata.length > 0) {
                coincidencias = porIata;
            } else if (porPais.length > 0) {
                coincidencias = porPais;
            } else {
                const nombreExacto = aeropuertos.filter(
                    (a) => normalizarTexto(a.airport) === consulta
                );

                coincidencias = nombreExacto.length > 0
                    ? nombreExacto
                    : aeropuertos.filter(
                        (a) => normalizarTexto(a.airport).includes(consulta)
                    );
            }
        }

        mostrarAeropuertos(coincidencias, aeropuertos.length);
    }

    buscador.addEventListener("input", filtrarAeropuertos);
    filtrarAeropuertos();
    buscador.disabled = false;
    document.getElementById("estado").textContent =
        `Total de aeropuertos: ${aeropuertos.length}`;
    return aeropuertos;
}

cargarAeropuertos().catch((error) => {
    console.error("No se pudieron cargar los aeropuertos:", error);
    document.getElementById("estado").textContent =
        `No se pudieron cargar los aeropuertos: ${error.message}`;
    resultadosBusqueda.textContent = "La búsqueda no está disponible porque no se pudieron cargar los datos.";
});
