import Express from 'express';
import ws from 'ws';
import Sequelize from 'sequelize';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';

const app = Express();
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(cors())

const ipXlab = '10.200.0.74'

// SASS
const sql_lis = new Sequelize({
  host: '10.200.0.47',
  username: 'Noe',
  password: 'No32020123!',
  database: 'certus',
  dialect: 'mssql',
  logging: false,
  dialectOptions: {
    options: {
      trustServerCertificate: true,
      requestTimeout: 50000,
      encrypt: false
    }
  }
});

// API
const sql_api = new Sequelize({
  dialect: 'mssql',
  host: ipXlab,
  port: '1443',
  username: 'sa',
  password: 'Vco$980224',
  database: 'CitasCovid',
  dialectOptions:{
    instanceName: 'SQL2008',
    options: {
      trustServerCertificate: true,
      requestTimeout: 50000,
      encrypt: false
    }
  },
  logging: false
});

// RH para leer el nombre del usuario
const sql_rh = new Sequelize({
  dialect: 'mysql',
  host: '10.200.0.56',
  username: 'remoto',
  password: 'Sis664!',
  database: 'rh',
  logging: false,
  dialectOptions:{
    /*
    options: {
      requestTimeout: 50000
    }
    */
  },
});


// WebSockets para la api
let wsPort = 8013;
let wsObj = null;
const wssApi = new ws.Server({ port: wsPort });
wssApi.on("error", (error) => {
  console.log('Error en ws | Codigo:', error.code, ' | Se requiere reiniciar el servicio');
  if (error.code == 'EADDRINUSE') {
    //wssApi.close();
    //wssApi = new ws.Server({ port: wsPort });
  }
});

wssApi.on('connection',  (ws, req, res) => {
  wsObj = ws;
  console.log('Conectado', req.connection.remoteAddress);
  ws.send('{"codigo": "msg", "msg": "Bienvenid@"}');
  ws.on('message', message => {
    console.log(`Mensaje recibido: ${message}`)
  })
});


// Notificacion al Agente de orden nueva (viene de 10.200.0.30/his/api/orden.php)
function wsNotificacion(objeto) {
  console.log('Recibiendo resultados | Orden ' + objeto.orden);

  if (wsObj != null) {
    console.log('Notificando resultados al cliente', objeto);
    wssApi.clients.forEach(function each(client) {
      if (client.readyState === ws.OPEN) {
        let json = {
          orden: objeto.orden,
          hora: new Date().toLocaleString([], {timeZone: 'America/Tijuana', hour: '2-digit', minute: '2-digit', hour12: true}),
        };
        client.send(JSON.stringify(objeto));
      }
    });
  }
}; // wsNotificacion()


// Funcion para control de mensajes en consola (middleware)
const mdi = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  console.log('-------------------------------------------------------');
  console.log(new Date().toLocaleString('es-MX', {timeZone: "America/Tijuana"}));
  console.log('req.query', req.query);
  console.log('req.params', req.params);
  next();
};


// Afectación a las BD
const afectaBD = (opt, id_toma, orden, enviado = 'P', respuesta = '', respuestaCompleta = '', userId = '', userName = '', envio = '') => {

  let qry = '';
  let fecha = new Date();
  let fechaEnvio = '';
  let hora = fecha.toLocaleTimeString('es-MX', {timeZone: 'America/Tijuana'});

  if (enviado == 'S') {
    fechaEnvio = fecha.toLocaleDateString('es-MX', {
      timeZone: 'America/Tijuana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    fechaEnvio = (fechaEnvio + ' ' + hora);
  } else if (enviado == 'P') {
    fechaEnvio = '';
  }

  //  if (opt == 'insert') {
    if (enviado == 'P') {  // Estatus
      // No genera histórico
      qry = `DECLARE @id varchar(32)
      IF NOT EXISTS (SELECT id_toma FROM indre WHERE id_toma=${id_toma})
        BEGIN
          SET @id = REPLACE(NEWID(), '-', '')
          INSERT INTO indre (id, id_toma, orden, envio, enviado, respuesta, respuestaCompleta, userId, userName, fechaEnvio, fecha)
          VALUES (@id, ${id_toma}, '${orden}', '${envio}', '${enviado}', '${respuesta}', '${respuestaCompleta}', '${userId}', '${userName}', NULL,  GETDATE())
        END
      ELSE
        BEGIN
          UPDATE indre
          SET enviado='${enviado}',
              envio='${envio}',
              respuesta='${respuesta}',
              respuestaCompleta='${respuestaCompleta}',
              userId='${userId}',
              userName='${userName}',
              @id = id
          WHERE id_toma=${id_toma}
        END `;
    } else {
      qry = `DECLARE @id varchar(32)
      IF NOT EXISTS (SELECT id_toma FROM indre WHERE id_toma=${id_toma})
        BEGIN
          SET @id = REPLACE(NEWID(), '-', '')
          INSERT INTO indre (id, id_toma, orden, envio, enviado, respuesta, respuestaCompleta, userId, userName, fechaEnvio, fecha)
          VALUES (@id, ${id_toma}, '${orden}', '${envio}', '${enviado}', '${respuesta}', '${respuestaCompleta}', '${userId}', '${userName}', '${fechaEnvio}',  GETDATE())
        END
      ELSE
        BEGIN
          UPDATE indre
          SET enviado='${enviado}',
              envio='${envio}',
              respuesta='${respuesta}',
              respuestaCompleta='${respuestaCompleta}',
              userId='${userId}',
              userName='${userName}',
              fechaEnvio=GETDATE(),
              @id = id
          WHERE id_toma=${id_toma}
        END
      INSERT INTO hindre (id, idIndre, envio, respuesta, respuestaCompleta, userId, userName, fecha)
      VALUES (REPLACE(NEWID(), '-', ''), @id, '${envio}', '${respuesta}', '${respuestaCompleta}', '${userId}', '${userName}', GETDATE()) `;
    }

/*
  } else {  // opt = 'update'
    qry = `UPDATE indre
           SET enviado='S', respuesta='${respuesta}', respuestaCompleta='${respuestaCompleta}', userId='${userId}', userName='${userName}', fechaEnvio=GETDATE()
           WHERE id_toma=${id_toma}`;
  }
*/
  sql_api.query(qry)
    .then( (results, metadata) => {
      console.log('Resultado (afectaBD)', orden, 'toma', id_toma, results[0]);
    })
    .catch( err => {
      console.log('Error (afectaBD):', err);
    })
    .finally( () => {
      console.log('Fin (afectaBD)');
      // Web Socket para notificar al cliente las ordenes nuevas ***********************************************************************************************************
      wsNotificacion({
        codigo: "nueva_orden",
        id_toma: id_toma,
        orden: orden
      });
    });
};


// Funcion para hacer el envío de una orden al INDRE
const enviarOrden = (datos, req, res) => {

  datos.results[0].epoch_millis = Number(datos.results[0].epoch_millis);
  try {
    // elimino caracteres y espacios en el No. de teléfono y lo convierto a numérico
    datos.results[0].TelefonoDeContacto = Number( datos.results[0].TelefonoDeContacto.replace(/[^0-9]/g, '') );
    if (datos.results[0].TelefonoDeContacto.toString().length > 11) {
      datos.results[0].TelefonoDeContacto = 0;
    }
    // En caso de que el apellido sea "" lo cambio a " " para que no tenga error
    datos.results[0].SegundoApellido = (datos.results[0].SegundoApellido == "") ? " " : datos.results[0].SegundoApellido;
  } catch (error) {
    datos.results[0].TelefonoDeContacto = 0;
  }
  datos.results[0].epoch_millis = Number(datos.results[0].epoch_millis);
  datos.results[0].TelefonoDeContacto = Number(datos.results[0].TelefonoDeContacto);

  let urlProduccion = "https://aamates.salud.gob.mx/labprivadows/certus";
  let urlPruebas = "https://aamates.salud.gob.mx/labprivadows/labcovid";
  let pruebas = {
    url: 'https://aamates.salud.gob.mx/labprivadows/labcovid',
    autorizacion: 'Basic UHJ1ZWJhTGFiOlBydTNiNEwjYg==',
    username: '',
    password: ''
  };
  let produccion = {
    url: 'https://aamates.salud.gob.mx/labprivadows/certus',
    autorizacion: 'Basic UHJ1ZWJhTGFiOlBydTNiNEwjYg==',
    username: 'CertuS',
    password: 'c3rt#S'
  };
  let json = {};
  json.datos = datos;

  axios({
    method: 'post',
    url: produccion.url,
    timeout: 0,
    data: datos.results[0],
    headers: {
      "Authorization": produccion.autorizacion,
      'Accept' : 'application/json',
      'Content-Type': 'multipart/form-data; application/json'
    },
    auth: {
      username: produccion.username,
      password: produccion.password
    }
  }).then( resp => {
    json.status = resp.status;
    json.data = resp.data;
    json.msg = "Ok";
    json.respuestaCompleta = "200";
    json.results = resp.data;
    json.enviado = 'S';
  }).catch( err => {
    json.status = "err"
    json.data = err;
    json.msg = "Error";
    if (err != undefined && err.response != undefined) {
      if (err.response.data != undefined) {
        json.respuestaCompleta = (err.response.data)
      } else {
        json.respuestaCompleta = (err.response)
      }
    } else {
      json.respuestaCompleta = "Error indefinido";
    }
    json.results = err;
    json.enviado = 'N';
  }).finally( () => {
    console.log('Respuesta:', json.respuestaCompleta);
    console.log('Resultados:', json.results);
/*
    fs.appendFileSync("final.log", JSON.stringify(json) + '\n');
    fs.appendFileSync("final.log",  '***************** ' + '\n');
    fs.appendFileSync("final.log", JSON.stringify(json.data) + '\n');
*/
    res.json(json);
    afectaBD('update', req.query.id_toma, req.query.orden, json.enviado, json.msg, json.respuestaCompleta, req.query.userId, req.query.userName, JSON.stringify(datos.results[0]) );
  });

}; // enviarOrden()


// Lectura del histórico por toma
function historico(id_toma, json, req, res) {
  let qry = `SELECT h.envio, h.respuesta, h.respuestaCompleta, h.userId, h.userName, CONVERT(varchar(16), h.fecha, 120) fecha
             FROM hindre h (NOLOCK)
             WHERE h.idindre = (SELECT id FROM indre WHERE id_toma=${id_toma})
             ORDER BY fecha DESC`;
  sql_api.query(qry)
    .then( ([results, metadata]) => {
      json.historico = results;
    })
    .catch( err => {
      json.historico = []
    })
    .finally( () => {
      res.json(json)
    });
}; // historico()


// Nueva orden recibida de SASS (10.200.0.30/resultados/servidor/orden_completa.php)... revisar si tiene COVID
app.get('/nueva_orden', mdi, async (req, res) => {

  let orden_split = req.query.orden.split('-'); // No. de orden
  let id_toma_random = orden_split[0] || '';
  let id_toma_consecutivo = Number(orden_split[1]) || null;;
  let json = {};
  let results
  let id_examen
  let qry

  try {

    qry = 'SELECT TOP 1 codigo_covid FROM configuracion'
    results = await sql_api.query(qry)
    results = await results[0]
    id_examen = results[0].codigo_covid
    json.id_examen = id_examen

    qry = `
      SELECT TOP 1 r.id_toma
      FROM LPCV_RESULTADOS r (NOLOCK)
        INNER JOIN LPCV_EXAMEN e (NOLOCK) ON (e.id_examen=r.id_examen)
        INNER JOIN LPCV_TOMA t (NOLOCK) ON (r.id_toma = t.id_toma)
        LEFT JOIN LPCV_REPORTE_TRABAJO_DIA td (NOLOCK) ON (r.id_toma = td.id_toma)
          AND (r.id_examen = td.id_examen)
      WHERE (t.id_toma_random = '${id_toma_random}' AND t.id_toma_consecutivo = ${id_toma_consecutivo})
        AND (r.id_examen = ${id_examen})
        AND (r.id_valor IN (50557, 74280))`;
    json.qry = qry.trim().replace(/\r|\n/g, '')
    results = await sql_lis.query(qry)
    results = await results[0]

    json.result = (results.length > 0) ? 200 : 500;
    json.id_toma = (results.length > 0) ? results[0].id_toma : 0;
    json.results = results;

  } catch (error) {
    json.result = 404;
    json.results = error;
    json.id_toma = 0;

  } finally {
    res.json( json );
    if (json.id_toma != undefined && json.id_toma > 0) {  // En caso de que la orden se haya encontrado y tiene COVID
      afectaBD('insert', json.id_toma, id_toma_random + '-' + id_toma_consecutivo, 'P', '', '', '', '', '');
    }

  }
});


// Ruta para recibir una orden y enviarla al Web Service del INDRE
app.get('/enviar', mdi, (req, res) => {

  let json = {};
  let qry = `SELECT
                'MSI961203MD0' AS Rfc,
                CAST( DATEDIFF(second, '1970-01-01', CONVERT(varchar, r.fechaalta, 120)) AS bigint) * 1000 as epoch_millis,	'Certus Laboratorio Lab Num 13' NombreLaboratorio,
                CASE WHEN u.nombre_completo IS NULL THEN '' ELSE u.nombre_completo END ResponsableCarga,
                p.nombre Nombre,
                CASE WHEN CHARINDEX(' ', LTRIM(p.apellidos)) = 0
                     THEN LTRIM(p.apellidos)
                     ELSE LTRIM( REVERSE(SUBSTRING(REVERSE(RTRIM(p.apellidos)), CHARINDEX(' ', REVERSE(RTRIM(p.apellidos))), len(RTRIM(p.apellidos)) - 1)) )
                END PrimerApellido,
                CASE WHEN CHARINDEX(' ', LTRIM(p.apellidos)) = 0
                     THEN ' '
                     ELSE
                        LTRIM(
                            REVERSE(
                                SUBSTRING( REVERSE(RTRIM(p.apellidos)), 1, CHARINDEX(' ', REVERSE(RTRIM(p.apellidos))) )
                            )
                        )
                END SegundoApellido,
                CASE WHEN p.fecha_nacimiento IS NULL THEN 0 ELSE DATEDIFF(YEAR, p.fecha_nacimiento, r.fechaalta) END Edad,
                CASE WHEN p.codigo_sexo = 2 THEN 'Mujer' WHEN p.codigo_sexo = 1 THEN 'Hombre' ELSE 'No Binario' END Sexo,
                'Baja California' EntidadFederativa, 'Tijuana' MunicipioResidencia,
                CASE WHEN p.telefono IS NULL OR p.telefono = '' THEN '0' ELSE p.telefono END TelefonoDeContacto,
                CASE WHEN diag.sintomasRespiratorios IS NULL OR diag.sintomasRespiratorios = '' THEN ' ' ELSE diag.sintomasRespiratorios END SintomasRespiratorios,
                CASE WHEN nota.pruebaIndicacionMedica IS NULL OR nota.pruebaIndicacionMedica = '' THEN ' ' ELSE nota.pruebaIndicacionMedica END PruebaIndicacionMedica,
                CASE WHEN obs.motivoPrueba IS NULL OR obs.motivoPrueba = '' THEN ' ' ELSE obs.motivoPrueba END MotivoPrueba,
                CASE WHEN td.fecha_alta_toma IS NULL THEN '' ELSE CONVERT(varchar, td.fecha_alta_toma, 103) END FechaTomaDeMuestra,
                CASE WHEN r.fechaalta IS NULL THEN '' ELSE CONVERT(varchar, r.fechaalta, 103) END FechaResultado,
                CASE WHEN r.resultado_capturado NOT LIKE '%DETECTAD%' THEN 'Indeterminado'
                     WHEN r.resultado_capturado LIKE '%NO DETECTAD%' THEN 'Negativo'
                     ELSE 'Positivo'
                END Resultado,
                CONCAT( t.id_toma_random, '-',
                        FORMAT(t.id_toma_consecutivo, '000#'), '-',
                        ( SELECT TOP 1 tm.tipo_muestra_instrumento
                          FROM lpcv_examen as exa (NOLOCK)
                            LEFT JOIN lpcv_examen_materiales as mat (NOLOCK)
                              ON mat.id_examen = exa.id_examen
                            LEFT JOIN lpcv_materiales as m (NOLOCK)
                              ON m.id_material = mat.id_material
                            LEFT JOIN lpcv_tipo_muestra as tm (NOLOCK)
                              ON tm.id_tipo_muestra = mat.id_tipo_muestra
                          WHERE (exa.id_examen = r.id_examen) AND (m.abreviatura != 'CUESTIONARIO') )
                ) IdMuestra
             FROM LPCV_RESULTADOS r (NOLOCK)
                INNER JOIN lpcv_toma t (NOLOCK) ON t.id_toma=r.id_toma
                INNER JOIN PACIENTES p (NOLOCK) ON p.id_paciente=r.id_paciente
                INNER JOIN LPCV_EXAMEN e (NOLOCK) ON (e.id_examen=r.id_examen)
                LEFT JOIN usuarios u (NOLOCK) ON r.id_usuario_qvalida = u.id_usuario
                LEFT JOIN LPCV_REPORTE_TRABAJO_DIA td (NOLOCK) ON (t.id_toma = td.id_toma)
                    AND (r.id_examen = td.id_examen)
                OUTER APPLY (
                    SELECT CASE WHEN UPPER(diagnosticop) = 'SI' OR UPPER(diagnosticop) = 'NO' THEN diagnosticop ELSE ' ' END sintomasRespiratorios
                    FROM LPCV_ADMICIONES_DATOS_ESTADISTICOS tmp (NOLOCK)
                    WHERE tmp.id_toma = t.id_toma
                ) diag
                OUTER APPLY (
                    SELECT CASE WHEN observaciones IS NULL OR observaciones = '' THEN ' '
                                WHEN LTRIM(RTRIM(observaciones)) = '1' THEN 'INDICACION MEDICA'
                                WHEN LTRIM(RTRIM(observaciones)) = '2' THEN 'SOLICITUD PERSONAL'
                                ELSE ' '
                            END motivoPrueba
                    FROM lpcv_toma tmp (NOLOCK)
                    WHERE tmp.id_toma = t.id_toma
                ) obs
                OUTER APPLY (
                    SELECT CASE WHEN obs.motivoPrueba IS NULL OR obs.motivoPrueba = '' THEN ' '
                                WHEN obs.motivoPrueba = 'INDICACION MEDICA' THEN 'Si'
                                WHEN obs.motivoPrueba = 'SOLICITUD PERSONAL' THEN 'No'
                                ELSE ' '
                           END pruebaIndicacionMedica
                    FROM LPCV_ADMICIONES_DATOS_ESTADISTICOS tmp (NOLOCK)
                    WHERE tmp.id_toma = t.id_toma
                ) nota
             WHERE (r.id_examen = 10020)
               AND ( r.id_valor IN (50557, 74280) )
               AND (t.id_toma = ${req.query.id_toma})`;
  sql_lis.query(qry)
    .then( ([results, metadata]) => {
      json.result = (results.length > 0) ? 200 : 500;
      json.results = results;
//      json.qry = qry;
    })
    .catch( err => {
      json.result = 404;
      json.results = err;
//      json.qry = '';
    })
    .finally( () => {
      //res.json( json );
      if (json.result == 200) {  // En caso de que la orden se haya encontrado y tiene examen COVID
        enviarOrden(json, req, res);
      } else {
        res.json(json);
      }
    });

});  // /enviar


// Ruta para leer ordenes de acuerdo a un rango de fechas. Se utiliza para llenar la tabla (visor)
app.get('/ordenes', mdi, (req, res) => {

  let filtro = (req.query.filtro) ? req.query.filtro : 'Orden';
  let json = {};
  let qry = `SELECT
                CASE WHEN indre.enviado IS NULL OR indre.enviado = '' OR indre.enviado = 'P' THEN 'Pend' WHEN indre.enviado = 'N' THEN 'No' ELSE 'Si' END enviado,
                /*CASE WHEN indre.enviado IS NULL OR indre.enviado = '' OR indre.enviado = 'P' THEN 'yellow darken-4' WHEN indre.enviado = 'N' THEN 'red darken-1' ELSE 'green darken-1' END clase,*/
                CASE WHEN indre.respuesta IS NULL THEN '' ELSE indre.respuesta END respuesta,
                CASE WHEN indre.respuestaCompleta IS NULL THEN '' ELSE indre.respuestaCompleta END respuestaCompleta,
                CASE WHEN indre.fechaEnvio IS NULL OR YEAR(indre.fechaEnvio) = 1900 THEN '' ELSE CONVERT(varchar(16), indre.fechaEnvio, 120) END fechaEnvio,
                t.id_toma,
                CONCAT(t.id_toma_random, '-', t.id_toma_consecutivo) orden,
                CONCAT(p.apellidos, ' ', p.nombre) paciente,
                CASE WHEN p.fecha_nacimiento IS NULL THEN 0 ELSE DATEDIFF(YEAR, p.fecha_nacimiento, r.fechaalta) END edad,
                CASE WHEN p.codigo_sexo = 2 THEN 'Mujer' WHEN p.codigo_sexo = 1 THEN 'Hombre' ELSE 'No Binario' END sexo,
                CASE WHEN p.telefono IS NULL THEN '' ELSE p.telefono END telefono,
                CONVERT(varchar(16), t.fechaalta, 120) fechaOrden,
                CASE WHEN r.fechaalta IS NULL THEN '' ELSE CONVERT(varchar(16), r.fechaalta, 120) END fechaResultado,
                CASE WHEN td.fecha_alta_toma IS NULL THEN '' ELSE CONVERT(varchar(16), td.fecha_alta_toma, 120) END fechaToma,
                CASE WHEN r.resultado_capturado NOT LIKE '%DETECTAD%' THEN 'Indeterminado'
                     WHEN r.resultado_capturado LIKE '%NO DETECTAD%' THEN 'Negativo'
                     ELSE 'Positivo'
                END resultado,
                CASE WHEN u.nombre_completo IS NULL THEN '' ELSE u.nombre_completo END quimico,
                CASE WHEN diag.diagnosticop IS NULL THEN '' ELSE diag.diagnosticop END SintomasRespiratorios,
                CASE WHEN nota.nota_medica IS NULL THEN '' ELSE nota.nota_medica END PruebaIndicacionMedica,
                CASE WHEN obs.observaciones IS NULL THEN '' ELSE obs.observaciones END MotivoPrueba,
                CASE WHEN indre.userId IS NULL THEN '' ELSE indre.userId END userId,
                CASE WHEN indre.userName IS NULL THEN '' ELSE indre.userName END userName
             FROM LPCV_RESULTADOS r (NOLOCK)
                INNER JOIN lpcv_toma t (NOLOCK) ON t.id_toma=r.id_toma
                INNER JOIN PACIENTES p (NOLOCK) ON p.id_paciente=r.id_paciente
                INNER JOIN LPCV_EXAMEN e (NOLOCK) ON (e.id_examen=r.id_examen)
                LEFT JOIN usuarios u (NOLOCK) ON r.id_usuario_qvalida = u.id_usuario
                LEFT JOIN LPCV_REPORTE_TRABAJO_DIA td (NOLOCK) ON (t.id_toma = td.id_toma)
                  AND (r.id_examen = td.id_examen)
                OUTER APPLY (
                    SELECT CASE WHEN diagnosticop IS NULL THEN '' ELSE diagnosticop END diagnosticop
                    FROM LPCV_ADMICIONES_DATOS_ESTADISTICOS tmp (NOLOCK)
                    WHERE tmp.id_toma = t.id_toma
                ) diag
                OUTER APPLY (
                    SELECT CASE WHEN observaciones IS NULL THEN ''
                                WHEN observaciones = '1' THEN 'INDICACION MEDICA'
                                WHEN observaciones = '2' THEN 'SOLICITUD PERSONAL'
                                ELSE observaciones
                           END observaciones
                    /* SELECT CASE WHEN observaciones IS NULL THEN '' ELSE observaciones END observaciones */
                    FROM lpcv_toma tmp (NOLOCK)
                    WHERE tmp.id_toma = t.id_toma
                ) obs
                OUTER APPLY (
                  SELECT CASE WHEN obs.observaciones IS NULL THEN ''
                              WHEN obs.observaciones = 'INDICACION MEDICA' THEN 'Si'
                              WHEN obs.observaciones = 'SOLICITUD PERSONAL' THEN 'No'
                              ELSE nota_medica
                         END nota_medica
                    FROM LPCV_ADMICIONES_DATOS_ESTADISTICOS tmp (NOLOCK)
                    WHERE tmp.id_toma = t.id_toma
                ) nota
                LEFT JOIN [${ipXlab}\\SQL2008].CitasCovid.dbo.indre ON t.id_toma = indre.id_toma
             WHERE (r.id_examen = 10020)
                AND (r.id_valor IN (50557, 74280)) `;
  if (req.query.id_toma) {
    qry += ` AND (t.id_toma=${req.query.id_toma})`;
  } else {
    if (filtro == 'Envio') {
      qry += ` AND (CONVERT(varchar(10), indre.fechaEnvio, 120) BETWEEN '${req.query.desde}' AND '${req.query.hasta}')`;
    } else {
      // Default filtro por fecha de orden
      qry += ` AND (CONVERT(varchar(10), t.fechaalta, 120) BETWEEN '${req.query.desde}' AND '${req.query.hasta}')`;
    }
    qry += " ORDER BY t.id_toma_random, t.id_toma_consecutivo";
  }
  sql_lis.query(qry)
  .then(([results, metadata]) => {
    json.result = (results.length == 0) ? 500 : 200;
    json.msg = (results.length == 0) ? "No se encontraron ordenes en el período" : "Ordenes: " + results.length;
    json.items = results;
  }).catch( err => {
    console.log('Error al buscar la orden en SASS', err)
    json.result = 404;
    json.msg = "Error detectado: " + err
    json.items = [];
  }).finally( () => {
    json.historico = [];
    if (req.query.id_toma) {
       historico(req.query.id_toma, json, req, res);
    } else {
      res.json(json)
    }
  });

});


// Ruta para leer ordenes de acuerdo a un rango de fechas. Se utiliza para llenar la tabla (visor)
app.get('/ordenes_detectadas', mdi, (req, res) => {

  let json = {};
  let qry = `SELECT
              LTRIM(p.apellidos) Apellidos, LTRIM(p.nombre) Nombre,
              CASE WHEN t.edad_paciente IS NULL OR t.edad_paciente = 0 THEN 0 ELSE (t.edad_paciente / 12) END Edad,
              'DETECTADO' Resultado,
              CONVERT(varchar, CASE WHEN td.fecha_alta_toma IS NULL THEN t.fechaalta ELSE td.fecha_alta_toma END, 105) Fecha_Toma
            FROM LPCV_RESULTADOS r (NOLOCK)
                INNER JOIN lpcv_toma t (NOLOCK) ON t.id_toma = r.id_toma
                INNER JOIN LPCV_ADMISIONES_PACIENTE_ENTE adm (NOLOCK) ON t.id_toma = adm.id_toma
                INNER JOIN LPCV_ENTIDADES ent (NOLOCK) ON adm.id_entidad = ent.id_entidad
                INNER JOIN LPCV_INSTITUCIONES ins (NOLOCK) ON ent.id_institucion = ins.id_institucion
                INNER JOIN PACIENTES p (NOLOCK) ON p.id_paciente = r.id_paciente
                INNER JOIN LPCV_VALORES v ON (r.id_examen = v.id_examen)
                    AND (r.id_valor = v.id_valores)
                    AND (v.impresion = '' OR v.impresion is null OR v.impresion = 'Siempre')
                LEFT JOIN LPCV_REPORTE_TRABAJO_DIA td (NOLOCK) ON(t.id_toma = td.id_toma)
                    AND (r.id_examen = td.id_examen)
            WHERE (r.id_examen = 10020)
              AND (r.resultado_capturado NOT LIKE '%NO DETECT%')
            ORDER BY LTRIM(p.apellidos), LTRIM(p.nombre), td.fecha_alta_toma `
  sql_lis.query(qry)
  .then(([results, metadata]) => {
    json.result = (results.length == 0) ? 500 : 200;
    json.msg = (results.length == 0) ? "No se encontraron ordenes" : "Ordenes: " + results.length;
    json.items = results;
  }).catch( err => {
    console.log('Error al buscar las ordenes en SASS', err)
    json.result = 404;
    json.msg = "Error detectado: " + err
    json.items = [];
  }).finally( () => {
    json.historico = [];
    if (req.query.id_toma) {
       historico(req.query.id_toma, json, req, res);
    } else {
      res.json(json)
    }
  });

});

// Ruta para leer el Nombre del usuario (RH)
app.get('/usuario', mdi, (req, res) => {
  let json = {};
  let qry = `SELECT empleado_nombre nombre, CONCAT(empleado_nombre, ' ', empleado_appaterno) userName FROM empleados WHERE empleado_codigo = '${req.query.userId}'`;
  sql_rh.query(qry)
    .then(([results, metadata]) => {
      json.result = (results.length > 0) ? 200 : 500;
      json.results = (results.length > 0) ? results[0] : {nombre: '-inexistente-', userName: "-inexistente-"};
    })
    .catch(resp => {
      json.result = 404;
      json.results = resp;
    })
    .finally( () => {
      res.json( json );
    });
});

/*********************  Las siguientes rutas son para la app de resultados por exámen (Quasar c:\dev\quasar\resultados)   *************************************/

// Ruta para leer resultados por estudio
app.get("/estudios", mdi, (req, res) => {
  let json = {};
  let qry = `SELECT id_examen, LTRIM(examen) examen FROM LPCV_EXAMEN ORDER BY LTRIM(examen) `;
  sql_lis.query(qry)
    .then(([results, metadata]) => {
      json.result = (results.length > 0) ? 200 : 500
      json.msg = (results.length > 0) ? "Ok" : "Sin registros"
      json.results = results
    })
    .catch(resp => {
      json.result = 404
      json.msg = resp
      json.results = []
    })
    .finally( () => {
      res.json( json );
    });
}) // /estudios


// Ruta para leer resultados por estudio
app.get("/resultados/:id_examen", mdi, (req, res) => {
  let json = {};
  let qry = `
    SELECT
      r.id_resultado, CONCAT(t.id_toma_random, '-', FORMAT(t.id_toma_consecutivo, '0000')) orden,
      r.id_examen, e.Examen, r.resultado_capturado, FORMAT(t.edad_paciente / 12, '#0.0') edad, CASE WHEN p.codigo_sexo = 2 THEN 'Fem' ELSE 'Masc' END genero
      , t.observaciones
      , CASE WHEN d.DiagnosticoP IS NULL THEN '' ELSE d.diagnosticoP END diagnostico
    FROM lpcv_resultados r
      INNER JOIN LPCV_TOMA t ON r.id_toma = t.id_toma
      INNER JOIN lpcv_examen e ON r.id_examen = e.id_examen
      INNER JOIN PACIENTES p ON r.id_paciente=p.id_paciente
      LEFT JOIN LPCV_ADMICIONES_DATOS_ESTADISTICOS d ON t.id_toma = d.id_toma `
  if (req.query.desde && req.query.hasta) {
    qry += ` WHERE CONVERT(varchar(10), r.fechaalta, 120) BETWEEN '${req.query.desde}' AND '${req.query.hasta}' `
  } else if (req.query.periodo) {
    qry += ` WHERE CONVERT(varchar(7), r.fechaalta, 120) = '${req.query.periodo}' `
  }
  qry += ` AND r.id_examen IN (${req.params.id_examen})
    ORDER BY t.id_toma_random, t.id_toma_consecutivo, e.Examen
   `
  sql_lis.query(qry)
    .then(([results, metadata]) => {
      json.result = (results.length > 0) ? 200 : 500
      json.msg = (results.length > 0) ? "Ok" : "Sin registros"
      json.results = results
    })
    .catch(resp => {
      json.result = 404
      json.msg = resp
      json.results = []
    })
    .finally( () => {
      res.json( json )
    })

}) // resultados

function header(res) {
  res.header("Access-Control-Allow-Origin", "*")
} // header()


// Exportación del módulo
module.exports = {
  path: '/api/',
  handler: app
}
