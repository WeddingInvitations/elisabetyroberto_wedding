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
  // var busNo = document.getElementById("busNo");
  // var busSi = document.getElementById("busSi");


  checkboxSi.addEventListener("change", habilitarCampoAcompanante);
  checkboxNo.addEventListener("change", habilitarCampoAcompanante);
  // busSi.addEventListener("change", habilitarBus);
  // busNo.addEventListener("change", habilitarBus);
  
  // Usar delegación de eventos para todos los botones del popup
  document.addEventListener("click", function(event) {
    if (event.target && event.target.id === "addAcompananteButton") {
      event.preventDefault();
      addAcompanante();
    }
    if (event.target && event.target.id === "closeButton") {
      event.preventDefault();
      closePopup();
    }
    if (event.target && event.target.id === "guardarButton") {
      event.preventDefault();
      closePopup();
    }
    if (event.target && event.target.id === "overlay") {
      closePopup();
    }
  });
  
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

  // function habilitarBus(event) {
  //   // Desmarcar el otro checkbox
  //   if (busNo.checked && event.target === busSi) {
  //     busNo.checked = false;
  //   } else if (busSi.checked && event.target === busNo) {
  //     busSi.checked = false;
  //   }
  // }
    
  // Función para abrir el pop-up al hacer clic en "Sí, voy acompañado"
  function openPopup() {
    var popup = document.getElementById('popup');
    var overlay = document.getElementById('overlay');
    popup.style.display = 'block';
    overlay.style.display = 'block';
    
    // Configurar todos los botones del popup después de mostrarlo
    var addButton = document.getElementById('addAcompananteButton');
    var closeButton = document.getElementById('closeButton');
    var guardarButton = document.getElementById('guardarButton');
    
    // Botón añadir acompañante
    if (addButton) {
      addButton.removeEventListener("click", addAcompanante);
      addButton.addEventListener("click", addAcompanante);
    }
    
    // Botón cerrar (X)
    if (closeButton) {
      closeButton.removeEventListener("click", closePopup);
      closeButton.addEventListener("click", closePopup);
    }
    
    // Botón guardar
    if (guardarButton) {
      guardarButton.removeEventListener("click", closePopup);
      guardarButton.addEventListener("click", closePopup);
    }
    
    // También configurar click en overlay para cerrar
    if (overlay) {
      overlay.removeEventListener("click", closePopup);
      overlay.addEventListener("click", closePopup);
    }
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
  
  if (!popupContent) {
    console.error("No se encontró el contenedor accompaniments-list");
    return;
  }

  // Crea un nuevo elemento de párrafo (p)
  var nuevoParrafo = document.createElement('p');

  //Generar único id por fila de acompañante
  var uniqueId = generateUniqueId();

  // Añade campos para nombre, tipo y alergias
  nuevoParrafo.innerHTML = `
        <div class="acompanante">
          <input type="text" placeholder="Nombre del Acompañante" class="name">
          <br><br>
          <select class="type" name="tipo_acompanante[]">
            <option value="adulto">Adulto</option>
            <option value="adulto">Niño</option>
          </select>
          <br><br>
          <input type="text" placeholder="Alergias" class="allergies">
          <br><br>
          <input type="text" placeholder="¿Qué bebida quieres en la barra libre?" class="bebida">
          <br><br>
          <div>
            <div>
              <label><span id="subtitle">Transporte</span></label>
            </div>
            <select name="bus" id="bus">
              <option value="" selected disabled>-- Elige una opción --</option> <!-- Opción por defecto, seleccionada y deshabilitada -->
              <option value="No"> No </option>
              <option value="Bus1"> Bus 1: Desde Palencia </option>
              <option value="Bus2"> Bus 2: Desde Baltanás </option>
              <option value="Bus3"> Bus 3: Desde Villamuriel </option>
              <!-- Añade o quita las tallas que necesites -->
            </select>
          </div>
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
  var bebida = document.getElementById("bebida").value;
  var cancion = document.getElementById("cancion").value;

  // if (type) {
  //   type = "Adulto";
  // } else {
  //   type = "Niño";
  // }

  var busElement = document.getElementById("bus");

  var selectedIndex = busElement.selectedIndex;
  var selectedOption = busElement.options[selectedIndex];
  // 4. Obtienes el texto de esa opción seleccionada
  //    Usamos .text o .textContent (textContent es generalmente preferido)
  var bus = selectedOption.textContent; // o selectedOption.text
  
  // Crear un array para almacenar los acompañantes
  var acompanantes = [];

  // Si el checkbox de acompañado está marcado, agregar el acompañante al array
  if (attendance) {

    var acompananteElements = document.getElementsByClassName("acompanante");

    for (var i = 0; i < acompananteElements.length; i++) {
      var acompananteElement = acompananteElements[i];

      //lógica para obtener el valor del deslegable del bus

      var busElementAcomp = acompananteElement.querySelector("#bus");
      // console.log("busElementAcomp", busElementAcomp);
      var selectedIndexAcomp = busElementAcomp.selectedIndex;
      // console.log("selectedIndexAcomp", selectedIndexAcomp);
      var selectedOptionAcomp = busElementAcomp.options[selectedIndexAcomp];
      // console.log("selectedOptionAcomp", selectedOptionAcomp);

        // 4. Obtienes el texto de esa opción seleccionada
        //    Usamos .text o .textContent (textContent es generalmente preferido)
      var busAcomp = selectedOptionAcomp.textContent; // o selectedOption.text
      // console.log("busAcomp", busAcomp);

      // Obtener los valores de los campos del acompañante actual
      var acompanante = {
        Nombre: acompananteElement.querySelector(".name").value,
        TipoInvitado: acompananteElement.querySelector(".type").value,
        Alergias: acompananteElement.querySelector(".allergies").value,
        Bebida: acompananteElement.querySelector(".bebida").value,
        Bus: busAcomp
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
    Acompañantes: acompanantes,
    Cancion: cancion,
    Bebida: bebida
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
        gue: acompanantes,
        song: cancion,
        drink: bebida
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
  document.getElementById("bebida").value = "";
  document.getElementById("cancion").value = "";
  document.getElementById("bus").value = false;

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
    const response = await fetch('https://us-central1-elisabetyrobertowedding.cloudfunctions.net/enviarEmail', {
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