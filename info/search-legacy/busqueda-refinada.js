function refinarBusqueda() {
  //	console.log(queryObject.buildQuery());
  if (
    $('#refinar-busqueda-texto-ingresado').val() != '' &&
    $('#refinar-busqueda-texto-ingresado').val() != undefined
  ) {
    var textoIngresado = $('#refinar-busqueda-texto-ingresado').val();

    if (queryObject.rawQuery) {
      console.log('Refinado sobre una query preexistente...');
      var preexistentQuery = queryObject.rawQuery;
      queryObject.setRawQuery(
        '(' +
          preexistentQuery +
          ')' +
          ' AND ((titulo:' +
          textoIngresado +
          ') OR (texto:' +
          textoIngresado +
          ') OR (sumario:' +
          textoIngresado +
          '))',
      );
      //			queryObject.setRawQuery("(" + preexistentQuery + ")" + " AND (moreLikeThis(titulo):" + textoIngresado + ")");
    } else {
      console.log('Refinando sin query preexistente...');
      queryObject.setRawQuery(
        'moreLikeThis(id-infojus, numero-norma^4, tipo-documento^4, titulo^4, jurisdiccion, tesauro, provincia, tribunal, organismo, autor, texto^0.5):' +
          textoIngresado,
      );
    }
    console.log('Query final: ' + queryObject.rawQuery);
    location.href = queryObject.buildRefinarQuery();
  }
}

function inicializarBusquedaRefinada() {
  $('#refinar-resultados').click(function () {
    refinarBusqueda();
  });

  //console.log("Cargando el suggester de la busqueda refinada");

  $('#refinar-busqueda-inputfocus-autocomplete').hide();

  // Dispara el suggester ante el cambio del input
  $('#refinar-busqueda-texto-ingresado').change(
    $(function () {
      $('#refinar-busqueda-texto-ingresado').keyup(function (event) {
        if (event.keyCode == 27) {
          $('#refinar-busqueda-inputfocus-autocomplete').hide();
        } else if (event.keyCode == 'Up') {
          selectUpSuggestion();
        } else if (event.keyCode == 'Down') {
          selectDownSuggestion();
        } else {
          buscarSuggest(
            $('#refinar-busqueda-texto-ingresado').val(),
            'busqueda-global',
            20,
            $('#refinar-busqueda-inputfocus-autocomplete'),
          );
        }
      });
    }),
  );
}
