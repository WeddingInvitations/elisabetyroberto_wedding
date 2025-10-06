import { firebaseApp } from "./firebaseConfig.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Acceder a Firestore y guardar los datos
const db = getFirestore(firebaseApp);
const inputFields = document.querySelectorAll(".form-group input"); // Obtén todos los campos de entrada en el formulario

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  // Seleccionar los elementos después de que el DOM esté cargado
  var checkboxNo = document.getElementById("acompanadoNo");
  var checkboxSi = document.getElementById("acompanadoSi");
  var busNo = document.getElementById("busNo");
  var busSi = document.getElementById("busSi");
  var carne = document.getElementById("carne");
  var pescado = document.getElementById("pescado");


  checkboxSi.addEventListener("change", habilitarCampoAcompanante);
  checkboxNo.addEventListener("change", habilitarCampoAcompanante);
  busSi.addEventListener("change", habilitarBus);
  busNo.addEventListener("change", habilitarBus);
  carne.addEventListener("change", habilitarComida);
  pescado.addEventListener("change", habilitarComida);
  
  // Función para habilitar el check acom y abrir pop up
  function habilitarCampoAcompanante(event) {
    // Desmarcar el otro checkbox
    if (checkboxNo.checked && event.target === checkboxSi) {
      checkboxNo.checked = false;
    } else if (checkboxSi.checked && event.target === checkboxNo) {
      checkboxSi.checked = false;
    }

    // Limpiar el campo si 'acompanado' es falso
    if (checkboxSi.checked && event.target === checkboxSi) {
      openPopup();
    }
  }

  function habilitarBus(event) {
    // Desmarcar el otro checkbox
    if (busNo.checked && event.target === busSi) {
      busNo.checked = false;
    } else if (busSi.checked && event.target === busNo) {
      busSi.checked = false;
    }
  }

  function habilitarComida(event) {
    // Desmarcar el otro checkbox
    if (pescado.checked && event.target === carne) {
      pescado.checked = false;
    } else if (carne.checked && event.target === pescado) {
      carne.checked = false;
    }
  }
    
  // Función para abrir el pop-up al hacer clic en "Sí, voy acompañado"
  function openPopup() {
    var popup = document.getElementById('popup');
    var overlay = document.getElementById('overlay');
    popup.style.display = 'block';
    overlay.style.display = 'block';
  }


  //Función para cerrar el pop-up
  var closeButton = document.getElementById('closeButton');
  var guardarButton = document.getElementById('guardarButton');
  var overlay = document.getElementById('overlay');
  if (closeButton) {
    closeButton.addEventListener("click", closePopup);
    overlay.style.display = 'none';
  }
  if (guardarButton) {
    guardarButton.addEventListener("click", closePopup);
    overlay.style.display = 'none';
  }

  // Función para añadir acompañantes
  var addButton = document.getElementById('addAcompananteButton');
  if (addButton) {
    addButton.addEventListener("click", addAcompanante);
  }
});





//////////////////////////////////////// FUNCIONES //////////////////////////////////////////////////////////////

// Función para cerrar el pop-up
function closePopup() {
  var popup = document.getElementById('popup');
  var overlay = document.getElementById('overlay');
  popup.style.display = 'none';
  overlay.style.display = 'none';
}

function addAcompanante() {
  // Obtén el contenedor en el que agregarás la nueva línea
  var popupContent = document.getElementById('accompaniments-list');

  // Crea un nuevo elemento de párrafo (p)
  var nuevoParrafo = document.createElement('p');

  //Generar único id por fila de acompañante
  var uniqueId = generateUniqueId();

  // Añade campos para nombre, tipo y alergias
  nuevoParrafo.innerHTML = `
        <div class="acompanante">
          <input type="text" placeholder="Nombre del Acompañante" class="name">
          <select class="type" name="tipo_acompanante[]">
            <option value="adulto">Adulto</option>
            <option value="adulto">Niño</option>
          </select>
          <input type="text" placeholder="Alergias" class="allergies">
          <select class="comida" name="comida">
            <option value="carne">Carne</option>
            <option value="pescado">Pescado</option>
          </select>
          <br><br>
          <button id="deleteAcompananteButton">Borrar Acompañante</button>
        </div>
        `;

  // Agrega el nuevo párrafo al contenido del pop-up
  popupContent.appendChild(nuevoParrafo);

  // Eliminar acompañantes
  var rmButton = nuevoParrafo.querySelector('#deleteAcompananteButton');
  if (rmButton) {
    rmButton.addEventListener("click", function() {
      deleteAcompanante(nuevoParrafo);
    });
  }
}

function deleteAcompanante(btn) {
  // Obtén el elemento padre (la línea de acompañante) del botón que fue clicado
  var acompananteContainer = btn;

  // Verifica si hay al menos una línea de acompañante para eliminar
  if (acompananteContainer) {
    // Elimina la línea de acompañante específica
    acompananteContainer.parentNode.removeChild(acompananteContainer);
  }
}


// Función para guardar en firestore los datos
document.getElementById('attendance-form').addEventListener("submit", function (event) {
  event.preventDefault(); // Evitar el envío predeterminado del formulario.

  // Obtener los valores de los campos del formulario
  var name = document.getElementById("nombre").value;
  var phone = document.getElementById("telefono").value;
  var allergies = document.getElementById("alergias").value;
  var attendance = document.getElementById("acompanadoSi").checked;

  // if (type) {
  //   type = "Adulto";
  // } else {
  //   type = "Niño";
  // }

  var bus = document.getElementById("busSi").checked;
  var comida = document.getElementById("carne").checked;

  if (comida) {
    comida = "Carne";
  } else {
    comida = "Pescado";
  }
  
  // Crear un array para almacenar los acompañantes
  var acompanantes = [];

  // Si el checkbox de acompañado está marcado, agregar el acompañante al array
  if (attendance) {

    var acompananteElements = document.getElementsByClassName("acompanante");

    for (var i = 0; i < acompananteElements.length; i++) {
      var acompananteElement = acompananteElements[i];
      // Obtener los valores de los campos del acompañante actual
      var acompanante = {
        Nombre: acompananteElement.querySelector(".name").value,
        TipoInvitado: acompananteElement.querySelector(".type").value,
        Alergias: acompananteElement.querySelector(".allergies").value,
        Comida: acompananteElement.querySelector(".comida").value
      };

      // acompanantes.push(acompanante);
      acompanantes.push(Object.assign({}, acompanante));

    }

  }

  // Dentro de la colección principal, obtén una referencia a la subcolección "attendance"
  const docRef = collection(db, "attendance");

  addDoc(docRef, {
    Nombre: name,
    Teléfono: phone,
    Asistencia: attendance,
    Alergias: allergies,
    Bus: bus,
    Comida: comida,
    Acompañantes: acompanantes
  })
    .then(function (docRef) {
      console.log("Documento agregado con ID: ", docRef.id);
      // Mostrar un mensaje de éxito en el HTML
      mostrarMensajeExito();

      //Enviar datos al email
      const emailData = {
        nm: name,
        ph: phone,
        att: attendance,
        ale: allergies,
        bus: bus,
        comida: comida,
        gue: acompanantes
      };
      enviarEmail(emailData);

    })
    .catch(function (error) {
      console.error("Error al agregar el documento: ", error);
    });

  //Limpiar los campos del formulario.
  document.getElementById("nombre").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("alergias").value = "";
  document.getElementById("acompanadoSi").checked = "";
  document.getElementById("acompanadoNo").checked = "";
  document.getElementById("busSi").checked = "";
  document.getElementById("busNo").checked = "";
  document.getElementById("carne").checked = "";
  document.getElementById("pescado").checked = "";
  // document.getElementById("adulto").checked = "";
  // document.getElementById("nino").checked = "";

});


// Función para mostrar el pop-up de éxito
function mostrarMensajeExito() {
  var mensajeExito = document.getElementById("mensaje-exito-modal");
  mensajeExito.style.display = "block";

  // Cerrar el modal cuando se haga clic en la "x"
  var closeMensajeExito = document.getElementById("cerrar-modal");
  closeMensajeExito.addEventListener("click", function () {
    mensajeExito.style.display = "none";
  });

  //Cerrar el modal pasados 3segundos
  setTimeout(function () {
    ocultarMensajeExito(); // Llama a la función para ocultar la modal
  }, 3000); // 3000 ms = 3 segundos

  // Restablecer las etiquetas
  inputFields.forEach(function (input) {
    const label = input.previousElementSibling;
    label.style.display = "block";
  });
}

// Función para ocultar el pop-up de éxito
function ocultarMensajeExito() {
  var mensajeExito = document.getElementById("mensaje-exito-modal");
  mensajeExito.style.display = "none";
}

function generateUniqueId() {
  return Date.now();
}


// Función para llamar a Cloud Functions
async function enviarEmail(emailData) {

  console.log("Email data: ", emailData);
  // Enviar los datos al servidor
  try {
    const response = await fetch('https://us-central1-cristianymariawedding.cloudfunctions.net/enviarEmail', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
    });

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error);
  }
}