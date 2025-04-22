/**
 * Libreria Utils
 *
 *
 */
function getUrnParsed(urnKbee) {
  var puntos = urnKbee.lastIndexOf(':');
  return urnKbee.substring(puntos + 1, urnKbee.length);
}

function setearMetaDescription(descripcion) {
  $("meta[name='description']").attr('content', descripcion);
  $("meta[name='twitter:description']").attr('content', descripcion);
  $("meta[name='og:description']").attr('content', descripcion);
}

function setearMetaTitulo(titulo) {
  $("meta[name='title']").attr('content', titulo);
  $("meta[name='twitter:title']").attr('content', titulo);
  $("meta[name='og:title']").attr('content', titulo);
}

function mostrarNovedad(tag, texto) {
  texto = texto.replace(/<\/?[^>]+(>|$)/g, '');
  $('#' + tag).text(texto.substring(0, 287) + '...');
}

/*
 * Function encargada de armar la url para dirigir al view Display
 */
function obtenerHrefDoc(documento, ubicacion, navQuery) {
  //El uuid habria que seguir sacandolo igual y armar la url
  //var url_host = ubicacion[0].host;

  var descriptionUrl = _(documento).secureGet([
    'metadata',
    'friendly-url',
    'description',
  ]).val;

  var nq = '?';
  if (navQuery) {
    navQuery.query ? (nq = '?q=' + escape(navQuery.query)) : '';
    nq +=
      '&o=' +
      navQuery.offset +
      '&f=' +
      escape(navQuery.facets) +
      '&t=' +
      navQuery.total;
  }

  return (
    'http://' +
    ubicacion +
    '/' +
    descriptionUrl +
    (descriptionUrl != '' ? '/' : '') +
    _(documento).secureGet(['metadata', 'uuid']).val +
    nq
  );
}

function formatfecha(fechaNovamens) {
  var fechaParse = '';
  var res = '';
  if (fechaNovamens != undefined) {
    fechaNovamens = fechaNovamens + '';
    fechaNovamens = $.trim(fechaNovamens.replace('.', ''));
    if (fechaNovamens.indexOf('-') != -1) {
      res = fechaNovamens.split('-');
      for (var i = res.length - 1; i >= 0; i--) {
        if (parseInt(res[i], 10) != '0') {
          fechaParse += parseInt(res[i], 10) + '/';
        }
      }
    } else {
      fechaParse = fechaNovamens + '/';
    }
  }
  return fechaParse.substring(0, fechaParse.length - 1);
}

/**
 * Funcion que devuelve un numero separando los separadores de miles
 * Puede recibir valores negativos y con decimales
 */
function numberFormat(numero) {
  numero = numero + '';
  // Variable que contendra el resultado final
  var resultado = '';
  // Ponemos un punto cada 3 caracteres
  for (var j, i = numero.length - 1, j = 0; i >= 0; i--, j++)
    resultado = numero.charAt(i) + (j > 0 && j % 3 == 0 ? '.' : '') + resultado;

  if (numero[0] == '-') {
    // Devolvemos el valor añadiendo al inicio el signo negativo
    return '-' + resultado;
  } else {
    return resultado;
  }
}

function detectarTipo(resultado) {
  return Object.keys(resultado)[0];
}

function getNumeroMes(fechaNovamens) {
  var primerBlanco = '';
  var subcadena = '';
  var segundoBlanco = '';
  var res = '';
  fechaNovamens = $.trim(fechaNovamens.replace('.', ''));
  if (fechaNovamens != undefined) {
    if ($.trim(fechaNovamens).indexOf('-') != -1) {
      primerBlanco = fechaNovamens.indexOf('-');
      subcadena = fechaNovamens.substr(primerBlanco + 1);
      if (subcadena.indexOf('-') != -1) {
        segundoBlanco = subcadena.indexOf('-');
        res = subcadena.substring(0, segundoBlanco);
        return res;
      } else {
        if (subcadena.length <= 2) {
          res = subcadena;
        }
        return res;
      }
    } else {
      return '';
    }
  }
}

function getNumeroAnio(fechaNovamens) {
  if (fechaNovamens.length > 3) {
    if ($.trim(fechaNovamens).indexOf(' ')) {
      return fechaNovamens.substring(0, 4);
    }
  } else {
    return '';
  }
}

function getNumeroDia(fechaNovamens) {
  if (fechaNovamens.length > 8) {
    return parseInt(fechaNovamens.substring(fechaNovamens.length - 2), 10) + '';
  }
}

function formatMesEspaniol(fecha) {
  var numeroMes = getNumeroMes(fecha);
  var meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  if (numeroMes != '') {
    return meses[parseInt(numeroMes, 10) - 1];
  } else {
    return numeroMes;
  }
}

function formatFechaCompletaEspaniol(fecha) {
  //AAAA-MM-DD formato normalizado
  if (fecha != undefined && fecha != '') {
    fecha = $.trim(fecha.replace('.', ''));
    var dia = '';
    var mes = '';
    var anio = '';
    var fechaFormateada = '';
    dia = getNumeroDia(fecha);
    mes = formatMesEspaniol(fecha);
    anio = getNumeroAnio(fecha);
    if (dia != '' && dia != undefined && dia != '00') {
      fechaFormateada = dia + ' de ';
    }
    if (mes != '' && mes != undefined) {
      fechaFormateada = fechaFormateada + mes + ' de ';
    }
    if (anio != '') {
      fechaFormateada = fechaFormateada + anio;
    }

    return elimininarDobleCeroFecha(fechaFormateada);
  } else {
    return '';
  }
}

function obtenerNomenclaturaLey(ley) {
  var tipoNorma = ley['tipo-norma'];
  var organismo = ley['organismo'];

  var titulo = '';

  if (tipoNorma != undefined) {
    titulo = tipoNorma['nombre'];
  }

  if (organismo != undefined) {
    if (
      organismo['organismo'] != undefined &&
      organismo['organismo'].jurisdiccion.nombre === 'NACIONAL'
    ) {
      titulo += ' Nacional';
    }
    var numero = organismo.numero;
    if (numero == undefined) {
      numero = ley.numero;
    } else {
      numero = 'null';
    }
    numero += '';

    if (numero != 'null' && numero.length > 3) {
      numero =
        numero.substring(0, numero.length - 3) +
        '.' +
        numero.substring(numero.length - 3);
    }

    if (numero === 'null' && titulo.indexOf('Ley')) {
      numero = 'sin número';
    }

    if (ley['rama-digesto'] != undefined && ley['rama-digesto'] != '') {
      titulo += ' ' + ley['rama-digesto'];
    }

    if (numero != '') {
      titulo += ' ' + numero;
    }
  } else {
    titulo += ' sin número';
  }

  return $.trim(titulo);
}

function extraerJurisdiccion(jurisdiccion) {
  var resultado = '';
  if (jurisdiccion != null) {
    resultado =
      jurisdiccion.substr(0, 1).toUpperCase() +
      jurisdiccion.substr(1, jurisdiccion.length).toLowerCase();
  }
  return resultado;
}

function eliminarTagsHTML(texto) {
  return $.trim(texto.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 226)) + '...';
}

function eliminarTagsHTMLAll(texto) {
  return $.trim(texto.replace(/<\/?[^>]+(>|$)/g, ''));
}

function eliminarTagsHTMLAllSpace(texto) {
  return $.trim(texto.replace(/<\/?[^>]+(>|$)/g, ' '));
}

function getUrlParams() {
  //Mariano:  Cuando entro al display de Ley , deberia parsear la url
  // para armar el query que haga la busqueda de la ley
  var args = {};
  $.each(
    $(location).attr('search').replace('?', '').split('&'),
    function (index, pair) {
      pair = pair.split('=');
      args[pair[0]] = pair[1] ? unescape(pair[1]) : true;
    },
  );

  if ($(location).attr('search') == '') {
    var pathName = $(location).attr('pathname');
    args.param = lookStaticFor(decodeURIComponent(pathName));
  }

  return args;
}

function lookStaticFor(pathName) {
  /*
   * boletin-novedades
   * dossier
   * informe-sneep
   * convocatoria-investigaciones
   *
   * novedades-juridicas
   * ediciones-infojus
   * guia-judiciales
   * formulario-registracion
   */
  var pathNamesMap = {
    //Servicios
    '/newsletter': 'boletin-novedades',
    '/boletin-de-novedades': 'boletin-novedades', //nueva sugerencia de SEO
    '/ebook': 'ebook',
    '/dossier': 'dossier',
    '/sneep': 'informe-sneep',
    '/estadisticas-ejecucion-de-la-pena': 'informe-sneep', //nueva sugerencia de SEO
    '/investigaciones': 'convocatoria-investigaciones',
    '/convocatoria-investigaciones-juridicas': 'convocatoria-investigaciones', //nueva sugerencia SEO
    //	        '/digesto' : 'digesto-juridico',
    //	        '/digesto-juridico-argentino' : 'digesto-juridico', //nueva sugerencia de SEO
    '/digesto': 'digesto-nacional',
    '/digesto-juridico-argentino': 'digesto-nacional', //nueva sugerencia de SEO
    '/proyectocodigopenal': 'anteproyecto-cod-penal',
    '/anteproyecto-codigo-penal': 'anteproyecto-cod-penal', //nueva sugerencia de SEO
    '/buscador/novedades': 'novedades-juridicas',
    '/ediciones-infojus': 'ediciones-infojus',
    //Acerca de infojus
    '/acerca': 'quienes-somos',
    '/quienes-somos': 'quienes-somos', //nueva sugerencia de SEO
    '/servicios': 'buscador-juridico',
    '/buscador-juridico': 'buscador-juridico', //nueva sugerencia de SEO
    '/centros': 'centros',
    '/centros-de-consulta': 'centros', //nueva sugerencia de SEO
    '/red': 'red-nacional',
    '/red-nacional': 'red-nacional',
    '/accesibilidad': 'accesibilidad',
    //Soporte a Usuarios
    '/contacto': 'contacto',
    '/preguntas': 'preguntas-frecuentes',
    '/reglamento': 'reglamento-uso',
    '/mapa': 'mapa-sitio',
    '/registracion': 'formulario-registracion',
    //ediciones infojus
    '/ediciones/revistas/coleccion-reformas-legislativas':
      'coleccion-reformas-legislativas',
    '/ediciones/libros/coleccion-discapacidad-justicia-estado':
      'coleccion-discapacidad-justicia-estado',
    '/ediciones/libros/codigo-civil-y-comercial-comentado':
      'codigo-civil-y-comercial-comentado',
    '/ediciones/revistas/revista-derecho-penal': 'derecho-penal',
    '/ediciones/revistas/revista-derecho-publico': 'derecho-publico',
    '/ediciones/revistas/revista-derecho-del-trabajo': 'derecho-trabajo',
    '/ediciones/revistas/revista-derecho-privado': 'derecho-privado',
    '/ediciones/revistas/revista-derechos-humanos': 'derecho-humanos',
    '/ediciones/revistas/revista-filosofia-del-derecho': 'derecho-filosofia',
    '/ediciones/revistas/intercatedras': 'intercatedras',
    '/ediciones/revistas/cuadernos-de-la-escuela-del-servicio-de-justicia':
      'cuaderno-escuela-justicia',
    '/ediciones/libros/coleccion-nueva-gestion-judicial':
      'coleccion-nueva-gestion-judicial',
    '/ediciones/libros/coleccion-estudios-estadisticos-cibercrimen':
      'coleccion-estudios-estadisticos-cibercrimen',
    '/ediciones/libros/coleccion-materiales-ensenanza':
      'coleccion-materiales-ensenanza',
  };

  return pathNamesMap[pathName];
}

function replaceAll(text, busca, reemplaza) {
  if (text != null || text != undefined) {
    while (text.toString().indexOf(busca) != -1)
      text = text.toString().replace(busca, reemplaza);
  }

  return text;
}

function replacePE(texto) {
  texto = replaceAll(texto, '[[p]]', '<p>');
  return (texto = replaceAll(texto, '[[/p]]', '</p>'));
}

function LimpiarIdDoctri(texto) {
  texto = replaceAll(texto, '[[p]]', '');
  texto = replaceAll(texto, '[[a uuid:', '');
  texto = replaceAll(texto, ']]VER TEXTO COMPLETO[[/a]]', '');
  texto = replaceAll(texto, '[[/p]]', '');
  var blanco = texto.indexOf(' ');
  texto = texto.substring(0, blanco);
  return texto;
}

function replacePETitulo(texto) {
  texto = replaceAll(texto, '[[p]]', ' ');
  return (texto = replaceAll(texto, '[[/p]]', ' '));
}

function replaceTabla(texto) {
  texto = replaceAll(texto, '[[t]]', '<pre>');
  texto = replaceAll(texto, '[[tr]]', '');
  texto = replaceAll(texto, '[[td]]', '');
  texto = replaceAll(texto, '[[/td]]', '');
  texto = replaceAll(texto, '[[/tr]]', '<br>');
  texto = replaceAll(texto, '[[/t]]', '</pre><br>');
  return texto;
}

function mostrarErrorCaptcha() {
  //Recaptcha.reload();
  $('#value-error').text('Captcha invalido ');
  $('#feedback-error-id').removeClass('reset');
}

function estaRegistradoBoletin(form) {
  var validadoOtrs = false;

  $.ajax({
    async: false,
    url: '/otrs/isnewsletter',
    data: form,
    success: function (json) {
      validadoOtrs = json.validado;
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Error llamando al Action de OTRS: ' + textStatus);
    },
  });

  return validadoOtrs;
}

function downloadRequest(form) {
  var respuestaServicio = false;

  $.ajax({
    async: false,
    url: '/otrs/downloadRequest',
    data: form,
    success: function (json) {
      if (json.data1 == 0) {
        respuestaServicio = true;
      } else {
        respuestaServicio = false;
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Error llamando al Action de OTRS: ' + textStatus);
    },
  });

  return respuestaServicio;
}

function enviarOTRS(form) {
  var validadoOtrs = false;

  $.ajax({
    async: false,
    url: '/otrs/isregistered',
    data: form,
    success: function (json) {
      validadoOtrs = json.validado;
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Error llamando al Action de OTRS: ' + textStatus);
    },
  });

  return validadoOtrs;
}

function addNewsLetter(form) {
  var contactOtrsResponse = false;

  $.ajax({
    async: false,
    url: '/otrs/addNewsLetter',
    data: form,
    success: function (json) {
      contactOtrsResponse = json.data1;
      if (json.data1 == 0) {
        //cartel que dice que tiene permisos para descargar los pdfs
        contactOtrsResponse = true;
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Error llamando al Action de OTRS: ' + textStatus);
    },
  });

  return contactOtrsResponse;
}

function chequearMailOtrs(email) {
  return false;
}

function mostrarDivRegistracion(email) {
  $('.registracion-mensaje').removeClass('reset');
}

function elimininarDobleCeroFecha(fecha) {
  if (fecha.startsWith('00')) {
    return fecha.substring(5);
  } else {
    return fecha;
  }
}

function formatRango() {
  var now = new Date();
  var seisMeses = 1000 * 60 * 60 * 24 * 30 * 6;
  var date = new Date(now.getTime() - seisMeses);
  var dateFrom =
    date.getFullYear() +
    ('0' + (date.getMonth() + 1)).substr(-2) +
    ('0' + date.getDate()).substr(-2);
  now = new Date(now.getTime() + 1000 * 60 * 60 * 24);
  var dateTo =
    now.getFullYear() +
    ('0' + (now.getMonth() + 1)).substr(-2) +
    ('0' + now.getDate()).substr(-2);
  return 'fecha-rango:[' + dateFrom + ' TO ' + dateTo + ']';
}

function extraerDesdeHtml(html, tagInicio, tagFin) {
  html = html.substring(html.indexOf(tagInicio), html.indexOf(tagFin));
  html = replaceAll(html, '.<br />', '.</p><p>');
  html = replaceAll(html, '<br />', ' ');

  return html;
}

function obtenerVocesParsed(voces) {
  var parsed = '';
  if (voces instanceof Array) {
    for (var i = 0; i < voces.length; i++) {
      parsed += voces[i]['kbee-term'].term + ', ';
    }

    parsed = parsed.substring(0, parsed.length - 2);
  }
  parsed =
    parsed.substr(0, 1).toUpperCase() +
    parsed.substr(1, parsed.length).toLowerCase();
  return parsed;
}

function checkObject(object, keys) {
  for (var i = 0; i < keys.length && object !== undefined; i++) {
    object = object[keys[i]];
  }
  if (object === undefined || object === null) {
    return '';
  } else {
    return object;
  }
}

function cambiarDobleBrPorComa(html) {
  html = replaceAll(html, '<br/> <br/>', ',');
  html = replaceAll(html, '<br/>', ',');
  return html;
}

function validarEmail(email) {
  expr = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  if (!expr.test(email)) return false;

  return true;
}

function Map() {
  this.keys = [];
  this.data = new Object();

  this.put = function (key, value) {
    if (this.data[key] == null) {
      this.keys.push(key);
    }
    this.data[key] = value;
  };

  this.get = function (key) {
    return this.data[key];
  };

  this.remove = function (key) {
    this.keys.remove(key);
    this.data[key] = null;
  };

  this.each = function (fn) {
    if (typeof fn != 'function') {
      return;
    }
    var len = this.keys.length;
    for (var i = 0; i < len; i++) {
      var k = this.keys[i];
      fn(k, this.data[k], i);
    }
  };

  this.entrys = function () {
    var len = this.keys.length;
    var entrys = new Array(len);
    for (var i = 0; i < len; i++) {
      entrys[i] = {
        key: this.keys[i],
        value: this.data[i],
      };
    }
    return entrys;
  };

  this.isEmpty = function () {
    return this.keys.length == 0;
  };

  this.size = function () {
    return this.keys.length;
  };
}

function convertirSumario(html) {
  html = replaceAll(html, '.<br />', '.</p><p>');
  html = replaceAll(html, '. <br />', '.</p><p>');
  html = replaceAll(html, '<br />', ' ');
  return html;
}

function convertirtextoLey(html) {
  html = replaceAll(html, '.<br />', '.</p><p>');
  html = replaceAll(html, '. <br />', '.</p><p>');
  html = replaceAll(html, '. <br/>', '.</p><p>');
  html = replaceAll(html, '.<br/>', '.</p><p>');
  html = replaceAll(html, '<br /><br />', '</p><p>');
  html = replaceAll(html, '<br /><br />', '</p><p>');
  html = replaceAll(html, ': <br />', '<p>');
  html = replaceAll(html, '; <br />', '</p><p>');
  html = replaceAll(html, ';<br />', '</p><p>');
  html = replaceAll(html, '<br />', ' ');
  return html;
}

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str) {
    return this.substring(0, str.length) === str;
  };
}

if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function (str) {
    return this.substring(this.length - str.length, this.length) === str;
  };
}

function toggleIndice(collapsibleDivId, toggleMarkId) {
  var styleObj = document.getElementById(collapsibleDivId).style;

  var markObj = document.getElementById(toggleMarkId);

  if (styleObj.display == 'block') {
    markObj.innerHTML = '[ + ]';
    //markObj.className = 'colapsed';
    styleObj.display = 'none';
  } else {
    markObj.innerHTML = '[ - ]';
    //markObj.className = 'expanded';
    styleObj.display = 'block';
  }
}

function mostrarContenidoRelacionado(referencias) {
  if (referencias instanceof Array) {
    poblarContenidosRelacionados(referencias);
  } else {
    poblarContenidoRelacionado(referencias);
  }
  activarToggle();
}

function activarToggle() {
  $('.contenido-toggle').on('click', function () {
    var visibilidad = $('#contenido-relacionado-contenedor-id').css('display');
    if (visibilidad == 'block') {
      $('#tipo-contenido-rel-id').html('[Contenido Relacionado]');
    } else {
      $('#tipo-contenido-rel-id').html('[ - ]');
    }

    $(this).next().toggle();
  });
}

function poblarContenidosRelacionados(resultados) {
  $.each(resultados, function (index, resultado) {
    poblarContenidoRelacionado(resultado);
  });
}

// ver si pasar como parametro directamente la vista obtenida antes  mediante obtenerListadoDocumentos o pasar solamente la referencia normativa y llamar por cada uno...
function poblarContenidoRelacionado(resultado) {
  $('#tipo-contenido-rel-id').show();
  var tipoReferencia = checkObject(resultado, ['tipo-referencia', 'nombre']);
  var titulo = checkObject(resultado, ['titulo']);
  if (tipoReferencia != $('#tipo-contenido-rel-id').html()) {
    var tipoRelacionadoClone = $('#titulo-rel-id')
      .clone()
      .addClass('dinamico')
      .addClass('cont-rel-flag')
      .show()
      .appendTo($('#contenido-relacionado-id'));
    tipoRelacionadoClone.find('#tipo-contenido-rel-id').html(tipoReferencia);
    tipoRelacionadoClone
      .find('#tipo-contenido-rel-id')
      .attr('id', tipoReferencia + 'id');
  }
  var contenidoRelacionadoClone = $('#cont-rel-id')
    .clone()
    .addClass('dinamico')
    .addClass('cont-rel-flag')
    .show()
    .appendTo($('#contenido-relacionado-id'));

  //aca hay que llamar al servicio que me busca el documento con el standard normativo

  if (titulo != '') {
    contenidoRelacionadoClone.find('.vista-documento-href').text(titulo);
  } else {
    contenidoRelacionadoClone.find('.vista-documento-href').text(resultado.id);
  }
  contenidoRelacionadoClone
    .find('.vista-documento-href')
    .attr('id', resultado.id + '_ref');
  contenidoRelacionadoClone
    .find('.vista-documento-href')
    .attr('href', 'algo=' + resultado.id);
  contenidoRelacionadoClone.find('.descripcion').html('ACA VA LA DESCRIPCION');

  //llamar al dibujar colapsada ACA
}

function eliminarCerosIzq(numero) {
  if (numero != '') {
    numero = parseInt(numero, 10);
  }

  return numero;
}

function pad(num, size) {
  var s = '000000000' + num;
  return s.substr(s.length - size);
}

var normalize = (function () {
  var from = 'ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç',
    to = 'AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc',
    mapping = {};

  for (var i = 0, j = from.length; i < j; i++)
    mapping[from.charAt(i)] = to.charAt(i);

  return function (str) {
    var ret = [];
    for (var i = 0, j = str.length; i < j; i++) {
      var c = str.charAt(i);
      if (mapping.hasOwnProperty(str.charAt(i))) ret.push(mapping[c]);
      else ret.push(c);
    }
    return ret
      .join('')
      .replace(/[^-A-Za-z0-9.]+/g, '-')
      .toLowerCase();
  };
})();

function isNumber(n) {
  return !isNaN(parseInt(n, 10));
}

function cambiarNumeralesHve(ley) {
  return replaceAll(
    replaceAll(
      replaceAll(
        replaceAll(
          replaceAll(
            replaceAll(
              replaceAll(
                replaceAll(replaceAll(ley, '002', ' bis'), '003', ' ter'),
                '004',
                ' quater',
              ),
              '005',
              ' quinquies',
            ),
            '006',
            'sexies',
          ),
          '007',
          'septies',
        ),
        '008',
        'octies',
      ),
      '009',
      'novies',
    ),
    '010',
    'decies',
  );
}

function validaFechaDDMMAAAA(fecha) {
  var dtCh = '/';
  var minYear = 1900;
  var maxYear = 2100;
  function isInteger(s) {
    var i;
    for (i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c < '0' || c > '9') return false;
    }
    return true;
  }
  function stripCharsInBag(s, bag) {
    var i;
    var returnString = '';
    for (i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (bag.indexOf(c) == -1) returnString += c;
    }
    return returnString;
  }
  function daysInFebruary(year) {
    return year % 4 == 0 && (!(year % 100 == 0) || year % 400 == 0) ? 29 : 28;
  }
  function DaysArray(n) {
    for (var i = 1; i <= n; i++) {
      this[i] = 31;
      if (i == 4 || i == 6 || i == 9 || i == 11) {
        this[i] = 30;
      }
      if (i == 2) {
        this[i] = 29;
      }
    }
    return this;
  }
  function isDate(dtStr) {
    if (dtStr.length == 4 && isInteger(dtStr)) {
      return true;
    }

    var daysInMonth = DaysArray(12);
    var pos1 = dtStr.indexOf(dtCh);
    var pos2 = dtStr.indexOf(dtCh, pos1 + 1);
    var strDay = dtStr.substring(0, pos1);
    var strMonth = dtStr.substring(pos1 + 1, pos2);
    var strYear = dtStr.substring(pos2 + 1);
    strYr = strYear;
    if (strDay.charAt(0) == '0' && strDay.length > 1)
      strDay = strDay.substring(1);
    if (strMonth.charAt(0) == '0' && strMonth.length > 1)
      strMonth = strMonth.substring(1);
    for (var i = 1; i <= 3; i++) {
      if (strYr.charAt(0) == '0' && strYr.length > 1)
        strYr = strYr.substring(1);
    }
    month = parseInt(strMonth, 10);
    day = parseInt(strDay, 10);
    year = parseInt(strYr, 10);
    if (pos1 == -1 || pos2 == -1) {
      return false;
    }
    if (strMonth.length < 1 || month < 1 || month > 12) {
      return false;
    }
    if (
      strDay.length < 1 ||
      day < 1 ||
      day > 31 ||
      (month == 2 && day > daysInFebruary(year)) ||
      day > daysInMonth[month]
    ) {
      return false;
    }
    if (strYear.length != 4 || year == 0 || year < minYear || year > maxYear) {
      return false;
    }
    if (
      dtStr.indexOf(dtCh, pos2 + 1) != -1 ||
      isInteger(stripCharsInBag(dtStr, dtCh)) == false
    ) {
      return false;
    }
    return true;
  }

  if (isDate(fecha)) {
    return true;
  } else {
    return false;
  }
}
