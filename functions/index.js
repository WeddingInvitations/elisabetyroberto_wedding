const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const SibApiV3Sdk = require("@sendinblue/client");
const XLSX = require("xlsx");

admin.initializeApp();

// Configurar Brevo/Sendinblue
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications["apiKey"];

// IMPORTANTE: Asegúrate de que la variable de entorno esté configurada
if (!process.env.BREVO_API_KEY) {
  logger.error("⚠️ BREVO_API_KEY no está configurada en las variables de entorno");
}
apiKey.apiKey = process.env.BREVO_API_KEY;

exports.enviarEmail = onRequest({cors: true}, async (req, res) => {
  // Manejar preflight CORS request
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  // Configurar CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  logger.info("Iniciando envío de email...", {structuredData: true});
  logger.info("Request body:", JSON.stringify(req.body, null, 2));

  const {nm, ph, att, ale, gue, bus, song, drink} = req.body;

  // Validar datos mínimos necesarios
  if (!nm || !ph) {
    logger.warn("Datos incompletos:", req.body);
    return res.status(400).json({message: "Faltan datos obligatorios"});
  }

  // Validar que la API key esté configurada
  if (!apiKey.apiKey) {
    logger.error("BREVO_API_KEY no está configurada");
    return res.status(500).json({
      error: "Error de configuración del servidor",
      message: "API key no configurada",
    });
  }

  let text = `Nombre: ${nm}\n`;
  text += `Teléfono: ${ph}\n`;
  text += `Alergias: ${ale || "Sin especificar"}\n`;
  text += `Canción: ${song || "Sin especificar"}\n`;
  text += `Bebida: ${drink || "Sin especificar"}\n`;
  text += `Transporte: ${bus || "Sin especificar"}\n\n`;

  if (!att || !gue || gue.length === 0) {
    text += "Acompañantes: No voy acompañado\n";
  } else {
    text += "Acompañantes:\n";
    gue.forEach((acompanante, index) => {
      text += `\tAcompañante ${index + 1}:\n`;
      text += `\t\tNombre: ${acompanante.Nombre || "Sin especificar"}\n`;
      text += `\t\tAlergias: ${acompanante.Alergias || "Sin especificar"}\n`;
      text += `\t\tBebida: ${acompanante.Bebida || "Sin especificar"}\n`;
      text += `\t\tCanción: ${acompanante.Cancion || "Sin especificar"}\n`;
      text += `\t\tTransporte: ${acompanante.Bus || "Sin especificar"}\n\n`;
    });
  }

  const email1 = "roberac88@gmail.com";
  const email2 = "eli.db3@gmail.com";

  // Crear el email para Brevo
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = {
    name: "Boda Eli y Rober",
    email: "weddinginvitationscampfire@gmail.com", // Asegúrate que este email esté verificado en Brevo
  };
  sendSmtpEmail.to = [
    {email: email1, name: "Rober"},
    {email: email2, name: "Eli"},
  ];
  sendSmtpEmail.subject = "Nueva asistencia registrada - Boda Eli y Rober";
  sendSmtpEmail.textContent = text;

  logger.info("Datos del email a enviar:", {
    to: sendSmtpEmail.to,
    subject: sendSmtpEmail.subject,
    hasContent: !!sendSmtpEmail.textContent,
  });

  try {
    logger.info("Intentando enviar email con Brevo...");

    // Enviar email con Brevo
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info("Email enviado exitosamente:", {
      messageId: result.messageId,
    });

    res.status(200).json({
      message: "Notificación enviada correctamente",
      messageId: result.messageId,
    });
  } catch (error) {
    // LOGS HABILITADOS para debugging
    logger.error("Error enviando email:", {
      message: error.message,
      response: error.response ? error.response.body : "No response body",
      status: error.response ? error.response.status : "No status",
    });

    res.status(500).json({
      error: "Error enviando notificación",
      message: error.message,
      details: error.response ? error.response.body : null,
    });
  }
});

// ...existing code... (función exportarInvitados sin cambios)
exports.exportarInvitados = onRequest({cors: true}, async (req, res) => {
  logger.info("Iniciando exportación de invitados a Excel...");

  try {
    // Obtener todos los documentos de la colección attendance
    const db = admin.firestore();
    const snapshot = await db.collection("attendance").get();

    if (snapshot.empty) {
      return res.status(404).json({message: "No hay invitados registrados"});
    }

    const invitados = [];
    let numeroFila = 1;

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Invitado principal
      const invitadoPrincipal = {
        "Nº": numeroFila++,
        "ID Documento": doc.id,
        "Tipo": "Principal",
        "Nombre": data.Nombre || "",
        "Teléfono": data.Teléfono || "",
        "Alergias": data.Alergias || "Sin alergias",
        "Bebida": data.Bebida || "",
        "Canción": data.Cancion || "",
        "Transporte": data.Bus || "NO",
        "Tiene Acompañantes": data.Asistencia ? "SÍ" : "NO",
        "Fecha Registro": data.timestamp ? new Date(data.timestamp).toLocaleDateString("es-ES") : "",
      };

      invitados.push(invitadoPrincipal);

      // Acompañantes (si los hay)
      if (data.Asistencia && data.Acompañantes && Array.isArray(data.Acompañantes)) {
        data.Acompañantes.forEach((acompanante, index) => {
          const acompananteData = {
            "Nº": numeroFila++,
            "ID Documento": doc.id,
            "Tipo": `Acompañante ${index + 1}`,
            "Nombre": acompanante.Nombre || "",
            "Teléfono": data.Teléfono || "",
            "Alergias": acompanante.Alergias || "Sin alergias",
            "Canción": acompanante.Cancion || "",
            "Transporte": acompanante.Bus || "NO",
            "Tiene Acompañantes": "N/A",
            "Fecha Registro": data.timestamp ? new Date(data.timestamp).toLocaleDateString("es-ES") : "",
          };

          invitados.push(acompananteData);
        });
      }
    });

    // Crear el libro de Excel
    const workbook = XLSX.utils.book_new();

    // Crear la hoja con los datos
    const worksheet = XLSX.utils.json_to_sheet(invitados);

    // Configurar el ancho de las columnas
    const columnWidths = [
      {wch: 5}, // Nº
      {wch: 20}, // ID Documento
      {wch: 15}, // Tipo
      {wch: 25}, // Nombre
      {wch: 15}, // Teléfono
      {wch: 20}, // Alergias
      {wch: 15}, // Plato Principal
      {wch: 12}, // Transporte
      {wch: 18}, // Tiene Acompañantes
      {wch: 15}, // Fecha Registro
    ];

    worksheet["!cols"] = columnWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invitados Boda");

    // Crear el buffer del archivo Excel
    const excelBuffer = XLSX.write(workbook, {type: "buffer", bookType: "xlsx"});

    // Configurar headers para descarga
    const fechaActual = new Date().toISOString().split("T")[0];
    const nombreArchivo = `Invitados_Boda_Eli_y_Rober_${fechaActual}.xlsx`;

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    logger.info(`Excel generado exitosamente con ${invitados.length} registros`);
    res.send(excelBuffer);
  } catch (error) {
    logger.error("Error exportando invitados:", error);
    res.status(500).json({
      error: "Error exportando invitados",
      details: error.message,
    });
  }
});
