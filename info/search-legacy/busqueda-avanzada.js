$(document).ready(function () {
  if (!Cookies.get('organismosTitle')) {
    callOrganismosServices();
  }

  // Ocultando el suggester con clickout
  $(document).click(function (e) {
    clickOut($('#lib-rev-tema-autocomplete'), e, $('#inputfocus'));
    clickOut($('#dictamen-ptn-tema-autocomplete'), e, $('#inputfocus'));
    clickOut($('#dictamen-inadi-tema-autocomplete'), e, $('#inputfocus'));
    clickOut($('#dictamen-mpf-tema-autocomplete'), e, $('#inputfocus'));
    clickOut($('#dictamen-oa-tema-autocomplete'), e, $('#inputfocus'));
    clickOut($('#dictamen-aaip-tema-autocomplete'), e, $('#inputfocus'));
    clickOut(
      $('#tema-jurisprudencia-sumario-autocomplete'),
      e,
      $('#inputfocus'),
    );
    clickOut($('#tema-jurisprudencia-fallo-autocomplete'), e, $('#inputfocus'));
    clickOut($('#tema-doctrina-autocomplete'), e, $('#inputfocus'));
    clickOut($('#lib-rev-autor-autocomplete'), e, $('#inputfocus'));
    clickOut($('#dictamen-tema-autocomplete'), e, $('#inputfocus'));
    clickOut($('#tema-legislacion-autocomplete'), e, $('#inputfocus'));
    clickOut($('#tema-autocomplete'), e, $('#inputfocus'));
    clickOut(
      $('#refinar-busqueda-inputfocus-autocomplete'),
      e,
      $('#inputfocus'),
    );
  });

  $('.resol-show').hide();
  //Combo Tipo de contenido (documento)
  $('#tipoDocumento').change(function (event) {
    localStorage.setItem('tipoDocumento', this.value);
    $('#Legislación').hide();
    $('#Fallo').hide();
    $('#Dictamen').hide();
    $('#Sumario').hide();
    $('#Ediciones').hide();
    $('#Todo').hide();
    $('#Doctrina').hide();
    $('.dictamen-ptn').hide();
    $('.dictamen-mpf').hide();
    $('.dictamen-inadi').hide();
    $('.dictamen-oa').hide();
    $('.dictamen-aaip').hide();
    $('.dictmpf').hide();
    if (this.value === 'Dictamen') {
      if (localStorage.getItem('dictamen')) {
        var dictamen = JSON.parse(localStorage.getItem('dictamen'));
        if (dictamen.tipoDocumento == 'PTN') {
          $('.dictamen-ptn').show();
        } else if (dictamen.tipoDocumento == 'MPF') {
          $('.dictamen-mpf').show();
        } else if (dictamen.tipoDocumento == 'INADI') {
          $('.dictamen-inadi').show();
        } else if (dictamen.tipoDocumento == 'OA') {
          $('.dictamen-oa').show();
        } else if (dictamen.tipoDocumento == 'AAIP') {
          $('.dictamen-aaip').show();
        }
      }
    }

    if (this.value === 'Fallo') {
      if (localStorage.getItem('fallo')) {
        var fallo = JSON.parse(localStorage.getItem('fallo'));

        if (fallo.jurisdiccion) {
          var facetaJurisdiccion = 'Jurisdicción/' + fallo.jurisdiccion;
          llenarComboTribunal(facetaJurisdiccion);
          $('#tribunal-jurisprudencia-fallo').val(
            fallo['tribunal'] != 'undefined' ? fallo.tribunal : '',
          );
        }
      }
    }

    $('#' + this.value).show();
  });
  //		localStorage.removeItem("tipoDocumento");
  //var term= getURLParameter('term');
  if (localStorage.getItem('tipoDocumento') != null) {
    $('#Legislación').hide();
    $('#Fallo').hide();
    $('#Dictamen').hide();
    $('#Sumario').hide();
    $('#Ediciones').hide();
    $('#Doctrina').hide();

    $('.dictamen-ptn').hide();
    $('.dictamen-mpf').hide();
    $('.dictamen-inadi').hide();
    $('.dictamen-oa').hide();
    $('.dictamen-aaip').hide();
    var dictamen = JSON.parse(localStorage.getItem('dictamen'));
    if (dictamen) {
      if (dictamen.tipoDocumento == 'PTN') $('.dictamen-ptn').show();
      else if (dictamen.tipoDocumento == 'MPF') $('.dictamen-mpf').show();
      else if (dictamen.tipoDocumento == 'INADI') $('.dictamen-inadi').show();
      else if (dictamen.tipoDocumento == 'OA') $('.dictamen-oa').show();
      else if (dictamen.tipoDocumento == 'AAIP') $('.dictamen-aaip').show();
    }
    var legislacion = JSON.parse(localStorage.getItem('legislacion'));
    if (legislacion) {
      esconderCamposLegislacionReglasNeg(legislacion.tipo);
    }

    $('#' + localStorage.getItem('tipoDocumento')).show();
  }

  $('#tipoDocumento').val(
    localStorage.getItem('tipoDocumento') != null
      ? localStorage.getItem('tipoDocumento')
      : 'Legislación',
  );

  //LEGISLACIOM
  var legislacion;
  if (localStorage.getItem('legislacion') != 'undefined') {
    legislacion = JSON.parse(localStorage.getItem('legislacion'));
  }

  if (legislacion) {
    $('#numero-norma-legislacion').val(
      legislacion['numero'] != 'undefined' ? legislacion.numero : '',
    );
    $('#tipo-documento-legislacion').val(
      legislacion['tipo'] != 'undefined' ? legislacion.tipo : '',
    );
    $('#titulo-legislacion').val(
      legislacion['titulo'] != 'undefined' ? legislacion.titulo : '',
    );
    $('#organismo-document-element').val(
      legislacion['organismo'] != 'undefined' ? legislacion.organismo : '',
    );
    $('#jurisdiccion-legislacion').val(
      legislacion['jurisdiccion'] != 'undefined'
        ? legislacion.jurisdiccion
        : '',
    );
    $('#tema-legislacion').val(
      legislacion['tema'] != 'undefined' ? legislacion.tema : '',
    );
    $('#estado-legislacion').val(
      legislacion['estado'] != 'undefined' ? legislacion.estado : '',
    );
    $('#fecha-desde-legislacion').val(
      legislacion['fechaDesde'] != 'undefined' ? legislacion.fechaDesde : '',
    );
    $('#fecha-hasta-legislacion').val(
      legislacion['fechaHasta'] != 'undefined' ? legislacion.fechaHasta : '',
    );
    $('#texto-legislacion').val(
      legislacion['texto'] != 'undefined' ? legislacion.texto : '',
    );
    $('#id-doc-legislacion').val(
      legislacion['idDoc'] != 'undefined' ? legislacion.idDoc : '',
    );
  }

  //FALLO
  var fallo;
  if (localStorage.getItem('fallo') != 'undefined') {
    fallo = JSON.parse(localStorage.getItem('fallo'));
  }

  if (fallo) {
    $('#tipo-jurisprudencia-fallo').val(
      fallo['tipoJurisprudencia'] != 'undefined'
        ? fallo.tipoJurisprudencia
        : '',
    );
    $('#caratula-jurisprudencia-fallo').val(
      fallo['caratula'] != 'undefined' ? fallo.caratula : '',
    );
    $('#jurisdiccion-jurisprudencia-fallo').val(
      fallo['jurisdiccion'] != 'undefined' ? fallo.jurisdiccion : '',
    );

    if (fallo.jurisdiccion) {
      var facetaJurisdiccion = 'Jurisdicción/' + fallo.jurisdiccion;
      llenarComboTribunal(facetaJurisdiccion);
    }

    $('#tribunal-jurisprudencia-fallo').val(
      fallo['tribunal'] != 'undefined' ? fallo.tribunal : '',
    );
    $('#tema-jurisprudencia-fallo').val(
      fallo['tema'] != 'undefined' ? fallo.tema : '',
    );
    $('#fecha-desde-jurisprudencia-fallo').val(
      fallo['fechaDesde'] != 'undefined' ? fallo.fechaDesde : '',
    );
    $('#texto-jurisprudencia-fallo').val(
      fallo['texto'] != 'undefined' ? fallo.texto : '',
    );
    $('#fecha-hasta-jurisprudencia-fallo').val(
      fallo['fechaHasta'] != 'undefined' ? fallo.fechaHasta : '',
    );
    $('#tribunal-jurisprudencia-fallo').val(
      fallo['tribunal'] != 'undefined' ? fallo.tribunal : '',
    );
    $('#id-doc-sentencia').val(
      fallo['idDocumento'] != 'undefined' ? fallo.idDocumento : '',
    );
  }

  //SUMARIO
  var sumario;
  if (localStorage.getItem('sumario') != 'undefined') {
    sumario = JSON.parse(localStorage.getItem('sumario'));
  }

  if (sumario) {
    $('#jurisdiccion-jurisprudencia-sumario').val(
      sumario['jurisdiccion'] != 'undefined' ? sumario.jurisdiccion : '',
    );
    $('#tribunal-jurisprudencia-sumario').val(
      sumario['tribunal'] != 'undefined' ? sumario.tribunal : '',
    );
    $('#tema-jurisprudencia-sumario').val(
      sumario['tema'] != 'undefined' ? sumario.tema : '',
    );
    $('#fecha-desde-jurisprudencia-sumario').val(
      sumario['fechaDesde'] != 'undefined' ? sumario.fechaDesde : '',
    );
    $('#texto-jurisprudencia-sumario').val(
      sumario['texto'] != 'undefined' ? sumario.texto : '',
    );
    $('#fecha-hasta-jurisprudencia-sumario').val(
      sumario['fechaHasta'] != 'undefined' ? sumario.fechaHasta : '',
    );
    $('#id-doc-sumario').val(
      sumario['idDocumento'] != 'undefined' ? sumario.idDocumento : '',
    );
  }

  //DICTAMEN
  var dictamen;
  if (localStorage.getItem('dictamen') != 'undefined') {
    dictamen = JSON.parse(localStorage.getItem('dictamen'));
  }

  if (dictamen) {
    $('#tipo-documento-dictamen').val(
      dictamen['tipoDocumento'] != 'undefined' ? dictamen.tipoDocumento : '',
    );
    $('#dictamen-numero').val(
      dictamen['numero'] != 'undefined' ? dictamen.numero : '',
    );
    $('#dictamen-fecha-desde').val(
      dictamen['fechaDesde'] != 'undefined' ? dictamen.fechaDesde : '',
    );
    $('#dictamen-fecha-hasta').val(
      dictamen['fechaHasta'] != 'undefined' ? dictamen.fechaHasta : '',
    );
    $('#dictamen-tema').val(
      dictamen['tema'] != 'undefined' ? dictamen.tema : '',
    );
    $('#dictamen-texto').val(
      dictamen['texto'] != 'undefined' ? dictamen.texto : '',
    );
    $('#dictamen-partes-mpf').val(
      dictamen['partes'] != 'undefined' ? dictamen.partes : '',
    );
    $('#dictamen-letra').val(
      dictamen['letra'] != 'undefined' ? dictamen.letra : '',
    );
    $('#dictamen-partes-inadi').val(
      dictamen['partesInadi'] != 'undefined' ? dictamen.partesInadi : '',
    );
    $('#dictamen-partes-aaip').val(
      dictamen['partesAaip'] != 'undefined' ? dictamen.partesAaip : '',
    );
    $('#dictamen-tomo-ptn').val(
      dictamen['tomo'] != 'undefined' ? dictamen.tomo : '',
    );
    $('#dictamen-ptn-pagina').val(
      dictamen['pagina'] != 'undefined' ? dictamen.pagina : '',
    );
    $('#id-doc-dictamen').val(
      dictamen['idDocumento'] != 'undefined' ? dictamen.idDocumento : '',
    );
  }

  //Doctrina
  var doctrina;
  if (localStorage.getItem('doctrina') != 'undefined') {
    doctrina = JSON.parse(localStorage.getItem('doctrina'));
  }

  if (doctrina) {
    $('#titulo-doctrina').val(
      doctrina['titulo'] != 'undefined' ? doctrina.titulo : '',
    );
    $('#autor-doctrina').val(
      doctrina['autor'] != 'undefined' ? doctrina.autor : '',
    );
    $('#tema-doctrina').val(
      doctrina['tema'] != 'undefined' ? doctrina.tema : '',
    );
    $('#texto-doctrina').val(
      doctrina['texto'] != 'undefined' ? doctrina.texto : '',
    );
    $('#fecha-desde-jurisprudencia-doctrina').val(
      doctrina['fechaDesde'] != 'undefined' ? doctrina.fechaDesde : '',
    );
    $('#fecha-hasta-jurisprudencia-doctrina').val(
      doctrina['fechaHasta'] != 'undefined' ? doctrina.fechaHasta : '',
    );
    $('#id-doc-doctrina').val(
      doctrina['idDocumento'] != 'undefined' ? doctrina.idDocumento : '',
    );
  }

  //EDICIONES
  var ediciones;
  if (localStorage.getItem('ediciones') != 'undefined') {
    ediciones = JSON.parse(localStorage.getItem('ediciones'));
  }

  if (ediciones) {
    $('#lib-rev-consulta').val(
      ediciones['tipoEdicion'] != 'undefined' ? ediciones.tipoEdicion : '',
    );
    $('#lib-rev-tipo').val(
      ediciones['tipoDocumentoEdicion'] != 'undefined'
        ? ediciones.tipoDocumentoEdicion
        : '',
    );
    $('#lib-rev-titulo').val(
      ediciones['titulo'] != 'undefined' ? ediciones.titulo : '',
    );
    $('#lib-rev-autor').val(
      ediciones['autor'] != 'undefined' ? ediciones.autor : '',
    );
    $('#lib-rev-tema').val(
      ediciones['tema'] != 'undefined' ? ediciones.tema : '',
    );
    $('#id-doc-ediciones').val(
      ediciones['idDocumento'] != 'undefined' ? ediciones.idDocumento : '',
    );
  }

  var todo;
  if (localStorage.getItem('todo') != 'undefined') {
    todo = JSON.parse(localStorage.getItem('todo'));
  }

  if (todo) {
    $('#allofit').val(todo['allofit'] != 'undefined' ? todo.allofit : '');
    $('#tema').val(todo['tema'] != 'undefined' ? todo.tema : '');
  }

  //Solapa de legislacion
  $('#btn-search-legislacion').click(function (event) {
    var fechaDesdeLeg = $('#fecha-desde-legislacion').val();
    var fechaHastaLeg = $('#fecha-hasta-legislacion').val();
    var res = obtenerRangoRespuesta(fechaDesdeLeg, fechaHastaLeg);
    if (
      res != 'fechaDesdeError' ||
      res != 'fechaHastaError' ||
      res != 'ambasFechas'
    ) {
      if (
        fechaDesdeLeg != '' &&
        fechaHastaLeg == '' &&
        isYearOnly(fechaDesdeLeg)
      ) {
        $('#fecha-hasta-legislacion').val(fechaDesdeLeg);
      }
    }

    if (window.localStorage) {
      var legislacion = {
        numero: $('#numero-norma-legislacion').val(),
        tipo: $('#tipo-documento-legislacion').val(),
        titulo: $('#titulo-legislacion').val(),
        organismo: $('#organismo-document-element').val(),
        jurisdiccion: $('#jurisdiccion-legislacion').val(),
        tema: $('#tema-legislacion').val(),
        estado: $('#estado-legislacion').val(),
        fechaDesde: $('#fecha-desde-legislacion').val(),
        fechaHasta: $('#fecha-hasta-legislacion').val(),
        texto: $('#texto-legislacion').val(),
        idDoc: $('#id-doc-legislacion').val(),
      };

      if (legislacion.estado == '') {
        legislacion.estado = $('#estado-legislacion-dec').val();
      }

      localStorage.setItem('legislacion', JSON.stringify(legislacion));
    }

    buscar('legislacion');
    return false;
  });

  //Solapa de Fallo
  $('#btn-search-fallo').click(function (event) {
    if (window.localStorage) {
      var fallo = {
        tipoJurisprudencia: $('#tipo-jurisprudencia-fallo').val(),
        caratula: $('#caratula-jurisprudencia-fallo').val(),
        jurisdiccion: $('#jurisdiccion-jurisprudencia-fallo').val(),
        tribunal: $('#tribunal-jurisprudencia-fallo').val(),
        tema: $('#tema-jurisprudencia-fallo').val(),
        fechaDesde: $('#fecha-desde-jurisprudencia-fallo').val(),
        texto: $('#texto-jurisprudencia-fallo').val(),
        fechaHasta: $('#fecha-hasta-jurisprudencia-fallo').val(),
        idDocumento: $('#id-doc-sentencia').val(),
      };
      localStorage.setItem('fallo', JSON.stringify(fallo));
    }
    buscar('fallo');
    return false;
  });
  //Solapa de Sumario
  $('#btn-search-sumario').click(function (event) {
    if (window.localStorage) {
      var sumario = {
        jurisdiccion: $('#jurisdiccion-jurisprudencia-sumario').val(),
        tribunal: $('#tribunal-jurisprudencia-sumario').val(),
        tema: $('#tema-jurisprudencia-sumario').val(),
        fechaDesde: $('#fecha-desde-jurisprudencia-sumario').val(),
        texto: $('#texto-jurisprudencia-sumario').val(),
        fechaHasta: $('#fecha-hasta-jurisprudencia-sumario').val(),
        idDocumento: $('#id-doc-sumario').val(),
      };
      localStorage.setItem('sumario', JSON.stringify(sumario));
    }
    buscar('sumario');
    return false;
  });
  //Solapa de Dictamen
  $('#btn-search-dictamen').click(function (event) {
    if (window.localStorage) {
      var dictamen = {
        tipoDocumento: $('#tipo-documento-dictamen').val(),
        numero: $('#dictamen-numero').val(),
        fechaDesde: $('#dictamen-fecha-desde').val(),
        fechaHasta: $('#dictamen-fecha-hasta').val(),
        tema: $('#dictamen-tema').val(),
        texto: $('#dictamen-texto').val(),
        partes: $('#dictamen-partes-mpf').val(),
        letra: $('#dictamen-letra').val(),
        partesInadi: $('#dictamen-partes-inadi').val(),
        partesAaip: $('#dictamen-partes-aaip').val(),
        tomo: $('#dictamen-tomo-ptn').val(),
        pagina: $('#dictamen-ptn-pagina').val(),
        idDocumento: $('#id-doc-dictamen').val(),
      };
      localStorage.setItem('dictamen', JSON.stringify(dictamen));
    }
    buscar('dictamen');
    return false;
  });

  //Solapa de Doctrina
  $('#btn-search-doctrina-enc').click(function (event) {
    if (window.localStorage) {
      var doctrina = {
        titulo: $('#titulo-doctrina').val(),
        autor: $('#autor-doctrina').val(),
        tema: $('#tema-doctrina').val(),
        texto: $('#texto-doctrina').val(),
        fechaDesde: $('#fecha-desde-jurisprudencia-doctrina').val(),
        fechaHasta: $('#fecha-hasta-jurisprudencia-doctrina').val(),
        idDocumento: $('#id-doc-doctrina').val(),
      };
      localStorage.setItem('doctrina', JSON.stringify(doctrina));
    }
    buscar('doctrina');
    return false;
  });

  $('#btn-search-doctrina').click(function (event) {
    if (window.localStorage) {
      var doctrina = {
        titulo: $('#titulo-doctrina').val(),
        autor: $('#autor-doctrina').val(),
        tema: $('#tema-doctrina').val(),
        texto: $('#texto-doctrina').val(),
        fechaDesde: $('#fecha-desde-jurisprudencia-doctrina').val(),
        fechaHasta: $('#fecha-hasta-jurisprudencia-doctrina').val(),
        idDocumento: $('#id-doc-doctrina').val(),
      };
      localStorage.setItem('doctrina', JSON.stringify(doctrina));
    }
    buscar('doctrina');
    return false;
  });

  //Solapa de Ediciones
  $('#btn-search-ediciones').click(function (event) {
    if (window.localStorage) {
      var ediciones = {
        tipoEdicion: $('#lib-rev-consulta').val(),
        tipoDocumentoEdicion: $('#lib-rev-tipo').val(),
        titulo: $('#lib-rev-titulo').val(),
        autor: $('#lib-rev-autor').val(),
        tema: $('#lib-rev-tema').val(),
        texto: $('#lib-rev-texto').val(),
        idDocumento: $('#id-doc-ediciones').val(),
      };
      localStorage.setItem('ediciones', JSON.stringify(ediciones));
    }
    buscar('ediciones');
    return false;
  });

  //Solapa Todo
  /*		$("#btn-search-todo").click(function(event) {
			if (window.localStorage) {
				var todo = {
						"allofit":$("#allofit").val()
				};
				localStorage.setItem("todo", JSON.stringify(todo));
			}
			buscar('todo');
		    return false;
		}); */

  $('#btn-search-todo').click(function (event) {
    if (window.localStorage) {
      var todo = {
        allofit: $('#allofit').val(),
        tema: $('#tema').val(),
      };
      console.log('Valor de tema:', todo.tema); // Esto imprimirá el valor de 'tema'
      localStorage.setItem('todo', JSON.stringify(todo));
    }

    // Llamar a la función 'buscar' pasando 'todo' como parámetro
    buscar('todo');
    return false;
  });

  $('#tipoOrganismo').change(function (event) {
    $('.dictamen-ptn').hide();
    $('.dictamen-mpf').hide();
    $('.dictamen-inadi').hide();
    $('.dictamen-oa').hide();
    $('.dictamen-aaip').hide();

    $('.' + this.value).show();
  });

  $('#tipo-documento-legislacion').change(function (event) {
    esconderCamposLegislacionReglasNeg(this.value);
  });

  $('#lib-rev-consulta').change(libRevChange);

  $('#jurisdiccion-jurisprudencia-sumario').change(jurisdiccionSumarioChange); //jurisdiccionChange
  $('#jurisdiccion-jurisprudencia-fallo').change(jurisdiccionFalloChange); //jurisdiccionChange
  $('#tipo-documento-jurisprudencia').change(tipoDocumentoJurisprudencia); //
  $('#tipo-documento-dictamen').change(tipoDocumentoDictamen); //

  // Caja que contiene las sugerencias
  $('#tema-legislacion-autocomplete').hide();
  // Dispara el suggester ante el cambio del input Legislacion
  $('#tema-legislacion').change(
    $(function () {
      $('#tema-legislacion').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#tema-legislacion-autocomplete').hide();
        } else if (event.keyCode == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#tema-legislacion').val(),
            'busqueda-global',
            20,
            $('#tema-legislacion-autocomplete'),
          );
        }
      });
    }),
  );

  $('#lib-rev-autor').change(
    $(function () {
      $('#lib-rev-autor').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#lib-rev-autor-autocomplete').hide();
        } else if (event.keyCode == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          //				    		buscarSuggest($('#lib-rev-autor').val(), 'busqueda-global', 20, $('#lib-rev-autor-autocomplete'));
        }
      });
    }),
  );

  // Dispara el suggester ante el cambio del input tema Libros Revistas
  $('#lib-rev-tema').change(
    $(function () {
      $('#lib-rev-tema').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#lib-rev-tema-autocomplete').hide();
        } else if (event.key == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#lib-rev-tema').val(),
            'busqueda-global',
            20,
            $('#lib-rev-tema-autocomplete'),
          );
        }
      });
    }),
  );

  $('#libros-revistas-tema').change(
    $(function () {
      $('#libros-revistas-tema').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#libros-revistas-tema-autocomplete').hide();
        } else if (event.key == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#libros-revistas-tema').val(),
            'busqueda-global',
            20,
            $('#libros-revistas-tema-autocomplete'),
          );
        }
      });
    }),
  );

  //		// Dispara el suggester ante el cambio del input Dictamen
  $('#dictamen-tema').change(
    $(function () {
      $('#dictamen-tema').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#dictamen-tema-autocomplete').hide();
        } else if (event.key == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#dictamen-tema').val(),
            'busqueda-global',
            20,
            $('#dictamen-tema-autocomplete'),
          );
        }
      });
    }),
  );
  // Dispara el suggester ante el cambio del input Dictamen
  $('#tema-jurisprudencia-fallo').change(
    $(function () {
      $('#tema-jurisprudencia-fallo').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#tema-jurisprudencia-fallo-autocomplete').hide();
        } else if (event.key == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#tema-jurisprudencia-fallo').val(),
            'busqueda-global',
            20,
            $('#tema-jurisprudencia-fallo-autocomplete'),
          );
        }
      });
    }),
  );

  // Dispara el suggester ante el cambio del input Dictamen
  $('#tema-jurisprudencia-sumario').change(
    $(function () {
      $('#tema-jurisprudencia-sumario').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#tema-jurisprudencia-sumario-autocomplete').hide();
        } else if (event.key == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#tema-jurisprudencia-sumario').val(),
            'busqueda-global',
            20,
            $('#tema-jurisprudencia-sumario-autocomplete'),
          );
        }
      });
    }),
  );

  $('#tema').change(
    $(function () {
      $('#tema').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#tema-autocomplete').hide();
        } else if (event.key == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#tema').val(),
            'busqueda-global',
            20,
            $('#tema-autocomplete'),
          );
        }
      });
    }),
  );

  $('#tema-doctrina').change(
    $(function () {
      $('#tema-doctrina').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#tema-doctrina-autocomplete').hide();
        } else if (event.key == 'Up') {
          selectUpSuggestion();
        } else if (event.key == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#tema-doctrina').val(),
            'busqueda-global',
            20,
            $('#tema-doctrina-autocomplete'),
          );
        }
      });
    }),
  );
});

function getURLParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
      return sParameterName[1];
    }
  }
  return '';
}

var tipoDocumentoDictamen = function (event) {
  var select = $(event.currentTarget);
  $('.dictamen-todos').hide();
  $('.dictamen-ptn').hide();
  $('.dictamen-inadi').hide();
  $('.dictamen-mpf').hide();
  $('.dictamen-aaip').hide();

  var selectedValue = select[0].value;

  if ('PTN' == selectedValue) {
    $('.dictamen-ptn').show();
  } else if ('INADI' == selectedValue) {
    $('.dictamen-inadi').show();
  } else if ('MPF' == selectedValue) {
    $('.dictamen-mpf').show();
  } else if ('OA' == selectedValue) {
    $('.dictamen-oa').show();
  } else if ('AAIP' == selectedValue) {
    $('.dictamen-aaip').show();
  } else {
    $('.dictamen-todos').show();
  }
};

var tipoDocumentoJurisprudencia = function (event) {
  var select = $(event.currentTarget);

  $('#jurisprudencia-fallo').hide();
  $('#jurisprudencia-sumario').hide();
  $('#jurisprudencia-dictamen').hide();

  if ('Dictamen' == select[0].value) {
    $('#jurisprudencia-dictamen').show();
  } else if ('Sumario' == select[0].value) {
    $('#jurisprudencia-sumario').show();
  } else {
    $('#jurisprudencia-fallo').show();
  }

  return false;
};

var jurisdiccionSumarioChange = function (event) {
  var select = $(event.currentTarget);
  var facetaJurisdiccion = 'Jurisdicción/' + select[0].value;
  var result = new QueryObject()
    .setPageSize(0)
    .putFacet('Tribunal', 5000, 1)
    .putFacet('Tipo de Documento/Jurisprudencia')
    .putFacet(facetaJurisdiccion)
    .doQuery();
  var tribunales = _(result)
    .secureGet(['searchResults', 'categoriesResultList', '0', 'facetChildren'])
    .asArray();

  var tribunalElement = $('#tribunal-jurisprudencia-sumario');
  tribunalElement.find('option').remove();
  tribunalElement.append('<option selected="selected" value="">Todos</option>');

  for (var i = 0; i < tribunales.length; i++) {
    var tribunal = tribunales[i].facetName;
    tribunalElement.append(
      '<option value="' + tribunal + '">' + tribunal + '</option>',
    );
  }
  return false;
};

function obtenerEdicionesInfojus() {
  var edicionesPublicaciones = ['Libro', 'Revista'];
  return edicionesPublicaciones;
}

function obtenerBibliotecaDigital() {
  var bibliotecaPublicaciones = ['Libro'];
  return bibliotecaPublicaciones;
}

var libRevChange = function (event) {
  var select = $(event.currentTarget);

  var tiposPublicaciones = [];
  var facetaPublicacion = 'Publicación';

  if ('Ediciones SAIJ' === select[0].value) {
    tiposPublicaciones = obtenerEdicionesInfojus();
  } else if ('Biblioteca Digital' === select[0].value) {
    tiposPublicaciones = obtenerBibliotecaDigital();
  }

  var tipoLivRev = $('#lib-rev-tipo');
  tipoLivRev.find('option').remove();
  tipoLivRev.append('<option selected="selected" value="">Todos</option>');

  for (var i = 0; i < tiposPublicaciones.length; i++) {
    tipoLivRev.append(
      '<option value="' +
        tiposPublicaciones[i] +
        '">' +
        tiposPublicaciones[i] +
        '</option>',
    );
  }

  return false;
};

var jurisdiccionFalloChange = function (event) {
  var select = $(event.currentTarget);
  var facetaJurisdiccion = 'Jurisdicción/' + select[0].value;

  llenarComboTribunal(facetaJurisdiccion);
  return false;
};

var llenarComboTribunal = function (facetaJurisdiccion) {
  var result = new QueryObject()
    .setPageSize(0)
    .putFacet('Tribunal', 5000, 1)
    .putFacet('Tipo de Documento/Jurisprudencia')
    .putFacet(facetaJurisdiccion)
    .doQuery();
  var tribunales = _(result)
    .secureGet(['searchResults', 'categoriesResultList', '0', 'facetChildren'])
    .asArray();

  var tribunalElement = $('#tribunal-jurisprudencia-fallo');
  tribunalElement.find('option').remove();
  tribunalElement.append('<option selected="selected" value="">Todos</option>');

  var tribunalesNames = [];
  for (var n = 0; n < tribunales.length; n++) {
    tribunalesNames[n] = tribunales[n].facetName;
  }

  tribunalesNames.sort();

  for (var i = 0; i < tribunales.length; i++) {
    //var tribunal = tribunales[i].facetName;
    var tribunal = tribunalesNames[i];
    tribunalElement.append(
      '<option value="' + tribunal + '">' + tribunal + '</option>',
    );
  }
};

//aca hay que hacer la modificacion
var llenarComboOrganismo = function (tipoDocumento) {
  var result = new QueryObject()
    .setPageSize(0)
    .putFacet(tipoDocumento)
    .putFacet('Organismo', 5000, 1)
    .doQuery();
  var organismos = _(result)
    .secureGet(['searchResults', 'categoriesResultList', '1', 'facetChildren'])
    .asArray();

  var organismoElement = $('#organismo-document-element');
  organismoElement.find('option').remove();
  organismoElement.append(
    '<option selected="selected" value="">Todos</option>',
  );
  var organismosArray = [];

  for (var i = 0; i < organismos.length; i++) {
    if (organismos[i].facetName != 'categoriavacia')
      organismosArray.push(organismos[i].facetName);
  }

  organismosArray.sort();
  for (var j = 0; j < organismosArray.length; j++) {
    organismoElement.append(
      '<option value="' +
        organismosArray[j] +
        '" title="' +
        findOrganismoBySigla(organismosArray[j]) +
        '" >' +
        organismosArray[j] +
        '</option>',
    );
  }
};

function findOrganismoBySigla(sigla) {
  const organismosTitle = getProtectedItem('organismosTitle');
  for (var i = 0; i < organismosTitle.length; i++) {
    if (organismosTitle[i].sigla === sigla) {
      return organismosTitle[i].organismo;
    }
  }
  return null;
}
function callOrganismosServices() {
  var dataResponse = '';

  $.ajax({
    async: false,
    url: '/organismos',
    success: function (json) {
      dataResponse = json;
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Error llamando al servicio de organismos: ' + textStatus);
    },
  });

  setProtectedItem('organismosTitle', dataResponse);

  Cookies.set('organismosTitle', 'Cookie activa', { expires: 1 / 24 }); // 1 hour

  return dataResponse;
}

var tabOnClick = function (event) {
  var name = event.currentTarget.id.substring(4);
  activarTab(name);
};

function obtenerRangoRespuesta(fechaDesdeLeg, fechaHastaLeg) {
  var respuesta = obtenerDataFechaRango(fechaDesdeLeg, fechaHastaLeg);

  if (respuesta == 'fechaDesdeError') {
    $('#fecha-desde-mala-legislacion').show();
    $('#fecha-desde-mala-legislacion').html('* Fecha desde incorrecta ');
    return false;
  } else if (respuesta == 'fechaHastaError') {
    $('#fecha-hasta-mala-legislacion').show();
    $('#fecha-hasta-mala-legislacion').html('* Fecha hasta incorrecta ');
    return false;
  } else if (respuesta == 'ambasFechas') {
    $('#fecha-desde-mala-legislacion').show();
    $('#fecha-desde-mala-legislacion').html('* Fecha desde incorrecta ');
    $('#fecha-hasta-mala-legislacion').show();
    $('#fecha-hasta-mala-legislacion').html('* Fecha hasta incorrecta ');
    return false;
  } else {
    if (
      fechaDesdeLeg != '' &&
      fechaHastaLeg == '' &&
      isYearOnly(fechaDesdeLeg)
    ) {
      $('#fecha-hasta-legislacion').val(fechaDesdeLeg);
    }
    return respuesta;
  }
}
function getQueryDataLegislacion() {
  var data = {};
  data.q = '';
  //var fechaFaceta = "Fecha";
  var tipoDocumento = 'Tipo de Documento/Legislación';
  var tipoDocumentoVal = $('#tipo-documento-legislacion').val();
  //Seria una faceta
  if (tipoDocumentoVal) {
    tipoDocumento += '/' + tipoDocumentoVal;
  }

  $('#numero-norma-error').hide();

  var numeroNorma = $('#numero-norma-legislacion').val();
  var validAnioNorma = false;
  if (numeroNorma) {
    if (numeroNorma.indexOf('.') != -1) {
      numeroNorma = replaceAll(numeroNorma, '.', '');
    }
    numeroNorma = $.trim(numeroNorma);
    var numeroFecha = numeroNorma.split(/[\/]/);

    var reg = new RegExp('^\\d+$');

    //			alert(reg.test(totest));

    if (!numeroFecha[0] || !reg.test($.trim(numeroFecha[0]))) {
      numeroNormaError('* No ha ingresado un numero de norma valido');
      return false;
    }

    data.q = data.q + 'AND (numero-norma:' + $.trim(numeroFecha[0]) + ' ';
    if (numeroFecha.length > 1 && numeroFecha[1] != '') {
      if (!isYearOnly($.trim(numeroFecha[1]))) {
        numeroNormaError('* Ha ingresado un año de norma inválido');
        return false;
      } else {
        data.q =
          data.q +
          (numeroFecha[1]
            ? 'AND fecha:' + $.trim(numeroFecha[1])
            : ' OR fecha:' + $.trim(numeroFecha[0])) +
          ') ';
        validAnioNorma = true;
      }
    } else {
      data.q = data.q + ')';
    }
  }

  var tituloLegislacion = $('#titulo-legislacion').val();

  if (tituloLegislacion) {
    tituloLegislacion = replaceEspecialCaracters(tituloLegislacion);
    tituloLegislacion = $.trim(tituloLegislacion.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('titulo', tituloLegislacion);
  }

  //Seria una faceta
  var jurisdiccion = 'Jurisdicción';
  var jurisdiccionVal = $('#jurisdiccion-legislacion').val();

  if (jurisdiccionVal) {
    jurisdiccion += '/' + jurisdiccionVal;
  }
  //Seria una faceta
  var tema = 'Tema';
  var temaVal = $('#tema-legislacion').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal
        .replace(/ /g, '?')
        .replace(/\)/g, '?')
        .replace(/\(/g, '?')
        .replace(/\//g, '?');
    data.q = data.q + ' AND ' + tema;
  }
  //Seria una faceta
  var organismo = 'Organismo';
  var organismoVal = $('#organismo-document-element').val();
  if (organismoVal) {
    organismo += '/' + organismoVal;
  }

  var fechaDesdeLeg = $('#fecha-desde-legislacion').val();
  var fechaHastaLeg = $('#fecha-hasta-legislacion').val();

  //Se agrega condicion: si el numero de la norma viene con /anio, se debe ignorar lo ingresado en fecha de sancion.
  if ((fechaDesdeLeg != '' || fechaHastaLeg != '') && !validAnioNorma) {
    var respuesta = obtenerRangoRespuesta(fechaDesdeLeg, fechaHastaLeg);
    if (respuesta) {
      //respuesta != "fechaDesdeError" && respuesta != "fechaHastaError" && respuesta != "ambasFechas"){
      data.q = data.q + respuesta;
    } else {
      return false;
    }
  }

  //Seria una faceta de Estado de vigencia
  var estado = 'Estado de Vigencia';
  var estadoVal = $('#estado-legislacion').val();

  if (estadoVal == '') {
    estadoVal = $('#estado-legislacion-dec').val();
  }

  if (estadoVal) {
    estado += '/' + estadoVal;
  }

  var textoLegislacion = $('#texto-legislacion').val();
  if (textoLegislacion) {
    textoLegislacion = replaceEspecialCaracters(textoLegislacion);
    textoLegislacion = $.trim(textoLegislacion.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('texto', textoLegislacion);
  }

  var idInfojus = $('#id-doc-legislacion').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);

  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  var urlParams =
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|' +
    organismo +
    '|Publicación|Tema|' +
    estado +
    '|Autor|' +
    jurisdiccion +
    '&v=colapsada';

  return urlParams;
}

function numeroNormaError(message) {
  $('#numero-norma-error').show();
  $('#numero-norma-error').html(message);
}

function showError(message, idError) {
  $('#' + idError).show();
  $('#' + idError).html(message);
}

function replaceEspecialCaracters(texto) {
  return $.trim(texto.replace(/([.*+\-\"#¡!%&"?//^$|(){}\[\]])/gm, ''));
}

function getQueryDataSumario() {
  var data = {};
  data.q = '';
  var urlParams = '';
  var tipoDocumento = 'Tipo de Documento/Jurisprudencia/Sumario';
  urlParams = armarUrlSumario(tipoDocumento, data);
  return urlParams;
}

function getQueryDataSentencia() {
  var data = {};
  data.q = '';
  var urlParams = '';
  var tipoDocumento = 'Tipo de Documento/Jurisprudencia/Fallo';
  urlParams = armarUrlFallo(tipoDocumento, data);
  return urlParams;
}

function getQueryDataDictamen() {
  var urlParams = '';
  var data = {};
  data.q = '';

  var tipoDocumentoVal = $('#tipo-documento-dictamen').val();
  var tipoDocumento = 'Tipo de Documento/Dictamen';
  if ('PTN' == tipoDocumentoVal) {
    urlParams = armarUrlDictamenPTN(tipoDocumento, data);
  } else if ('INADI' == tipoDocumentoVal) {
    urlParams = armarUrlDictamenINADI(tipoDocumento, data);
  } else if ('MPF' == tipoDocumentoVal) {
    urlParams = armarUrlDictamenMPF(tipoDocumento, data);
  } else if ('OA' == tipoDocumentoVal) {
    urlParams = armarUrlDictamenOA(tipoDocumento, data);
  } else if ('AAIP' == tipoDocumentoVal) {
    urlParams = armarUrlDictamenAAIP(tipoDocumento, data);
  } else {
    urlParams = armarUrlDictamen(tipoDocumento, data);
  }

  return urlParams;
}

function armarUrlDictamenOA(tipoDocumento, data) {
  tipoDocumento += '/' + 'OA';

  //NUMERO
  var numeroDictamen = $('#dictamen-numero').val();
  var validAnioDictamen = false;
  if (numeroDictamen) {
    if (numeroDictamen.indexOf('.') != -1) {
      numeroDictamen = replaceAll(numeroDictamen, '.', '');
    }
    numeroDictamen = $.trim(numeroDictamen);
    var numeroFecha = numeroDictamen.split(/[\/]/);

    var reg = new RegExp('^\\d+$');
    if (!numeroFecha[0] || !reg.test($.trim(numeroFecha[0]))) {
      showError(
        '* No ha ingresado un numero de Dictamen valido',
        'numero-mala-dictamen',
      );
      return false;
    }

    data.q = data.q + 'AND (numero:' + $.trim(numeroFecha[0]) + ' ';
    if (numeroFecha.length > 1 && numeroFecha[1] != '') {
      if (!isYearOnly($.trim(numeroFecha[1]))) {
        showError(
          '* Ha ingresado un año de norma inválido',
          'numero-mala-dictamen',
        );
        return false;
      } else {
        data.q =
          data.q +
          (numeroFecha[1]
            ? 'AND fecha:' + $.trim(numeroFecha[1])
            : ' OR fecha:' + $.trim(numeroFecha[0])) +
          ') ';
        validAnioDictamen = true;
      }
    } else {
      data.q = data.q + ')';
    }
  }
  //FECHA
  var fechaDesde = $('#dictamen-fecha-desde').val();
  var fechaHasta = $('#dictamen-fecha-hasta').val();

  if (fechaDesde != '' || fechaHasta != '') {
    var respuesta = obtenerDataFechaRango(fechaDesde, fechaHasta);

    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');

      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#dictamen-fecha-hasta').val(fechaDesde);
      }

      data.q = data.q + respuesta;
    }
  }
  //TEMA
  var tema = 'Tema';
  var temaVal = $('#dictamen-tema').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }

  //PARTES
  var partesDictamenOA = $('#dictamen-partes-oa').val();
  if (partesDictamenOA) {
    data.q =
      data.q + ' AND partes:' + replaceEspecialCaracters(partesDictamenOA);
  }

  //PALABRA LIBRE
  var textoDictamenOA = $('#dictamen-texto').val();

  if (textoDictamenOA) {
    textoDictamenOA = replaceEspecialCaracters(textoDictamenOA);
    textoDictamenOA = $.trim(textoDictamenOA.replace(/ +/g, ' '));

    //OA
    var sumarioDictamen =
      ' (' + eliminarStopWords('sumario', textoDictamenOA).substring(4) + ') ';
    var sintesisDictamen =
      ' (' + eliminarStopWords('sintesis', textoDictamenOA).substring(4) + ') ';

    data.q =
      data.q + ' OR (' + sumarioDictamen + ' OR ' + sintesisDictamen + ') ';
  }

  var idInfojus = $('#id-doc-dictamen').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);
  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  return (
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|Organismo|Publicación|Tribunal|Tema|Estado de Vigencia|Autor|Jurisdicción&v=colapsada'
  );
}

function armarUrlDictamenINADI(tipoDocumento, data) {
  tipoDocumento += '/' + 'INADI';

  //NUMERO
  var numeroDictamen = $('#dictamen-numero').val();
  var validAnioDictamen = false;
  if (numeroDictamen) {
    if (numeroDictamen.indexOf('.') != -1) {
      numeroDictamen = replaceAll(numeroDictamen, '.', '');
    }
    numeroDictamen = $.trim(numeroDictamen);
    var numeroFecha = numeroDictamen.split(/[\/]/);

    var reg = new RegExp('^\\d+$');
    if (!numeroFecha[0] || !reg.test($.trim(numeroFecha[0]))) {
      showError(
        '* No ha ingresado un numero de Dictamen valido',
        'numero-mala-dictamen',
      );
      return false;
    }

    data.q = data.q + 'AND (numero:' + $.trim(numeroFecha[0]) + ' ';
    if (numeroFecha.length > 1 && numeroFecha[1] != '') {
      if (!isYearOnly($.trim(numeroFecha[1]))) {
        showError(
          '* Ha ingresado un año de norma inválido',
          'numero-mala-dictamen',
        );
        return false;
      } else {
        data.q =
          data.q +
          (numeroFecha[1]
            ? 'AND fecha:' + $.trim(numeroFecha[1])
            : ' OR fecha:' + $.trim(numeroFecha[0])) +
          ') ';
        validAnioDictamen = true;
      }
    } else {
      data.q = data.q + ')';
    }
  }
  //FECHA
  var fechaDesde = $('#dictamen-fecha-desde').val();
  var fechaHasta = $('#dictamen-fecha-hasta').val();

  if (fechaDesde != '' || fechaHasta != '') {
    var respuesta = obtenerDataFechaRango(fechaDesde, fechaHasta);

    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');

      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#dictamen-fecha-hasta').val(fechaDesde);
      }

      data.q = data.q + respuesta;
    }
  }
  //TEMA
  var tema = 'Tema';
  var temaVal = $('#dictamen-tema').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }

  //PARTES
  var partesDictamenINADI = $('#dictamen-partes-inadi').val();
  if (partesDictamenINADI) {
    data.q =
      data.q + ' AND partes:' + replaceEspecialCaracters(partesDictamenINADI);
  }

  //PALABRA LIBRE
  var textoDictamenINADI = $('#dictamen-texto').val();

  if (textoDictamenINADI) {
    textoDictamenINADI = replaceEspecialCaracters(textoDictamenINADI);
    textoDictamenINADI = $.trim(textoDictamenINADI.replace(/ +/g, ' '));

    //INADI
    var sumarioDictamen =
      ' (' +
      eliminarStopWords('sumario', textoDictamenINADI).substring(4) +
      ') ';
    var sintesisDictamen =
      ' (' +
      eliminarStopWords('sintesis', textoDictamenINADI).substring(4) +
      ') ';

    data.q =
      data.q + ' OR (' + sumarioDictamen + ' OR ' + sintesisDictamen + ') ';
  }

  var idInfojus = $('#id-doc-dictamen').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);
  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  return (
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|Organismo|Publicación|Tribunal|Tema|Estado de Vigencia|Autor|Jurisdicción&v=colapsada'
  );
}

function armarUrlDictamenPTN(tipoDocumento, data) {
  tipoDocumento += '/' + 'PTN';
  //NUMERO
  var numeroDictamen = $('#dictamen-numero').val();
  var validAnioDictamen = false;
  if (numeroDictamen) {
    if (numeroDictamen.indexOf('.') != -1) {
      numeroDictamen = replaceAll(numeroDictamen, '.', '');
    }
    numeroDictamen = $.trim(numeroDictamen);
    var numeroFecha = numeroDictamen.split(/[\/]/);

    var reg = new RegExp('^\\d+$');
    if (!numeroFecha[0] || !reg.test($.trim(numeroFecha[0]))) {
      showError(
        '* No ha ingresado un numero de Dictamen valido',
        'numero-mala-dictamen',
      );
      return false;
    }

    data.q = data.q + 'AND (numero:' + $.trim(numeroFecha[0]) + ' ';
    if (numeroFecha.length > 1 && numeroFecha[1] != '') {
      if (!isYearOnly($.trim(numeroFecha[1]))) {
        showError(
          '* Ha ingresado un año de norma inválido',
          'numero-mala-dictamen',
        );
        return false;
      } else {
        data.q =
          data.q +
          (numeroFecha[1]
            ? 'AND fecha:' + $.trim(numeroFecha[1])
            : ' OR fecha:' + $.trim(numeroFecha[0])) +
          ') ';
        validAnioDictamen = true;
      }
    } else {
      data.q = data.q + ')';
    }
  }

  //FECHA
  var fechaDesde = $('#dictamen-fecha-desde').val();
  var fechaHasta = $('#dictamen-fecha-hasta').val();

  if (fechaDesde != '' || fechaHasta != '') {
    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');

      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#dictamen-fecha-hasta').val(fechaDesde);
      }

      data.q = data.q + respuesta;
    }
  }

  //TEMA
  var tema = 'Tema';
  var temaVal = $('#dictamen-tema').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }
  //TOMO y PAGINA
  var tomo = $('#dictamen-tomo-ptn').val();
  var pagina = $('#dictamen-ptn-pagina').val();

  if (tomo) {
    tomo = pad(tomo, 3);
  }

  if (pagina) {
    pagina = pad(pagina, 3);
  }

  var idinfojus = tomo + pagina;

  if (idinfojus != '') {
    if (idinfojus != '000000') {
      if (pagina != '') {
        data.q = data.q + ' AND id-infojus:*' + idinfojus;
      } else {
        data.q = data.q + ' AND id-infojus:*' + idinfojus + '???';
      }
    }
  }

  //PALABRA LIBRE
  var textoDictamen = $('#dictamen-texto').val();

  if (textoDictamen) {
    textoDictamen = replaceEspecialCaracters(textoDictamen);
    textoDictamen = $.trim(textoDictamen.replace(/ +/g, ' '));

    var textoINADIDictamen =
      ' (' + eliminarStopWords('texto', textoDictamen).substring(4) + ') ';
    var textoCompletoDictamen =
      ' (' +
      eliminarStopWords('texto-completo', textoDictamen).substring(4) +
      ') ';

    data.q =
      data.q +
      ' OR (' +
      textoINADIDictamen +
      ' OR ' +
      textoCompletoDictamen +
      ') ';
  }

  var idInfojus = $('#id-doc-dictamen').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);
  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  return (
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|Organismo|Publicación|Tribunal|Tema|Estado de Vigencia|Autor|Jurisdicción&v=colapsada'
  );
}

function armarUrlDictamenMPF(tipoDocumento, data) {
  tipoDocumento += '/' + 'Ministerio Público Fiscal';

  //NUMERO
  var numeroDictamen = $('#dictamen-numero').val();
  var validAnioDictamen = false;
  if (numeroDictamen) {
    if (numeroDictamen.indexOf('.') != -1) {
      numeroDictamen = replaceAll(numeroDictamen, '.', '');
    }
    numeroDictamen = $.trim(numeroDictamen);
    var numeroFecha = numeroDictamen.split(/[\/]/);

    var reg = new RegExp('^\\d+$');
    if (!numeroFecha[0] || !reg.test($.trim(numeroFecha[0]))) {
      showError(
        '* No ha ingresado un numero de Dictamen valido',
        'numero-mala-dictamen',
      );
      return false;
    }

    data.q = data.q + 'AND (numero:' + $.trim(numeroFecha[0]) + ' ';
    if (numeroFecha.length > 1 && numeroFecha[1] != '') {
      if (!isYearOnly($.trim(numeroFecha[1]))) {
        showError(
          '* Ha ingresado un año de norma inválido',
          'numero-mala-dictamen',
        );
        return false;
      } else {
        data.q =
          data.q +
          (numeroFecha[1]
            ? 'AND fecha:' + $.trim(numeroFecha[1])
            : ' OR fecha:' + $.trim(numeroFecha[0])) +
          ') ';
        validAnioDictamen = true;
      }
    } else {
      data.q = data.q + ')';
    }
  }

  //FECHA
  var fechaDesde = $('#dictamen-fecha-desde').val();
  var fechaHasta = $('#dictamen-fecha-hasta').val();

  if (fechaDesde != '' || fechaHasta != '') {
    var respuesta = obtenerDataFechaRango(fechaDesde, fechaHasta);

    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');

      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#dictamen-fecha-hasta').val(fechaDesde);
      }

      data.q = data.q + respuesta;
    }
  }

  //TEMA
  var tema = 'Tema';
  var temaVal = $('#dictamen-tema').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }

  //PARTES
  var partesDictamenMPF = $('#dictamen-partes-mpf').val();
  if (partesDictamenMPF) {
    data.q = data.q + ' AND partes:' + partesDictamenMPF;
  }
  //LETRA
  var letraDictamenMPF = $('#dictamen-letra').val();
  if (letraDictamenMPF) {
    data.q = data.q + ' AND letra:' + letraDictamenMPF;
  }
  //TOMO
  var tomoDictamenMPF = $('#dictamen-tomo-mpf').val();
  if (tomoDictamenMPF) {
    data.q = data.q + ' AND tomo:' + tomoDictamenMPF;
  }
  //PALABRA LIBRE
  var textoDictamenMPF = $('#dictamen-texto').val();

  if (textoDictamenMPF) {
    textoDictamenMPF = replaceEspecialCaracters(textoDictamenMPF);
    textoDictamenMPF = $.trim(textoDictamenMPF.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('texto', textoDictamenMPF);
  }

  var idInfojus = $('#id-doc-dictamen').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);
  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  return (
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|Organismo|Publicación|Tribunal|Tema|Estado de Vigencia|Autor|Jurisdicción&v=colapsada'
  );
}

function armarUrlDictamenAAIP(tipoDocumento, data) {
  tipoDocumento += '/' + 'AAIP';

  //NUMERO
  var numeroDictamen = $('#dictamen-numero').val();
  var validAnioDictamen = false;
  if (numeroDictamen) {
    if (numeroDictamen.indexOf('.') != -1) {
      numeroDictamen = replaceAll(numeroDictamen, '.', '');
    }
    numeroDictamen = $.trim(numeroDictamen);
    var numeroFecha = numeroDictamen.split(/[\/]/);

    var reg = new RegExp('^\\d+$');
    if (!numeroFecha[0] || !reg.test($.trim(numeroFecha[0]))) {
      showError('* No ha ingresado un numero válido', 'numero-mala-dictamen');
      return false;
    }

    data.q = data.q + 'AND (numero:' + $.trim(numeroFecha[0]) + ' ';
    if (numeroFecha.length > 1 && numeroFecha[1] != '') {
      if (!isYearOnly($.trim(numeroFecha[1]))) {
        showError(
          '* Ha ingresado un año de norma inválido',
          'numero-mala-dictamen',
        );
        return false;
      } else {
        data.q =
          data.q +
          (numeroFecha[1]
            ? 'AND fecha:' + $.trim(numeroFecha[1])
            : ' OR fecha:' + $.trim(numeroFecha[0])) +
          ') ';
        validAnioDictamen = true;
      }
    } else {
      data.q = data.q + ')';
    }
  }

  //FECHA
  var fechaDesde = $('#dictamen-fecha-desde').val();
  var fechaHasta = $('#dictamen-fecha-hasta').val();

  if (fechaDesde != '' || fechaHasta != '') {
    var respuesta = obtenerDataFechaRango(fechaDesde, fechaHasta);

    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');

      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#dictamen-fecha-hasta').val(fechaDesde);
      }

      data.q = data.q + respuesta;
    }
  }

  //TEMA
  var tema = 'Tema';
  var temaVal = $('#dictamen-tema').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }

  //PARTES
  var partesDictamenAAIP = $('#dictamen-partes-aaip').val();
  if (partesDictamenAAIP) {
    data.q = data.q + ' AND partes:' + partesDictamenAAIP;
  }
  //LETRA
  var letraDictamenAAIP = $('#dictamen-letra').val();
  if (letraDictamenAAIP) {
    data.q = data.q + ' AND letra:' + letraDictamenAAIP;
  }
  //TOMO
  var tomoDictamenAAIP = $('#dictamen-tomo-aaip').val();
  if (tomoDictamenAAIP) {
    data.q = data.q + ' AND tomo:' + tomoDictamenAAIP;
  }
  //PALABRA LIBRE
  var textoDictamenAAIP = $('#dictamen-texto').val();

  if (textoDictamenAAIP) {
    textoDictamenAAIP = replaceEspecialCaracters(textoDictamenAAIP);
    textoDictamenAAIP = $.trim(textoDictamenMPF.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('texto', textoDictamenAAIP);
  }

  var idInfojus = $('#id-doc-dictamen').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);
  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  return (
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|Organismo|Publicación|Tribunal|Tema|Estado de Vigencia|Autor|Jurisdicción&v=colapsada'
  );
}

function armarUrlDictamen(tipoDocumento, data) {
  //NUMERO
  var numeroDictamen = $('#dictamen-numero').val();
  var validAnioDictamen = false;
  if (numeroDictamen) {
    if (numeroDictamen.indexOf('.') != -1) {
      numeroDictamen = replaceAll(numeroDictamen, '.', '');
    }
    numeroDictamen = $.trim(numeroDictamen);
    var numeroFecha = numeroDictamen.split(/[\/]/);

    var reg = new RegExp('^\\d+$');
    if (!numeroFecha[0] || !reg.test($.trim(numeroFecha[0]))) {
      showError(
        '* No ha ingresado un numero de Dictamen valido',
        'numero-mala-dictamen',
      );
      return false;
    }

    data.q = data.q + 'AND (numero:' + $.trim(numeroFecha[0]) + ' ';
    if (numeroFecha.length > 1 && numeroFecha[1] != '') {
      if (!isYearOnly($.trim(numeroFecha[1]))) {
        showError(
          '* Ha ingresado un año de norma inválido',
          'numero-mala-dictamen',
        );
        return false;
      } else {
        data.q =
          data.q +
          (numeroFecha[1]
            ? 'AND fecha:' + $.trim(numeroFecha[1])
            : ' OR fecha:' + $.trim(numeroFecha[0])) +
          ') ';
        validAnioDictamen = true;
      }
    } else {
      data.q = data.q + ')';
    }
  }
  var tema = 'Tema';
  var temaVal = $('#dictamen-tema').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }

  var fechaDesde = $('#dictamen-fecha-desde').val();
  var fechaHasta = $('#dictamen-fecha-hasta').val();

  if (fechaDesde != '' || fechaHasta != '') {
    var respuesta = obtenerDataFechaRango(fechaDesde, fechaHasta);

    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');

      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-dictamen').show();
      $('#fecha-desde-mala-dictamen').html('* Fecha desde incorrecta ');
      $('#fecha-hasta-mala-dictamen').show();
      $('#fecha-hasta-mala-dictamen').html('* Fecha hasta incorrecta ');

      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#dictamen-fecha-hasta').val(fechaDesde);
      }

      data.q = data.q + respuesta;
    }
  }

  var textoDictamen = $('#dictamen-texto').val();

  if (textoDictamen) {
    textoDictamen = replaceEspecialCaracters(textoDictamen);
    textoDictamen = $.trim(textoDictamen.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('texto', textoDictamen);
  }

  var idInfojus = $('#id-doc-dictamen').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);

  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  return (
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|Organismo|Publicación|Tribunal|Tema|Estado de Vigencia|Autor|Jurisdicción&v=colapsada'
  );
}

function isYearOnly(fecha) {
  if (fecha.length == 4 && isInteger(fecha)) {
    return true;
  }

  return false;
}

function isInteger(s) {
  var i;
  for (i = 0; i < s.length; i++) {
    var c = s.charAt(i);
    if (c < '0' || c > '9') return false;
  }
  return true;
}

function obtenerFechaRango(fechaDesde, fechaHasta) {
  if (fechaDesde == '') {
    fechaDesde = '01/01/1800';
  }
  if (fechaHasta == '' && !isYearOnly(fechaDesde)) {
    var fechaHoy = new Date();
    fechaHasta =
      ('0' + fechaHoy.getDate()).substr(-2) +
      '/' +
      ('0' + (fechaHoy.getMonth() + 1)).substr(-2) +
      '/' +
      fechaHoy.getFullYear();
  } else {
    if (fechaHasta == '') {
      fechaHasta = fechaDesde;
    }
  }

  var dateFrom = '';
  var dateTo = '';

  if (isYearOnly(fechaDesde)) {
    dateFrom = fechaDesde + '0101';
  } else {
    var fechaDesdeArray = obtenerFechaAsArray(fechaDesde);
    var mesDesde = fechaDesdeArray[1];
    var mesDesdeInt = parseInt(mesDesde);
    var fechaDesdeData = new Date(
      fechaDesdeArray[2],
      mesDesdeInt - 1 + '',
      fechaDesdeArray[0],
    );

    dateFrom =
      fechaDesdeData.getFullYear() +
      ('0' + (fechaDesdeData.getMonth() + 1)).substr(-2) +
      ('0' + fechaDesdeData.getDate()).substr(-2);
  }

  if (isYearOnly(fechaHasta)) {
    dateTo = fechaHasta + '1231';
  } else {
    var fechaHastaArray = obtenerFechaAsArray(fechaHasta);
    var mesHasta = fechaHastaArray[1];
    var mesHastaInt = parseInt(mesHasta);
    var fechaHastaData = new Date(
      fechaHastaArray[2],
      mesHastaInt - 1 + '',
      fechaHastaArray[0],
    );

    dateTo =
      fechaHastaData.getFullYear() +
      ('0' + (fechaHastaData.getMonth() + 1)).substr(-2) +
      ('0' + fechaHastaData.getDate()).substr(-2);
  }

  return 'fecha-rango:[' + dateFrom + ' TO ' + dateTo + ']';
}

function obtenerFechaAsArray(fecha) {
  if (fecha) {
    return fecha.split('/');
  }

  return '';
}

function obtenerDataFechaRango(fechaDesde, fechaHasta) {
  var fechaDesdeValidated = true;
  var fechaHastaValidated = true;

  if (fechaDesde) {
    fechaDesdeValidated = validaFechaDDMMAAAA($.trim(fechaDesde));
  }

  if (fechaHasta) {
    fechaHastaValidated = validaFechaDDMMAAAA($.trim(fechaHasta));
  }

  if (fechaDesdeValidated == false && fechaHastaValidated == false) {
    return 'ambasFechas';
  }

  if (fechaDesdeValidated == false) {
    return 'fechaDesdeError';
  }

  if (fechaHastaValidated == false) {
    return 'fechaHastaError';
  }

  if (fechaDesde != '' || fechaHasta != '') {
    ' AND ' + obtenerFechaRango(fechaDesde, fechaHasta);
  }

  return ' AND ' + obtenerFechaRango(fechaDesde, fechaHasta);
}

function armarUrlSumario(tipoDocumento, data) {
  var jurisdiccion = 'Jurisdicción';
  var jurisdiccionVal = $('#jurisdiccion-jurisprudencia-sumario').val();

  if (jurisdiccionVal) {
    jurisdiccion += '/' + jurisdiccionVal;
  }

  var tribunal = 'Tribunal';
  var tribunalVal = $('#tribunal-jurisprudencia-sumario').val();

  if (tribunalVal) {
    tribunal += '/' + tribunalVal;
  }

  var tema = 'Tema';
  var temaVal = $('#tema-jurisprudencia-sumario').val();

  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }

  var fechaDesde = $('#fecha-desde-jurisprudencia-sumario').val();
  var fechaHasta = $('#fecha-hasta-jurisprudencia-sumario').val();

  if (fechaDesde != '' || fechaHasta != '') {
    var respuesta = obtenerDataFechaRango(fechaDesde, fechaHasta);

    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-jurisprudencia-sumario').show();
      $('#fecha-desde-mala-jurisprudencia-sumario').html(
        '* Fecha desde incorrecta ',
      );

      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-jurisprudencia-sumario').show();
      $('#fecha-hasta-mala-jurisprudencia-sumario').html(
        '* Fecha hasta incorrecta ',
      );

      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-jurisprudencia-sumario').show();
      $('#fecha-desde-mala-jurisprudencia-sumario').html(
        '* Fecha desde incorrecta ',
      );
      $('#fecha-hasta-mala-jurisprudencia-sumario').show();
      $('#fecha-hasta-mala-jurisprudencia-sumario').html(
        '* Fecha hasta incorrecta ',
      );

      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#fecha-hasta-jurisprudencia-sumario').val(fechaDesde);
      }

      data.q = data.q + respuesta;
    }
  }

  var textoSumario = $('#texto-jurisprudencia-sumario').val();

  if (textoSumario) {
    textoSumario = replaceEspecialCaracters(textoSumario);
    textoSumario = $.trim(textoSumario.replace(/ +/g, ' '));
    textoSumario = textoSumario.split(' ').join(' AND texto: ');
    data.q = data.q + ' AND texto:' + textoSumario;
  }

  var idInfojus = $('#id-doc-sumario').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);

  var rawQuery = '';

  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  return (
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|Organismo|' +
    tribunal +
    '|' +
    'Tema' +
    '|Publicación|Estado de Vigencia|Autor|' +
    jurisdiccion +
    '&v=colapsada'
  );
}

function eliminarStopWords(campo, campoValor) {
  var stopWords = [
    'de',
    'y',
    'el',
    'la',
    'las',
    'lo',
    'los',
    'del',
    'a',
    'con',
    'c/',
    's/',
  ];
  var campoValorArray = campoValor.split(' ');
  var resultado = '';
  if (campoValorArray.length > 0) {
    for (var i = 0; i < campoValorArray.length; i++) {
      if ($.inArray(campoValorArray[i], stopWords) == -1) {
        resultado =
          resultado + ' AND ' + campo + ': ' + $.trim(campoValorArray[i]);
      }
    }
  }
  return resultado;
}

function armarUrlFallo(tipoDocumento, data) {
  var subtipo = $('#tipo-jurisprudencia-fallo').val();
  if (subtipo) tipoDocumento += '/' + subtipo;

  var caratulaFallo = $('#caratula-jurisprudencia-fallo').val();

  if (caratulaFallo) {
    caratulaFallo = replaceEspecialCaracters(caratulaFallo);
    caratulaFallo = $.trim(caratulaFallo.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('titulo', caratulaFallo);
  }

  var jurisdiccion = 'Jurisdicción';
  var jurisdiccionVal = $('#jurisdiccion-jurisprudencia-fallo').val();
  if (jurisdiccionVal) {
    jurisdiccion += '/' + jurisdiccionVal;
  }

  var tribunal = 'Tribunal';
  var tribunalVal = $('#tribunal-jurisprudencia-fallo').val();
  if (tribunalVal) {
    tribunal += '/' + tribunalVal;
  }

  var fechaDesde = $('#fecha-desde-jurisprudencia-fallo').val();
  var fechaHasta = $('#fecha-hasta-jurisprudencia-fallo').val();

  if (fechaDesde != '' || fechaHasta != '') {
    var respuesta = obtenerDataFechaRango(fechaDesde, fechaHasta);

    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-jurisprudencia-fallo').show();
      $('#fecha-desde-mala-jurisprudencia-fallo').html(
        '* Fecha desde incorrecta ',
      );
      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-jurisprudencia-fallo').show();
      $('#fecha-hasta-mala-jurisprudencia-fallo').html(
        '* Fecha hasta incorrecta ',
      );
      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-jurisprudencia-fallo').show();
      $('#fecha-desde-mala-jurisprudencia-fallo').html(
        '* Fecha desde incorrecta ',
      );
      $('#fecha-hasta-mala-jurisprudencia-fallo').show();
      $('#fecha-hasta-mala-jurisprudencia-fallo').html(
        '* Fecha hasta incorrecta ',
      );
      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#fecha-hasta-jurisprudencia-fallo').val(fechaDesde);
      }

      data.q = data.q + respuesta;
    }
  }

  var temaVal = $('#tema-jurisprudencia-fallo').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }

  var textoFallo = $('#texto-jurisprudencia-fallo').val();

  if (textoFallo) {
    textoFallo = replaceEspecialCaracters(textoFallo);
    textoFallo = $.trim(textoFallo.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('texto', textoFallo);
  }

  var idInfojus = $('#id-doc-sentencia').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);

  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  return (
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|' +
    tipoDocumento +
    '|Fecha|Organismo|' +
    tribunal +
    '|Publicación|Tema|Estado de Vigencia|Autor|' +
    jurisdiccion +
    '&v=colapsada'
  );
}

function limpiarAll() {
  $('.validation').hide();
  clearLocalStorage('organismosTitle');
}

function limpiarLegislacion() {
  document.getElementById('buscador-legislacion-form').reset();
  $('.validation').hide();
  clearLocalStorage('organismosTitle');
  $('#tipo-documento-legislacion')
    .find('option[value="Ley"]')
    .prop('selected', null);
  $('#tipo-documento-legislacion')
    .find('option[value=""]')
    .attr('selected', 'selected');
  esconderCamposLegislacionReglasNeg('TODO');
  //$('.resultados-busqueda-hide').hide();
}
function limpiarFallo() {
  document.getElementById('buscador-fallo-form').reset();
  clearLocalStorage('organismosTitle');
  $('.validation').hide();
  //$('.resultados-busqueda-hide').hide();
}
function limpiarSumario() {
  document.getElementById('buscador-sumario-form').reset();
  clearLocalStorage('organismosTitle');
  $('.validation').hide();
  //$('.resultados-busqueda-hide').hide();
}
function limpiarDictamen() {
  document.getElementById('buscador-dictamen-form').reset();
  clearLocalStorage('organismosTitle');
  $('.validation').hide();
  //$('.resultados-busqueda-hide').hide();
}
function limpiarDoctrina() {
  document.getElementById('buscador-doctrina-form').reset();
  clearLocalStorage('organismosTitle');
  $('.validation').hide();
}
function limpiarEdiciones() {
  document.getElementById('buscador-lib-rev-form').reset();
  clearLocalStorage('organismosTitle');
  $('.validation').hide();
  //$('.resultados-busqueda-hide').hide();
}

function limpiarTodo() {
  document.getElementById('buscador-todo-form').reset();
  clearLocalStorage('organismosTitle');
  $('.validation').hide();
}

function getQueryDataLibrosRevistas() {
  var data = {};
  data.q = '';
  //TIPO DE DOCUMENTO
  var consulta = $('#lib-rev-consulta').val();
  if (consulta == '') {
    $('#libros-revistas-consulta').show();
    $('#libros-revistas-consulta').html(
      "<span style='color:red; font-size:11px; margin-top:2px'>* Debe ingresar un valor para el campo Consultar en </span>",
    );
    return false;
  }

  var tipoPublicacion = $('#lib-rev-tipo').val();

  var publicacion = 'Publicación/' + consulta + '/' + tipoPublicacion;

  //TITULO
  var tituloLibRev = $('#lib-rev-titulo').val();

  if (tituloLibRev) {
    data.q = data.q + ' AND titulo:' + tituloLibRev;
  }

  //SUGGESTER AUTOR
  var autor = 'Autor';
  var autorLibRev = $('#lib-rev-autor').val();
  if (autorLibRev) {
    //compilador
    //director
    //coordinador
    var autorSearch = ' autor:' + autorLibRev; //.replace(/ /g, '?');
    var compSearch = ' compilador:' + autorLibRev; //.replace(/ /g, '?');
    var directSearch = ' director:' + autorLibRev; //.replace(/ /g, '?');
    var coorSearch = ' coordinador:' + autorLibRev; //.replace(/ /g, '?');

    data.q =
      data.q +
      ' AND (' +
      autorSearch +
      ' OR ' +
      compSearch +
      ' OR ' +
      directSearch +
      ' OR ' +
      coorSearch +
      ') ';
  }

  //SUGGESTER DE TEMA
  var tema = 'Tema';
  var temaLibRev = $('#lib-rev-tema').val();
  if (temaLibRev) {
    //data.q = data.q + ' AND ' + temaLibRev.replace(/ /g, '?');
    var tema =
      'tema:' +
      temaLibRev.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
    //tema = tema + "/" + temaLibRev;
  }

  //TEXTO
  var textoLibRev = $('#lib-rev-texto').val();

  if (textoLibRev) {
    textoLibRev = replaceEspecialCaracters(textoLibRev);
    textoLibRev = $.trim(textoLibRev.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('texto', textoLibRev);
  }

  var idInfojus = $('#id-doc-ediciones').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);
  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  var urlParams =
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|Tipo de Documento|Fecha|Organismo|' +
    publicacion +
    '|Tribunal|Tema|Estado de Vigencia|' +
    autor +
    '|Jurisdicción&v=colapsada';

  return urlParams;
}

/*	function getQueryTodo() {
		queryObject = new QueryObject().makeDefault();
		queryObject.query = $('#allofit').val();
		var href = queryObject.buildBasicQuery();
		location.href = href;
		
		return null;
	}*/

function getQueryTodo() {
  var queryObject = new QueryObject().makeDefault();
  queryObject.query = $('#allofit').val(); // Texto del campo 'allofit'

  var temaVal = $('#tema').val().trim();
  var temaParam = '';

  if (temaVal) {
    // Reemplazar espacios y caracteres especiales y codificar el valor
    temaVal =
      'tema:' +
      temaVal
        .replace(/ /g, '?')
        .replace(/\)/g, '?')
        .replace(/\(/g, '?')
        .replace(/\//g, '?');
    temaParam = 'r=' + encodeURIComponent(temaVal);
  }

  // Obtener baseHref y evitar duplicar '/resultados.jsp'
  var baseHref = queryObject.buildBasicQuery();
  var finalUrl = '';

  if (temaParam) {
    // Insertar 'tema' como primer parámetro
    finalUrl = baseHref.replace(
      '/resultados.jsp?',
      '/resultados.jsp?' + temaParam + '&',
    );
  } else {
    finalUrl = baseHref;
  }

  // Redirigir a la nueva URL
  location.href = finalUrl;

  return null;
}

function getQueryDataDoctrina() {
  var data = {};
  data.q = '';

  var tituloDoctrina = $('#titulo-doctrina').val();

  if (tituloDoctrina) {
    tituloDoctrina = replaceEspecialCaracters(tituloDoctrina);
    tituloDoctrina = $.trim(tituloDoctrina.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('titulo', tituloDoctrina);
  }

  var autor = $('#autor-doctrina').val();

  if (autor) {
    autor = $.trim(autor.replace(/ +/g, ' '));
    var autorArray = autor.split(' ');

    var autorQuery = '';
    for (var i = 0; i < autorArray.length; i++) {
      autorQuery = autorQuery + ' autor:' + autorArray[i] + ' AND';
    }

    data.q = data.q + ' AND ' + autorQuery.substring(0, autorQuery.length - 4);
  }

  var tema = 'Tema';
  var temaVal = $('#tema-doctrina').val();
  if (temaVal) {
    var tema =
      'tema:' +
      temaVal.replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?');
    data.q = data.q + ' AND ' + tema;
  }

  var fechaDesde = $('#fecha-desde-jurisprudencia-doctrina').val();
  var fechaHasta = $('#fecha-hasta-jurisprudencia-doctrina').val();

  if (fechaDesde != '' || fechaHasta != '') {
    var respuesta = obtenerDataFechaRango(fechaDesde, fechaHasta);

    if (respuesta == 'fechaDesdeError') {
      $('#fecha-desde-mala-jurisprudencia-doctrina').show();
      $('#fecha-desde-mala-jurisprudencia-doctrina').html(
        '* Fecha desde incorrecta ',
      );
      return false;
    } else if (respuesta == 'fechaHastaError') {
      $('#fecha-hasta-mala-jurisprudencia-doctrina').show();
      $('#fecha-hasta-mala-jurisprudencia-doctrina').html(
        '* Fecha hasta incorrecta ',
      );
      return false;
    } else if (respuesta == 'ambasFechas') {
      $('#fecha-desde-mala-jurisprudencia-doctrina').show();
      $('#fecha-desde-mala-jurisprudencia-doctrina').html(
        '* Fecha desde incorrecta ',
      );
      $('#fecha-hasta-mala-jurisprudencia-doctrina').show();
      $('#fecha-hasta-mala-jurisprudencia-doctrina').html(
        '* Fecha hasta incorrecta ',
      );

      return false;
    } else {
      if (fechaDesde != '' && fechaHasta == '' && isYearOnly(fechaDesde)) {
        $('#fecha-hasta-jurisprudencia-doctrina').val(fechaDesde);
      }
      data.q = data.q + respuesta;
    }
  }

  var textoDoctrina = $('#texto-doctrina').val();

  if (textoDoctrina) {
    textoDoctrina = replaceEspecialCaracters(textoDoctrina);
    textoDoctrina = $.trim(textoDoctrina.replace(/ +/g, ' '));
    data.q = data.q + eliminarStopWords('texto', textoDoctrina);
  }

  var idInfojus = $('#id-doc-doctrina').val();
  if (idInfojus) {
    data.q = data.q + 'AND (id-infojus:' + idInfojus + ') ';
  }

  data.q = data.q.substring(4);
  var rawQuery = '';
  if (data.q != '') {
    rawQuery = 'r=' + data.q + '&';
  }

  var urlParams =
    rawQuery +
    'b=avanzada&o=0&p=25&f=Total|Tipo de Documento/Doctrina|Fecha|Organismo|Publicación|Tribunal|Tema|Estado de Vigencia|Autor|Jurisdicción&v=colapsada';

  return urlParams;
}

function buscar(namebutton) {
  localStorage.setItem('tipoDocumento', $('#tipoDocumento').val());
  if (namebutton == 'legislacion') {
    data = getQueryDataLegislacion();
  } else if (namebutton == 'fallo') {
    data = getQueryDataSentencia();
  } else if (namebutton == 'sumario') {
    data = getQueryDataSumario();
  } else if (namebutton == 'dictamen') {
    data = getQueryDataDictamen();
  } else if (namebutton == 'dictamen_oa') {
    data = getQueryDataDictamen();
  } else if (namebutton == 'ediciones') {
    data = getQueryDataLibrosRevistas();
  } else if (namebutton == 'doctrina') {
    data = getQueryDataDoctrina();
  } else if (namebutton == 'todo') {
    data = getQueryTodo();
  }

  if (data) {
    location.href = '/resultados.jsp?' + data;
  }
}

function inicializarBusqueda() {
  queryObject = new QueryObject().makeDefault();
  queryObject.parseQuery();
}
//VARIABLE
var localidades = {
  localidadesAcordada: [
    { localidad: 'Nacional', value: 'Nacional' },
    { localidad: 'Provincial', value: 'Local' },
    { localidad: 'Federal', value: 'Federal' },
  ],
  localidadesDesicion: [
    { localidad: 'Nacional', value: 'Nacional' },
    { localidad: 'Internacional', value: 'Internacional' },
  ],
  localidades: [
    { localidad: 'Nacional', value: 'Nacional' },
    { localidad: 'Internacional', value: 'Internacional' },
    { localidad: 'Provincial', value: 'Local' },
    { localidad: '-- Buenos Aires', value: 'Local/Buenos Aires' },
    { localidad: '-- Catamarca', value: 'Local/Catamarca' },
    {
      localidad: '-- Ciudad Autónoma de Buenos Aires',
      value: 'Local/Ciudad Autónoma de Buenos Aires',
    },
    { localidad: '-- Chaco', value: 'Local/Chaco' },
    { localidad: '-- Chubut', value: 'Local/Chubut' },
    { localidad: '-- Corrientes', value: 'Local/Corrientes' },
    { localidad: '-- Córdoba', value: 'Local/Córdoba' },
    { localidad: '-- Entre Ríos', value: 'Local/Entre Ríos' },
    { localidad: '-- Formosa', value: 'Local/Formosa' },
    { localidad: '-- Jujuy', value: 'Local/Jujuy' },
    { localidad: '-- La Pampa', value: 'Local/La Pampa' },
    { localidad: '-- La Rioja', value: 'Local/La Rioja' },
    { localidad: '-- Mendoza', value: 'Local/Mendoza' },
    { localidad: '-- Misiones', value: 'Local/Misiones' },
    { localidad: '-- Neuquén', value: 'Local/Neuquén' },
    { localidad: '-- Río Negro', value: 'Local/Río Negro' },
    { localidad: '-- Salta', value: 'Local/Salta' },
    { localidad: '-- Santa Fe', value: 'Local/Santa Fe' },
    { localidad: '-- San Juan', value: 'Local/San Juan' },
    { localidad: '-- San Luis', value: 'Local/San Luis' },
    { localidad: '-- Santa Cruz', value: 'Local/Santa Cruz' },
    { localidad: '-- Santiago del Estero', value: 'Local/Santiago del Estero' },
    { localidad: '-- Tierra del Fuego', value: 'Local/Tierra del Fuego' },
    { localidad: '-- Tucumán', value: 'Local/Tucumán' },
  ],
};

function esconderCamposLegislacionReglasNeg(evento) {
  $('.resol-show').hide();
  if (evento === 'Resolución') {
    $('.jurisdiccion-hide').hide();
    llenarComboOrganismo('Tipo de Documento/Legislación/Resolución');
    $('.resol-show').show();
    $('#jurisdiccion-legislacion').prop('value', '');
  } else if (evento === 'Disposición') {
    $('.resol-show').show();
    llenarComboOrganismo('Tipo de Documento/Legislación/Disposición');
  } else if (evento === 'Decisión') {
    //			$('.resol-show').show();
    $('.jurisdiccion-hide').hide();
    llenarComboOrganismo('Tipo de Documento/Legislación/Decisión');
    $('.resol-show').show();
    $('#jurisdiccion-legislacion').prop('value', '');
  } else {
    $('.jurisdiccion-hide').show();
    $('#organismo-document-element').prop('value', '');
    $('.resol-show').hide();
  }

  if (evento === 'Ley') {
    $('.estado-vigencia-hide').show();
    $('.estado-vigencia-hide-dec').hide();
  } else {
    $('.estado-vigencia-hide').hide();
    $('#estado-legislacion').prop('value', '');
  }

  if (evento === 'Decreto') {
    $('.estado-vigencia-hide-dec').show();
    $('.estado-vigencia-hide').hide();
  } else {
    $('.estado-vigencia-hide-dec').hide();
    $('#estado-legislacion').prop('value', '');
  }

  var localidadElement = $('#jurisdiccion-legislacion');
  localidadElement.find('option').remove();
  localidadElement.append(
    '<option selected="selected" value="">Todas</option>',
  );

  $('#jurisdiccion-legislacion').show();
  $('#jurisdiccionTitle').show();

  switch (evento) {
    case 'Decisión':
      dibujarSelectJurisdiccion(
        localidadElement,
        localidades.localidadesDesicion,
      );
      break;
    case 'Acordada':
      dibujarSelectJurisdiccion(
        localidadElement,
        localidades.localidadesAcordada,
      );
      break;
    case 'Disposición':
      $('#jurisdiccion-legislacion').hide();
      $('#jurisdiccionTitle').hide();
      break;
    default:
      dibujarSelectJurisdiccion(localidadElement, localidades.localidades);
  }
}

function dibujarSelectJurisdiccion(element, localidades) {
  for (var i = 0; i < localidades.length; i++) {
    element.append(
      '<option value="' +
        localidades[i]['value'] +
        '">' +
        localidades[i]['localidad'] +
        '</option>',
    );
  }
}

function setProtectedItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProtectedItem(key) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

function clearLocalStorage(exceptKey) {
  // Almacenar el valor de la clave protegida en una variable temporal
  const protectedValue = getProtectedItem(exceptKey);

  // Limpiar localStorage
  localStorage.clear();

  // Restaurar la clave protegida
  if (protectedValue !== null) {
    setProtectedItem(exceptKey, protectedValue);
  }
}
