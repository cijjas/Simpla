function buscarSuggest(key, suggesterName, amount, container) {
  $.ajax({
    url: '/suggest',
    data: {
      key: key,
      suggesterName: suggesterName,
      amount: amount,
    },
    success: function (json) {
      showSuggestions(container, json);
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('Error llamando al servicio de sugerencias: ' + textStatus);
    },
  });
}

function categorizeSuggestions(json) {
  var categorizedSuggestions = {};

  for (var i = 0; i < json.length; i++) {
    if (json[i].payload in categorizedSuggestions) {
      categorizedSuggestions[json[i].payload].push(json[i]);
    } else {
      categorizedSuggestions[json[i].payload] = [json[i]];
    }
  }

  return categorizedSuggestions;
}

function showSuggestions(container, json) {
  var categorizedSuggestions = categorizeSuggestions(json);
  var hasCategories = false;

  container.find('.cloned').remove();

  for (var category in categorizedSuggestions) {
    hasCategories = true;
    parseSuggetionsToHtml(
      container,
      categorizedSuggestions[category],
      category,
    );
  }

  if (hasCategories) {
    container.show();
    setSelected(
      $('.suggester-suggestions').find('li.reset.cloned'),
      'selected',
    );
  } else {
    container.hide();
  }
}
function setSelected(element, selectedClass) {
  $(element.get(0)).addClass(selectedClass);
  $(element.get(0)).click();
}
function detectFirstElement(element, prevSelector) {
  return element.prev(prevSelector).length > 0 ? false : true;
}
function setFocusClick(element) {
  element.focus();
  //	element.click();
}

function selectUpSuggestion(element, prevSelector, selectedClass) {
  var selector =
    prevSelector != null && prevSelector != ''
      ? prevSelector
      : 'li.reset.cloned';
  var cssClass =
    selectedClass != null && selectedClass != '' ? selectedClass : 'selected';
  var previous = element.prev(selector);
  if (previous.length > 0) {
    element.prev().siblings().removeClass(cssClass);
    element.prev().addClass(cssClass);
  } else {
    element.addClass(cssClass);
  }
}

function selectDownSuggestion(element, nextSelector, selectedClass) {
  var nextSelector =
    nextSelector != null && nextSelector != ''
      ? nextSelector
      : 'li.reset.cloned';
  var cssClass =
    selectedClass != null && selectedClass != '' ? selectedClass : 'selected';
  var next = element.next(nextSelector);
  if (next.length > 0) {
    element.prev().siblings().removeClass(cssClass);
    element.next().addClass(cssClass);
  } else {
    element.addClass(cssClass);
  }
}

function clearSearchBox(autoCompleteInput, input) {
  autoCompleteInput.hide();
  input.val('');
  setFocusClick(input);
}
function clickOut(container, element, exception) {
  if (
    typeof container != 'undefined' &&
    typeof element != 'undefined' &&
    typeof exception != 'undefined' &&
    !container.is(element.target) &&
    container.has(element.target).length == 0 &&
    !exception.is(element.target) &&
    !exception.has(element.target).length
  ) {
    container.hide();
  }
}

function onSuggestionPick(element) {
  $('#inputfocus').val(
    'busqueda avanzada: tema: ' +
      $(element)
        .text()
        .replace(/ /g, '?')
        .replace(/\)/g, '?')
        .replace(/\(/g, '?'),
  );
  $('#inputfocus-autocomplete').hide();
  $('#boton-buscar').trigger('click');
}

function onSuggestionPickTema(element) {
  $('#tema').val($(element).text());
  $('#tema-autocomplete').hide();
}

function onSuggestionPickLegislacion(element) {
  //$('#tema-legislacion').val('tema:' + $(element).text().replace(/ /g, '?').replace(/\)/g, '?').replace(/\(/g, '?'));
  $('#tema-legislacion').val($(element).text());
  $('#tema-legislacion-autocomplete').hide();
}

function onSuggestionPickAvanzadaDictamen(element) {
  $('#dictamen-tema').val($(element).text());
  $('#dictamen-tema-autocomplete').hide();
}

function onSuggestionPickAvanzadaLibrosRevistasAutor(element) {
  $('#lib-rev-autor').val($(element).text());
  $('#lib-rev-autor-autocomplete').hide();
}

function onSuggestionPickDoctrina(element) {
  $('#tema-doctrina').val($(element).text());
  $('#tema-doctrina-autocomplete').hide();
}

function onSuggestionPickAvanzadaLibrosRevistasTema(element) {
  $('#lib-rev-tema').val($(element).text());
  $('#lib-rev-tema-autocomplete').hide();
}

function onSuggestionPickAvanzadaDictamenPTN(element) {
  $('#dictamen-ptn-tema').val($(element).text());
  $('#dictamen-ptn-tema-autocomplete').hide();
}
function onSuggestionPickAvanzadaDictamenINADI(element) {
  $('#dictamen-inadi-tema').val($(element).text());
  $('#dictamen-inadi-tema-autocomplete').hide();
}
function onSuggestionPickAvanzadaDictamenMPF(element) {
  $('#dictamen-mpf-tema').val($(element).text());
  $('#dictamen-mpf-tema-autocomplete').hide();
}
function onSuggestionPickAvanzadaDictamenOA(element) {
  $('#dictamen-oa-tema').val($(element).text());
  $('#dictamen-oa-tema-autocomplete').hide();
}
function onSuggestionPickAvanzadaDictamenAAIP(element) {
  $('#dictamen-aaip-tema').val($(element).text());
  $('#dictamen-aaip-tema-autocomplete').hide();
}

function onSuggestionPickAvanzadaJurisSumario(element) {
  $('#tema-jurisprudencia-sumario').val($(element).text());
  $('#tema-jurisprudencia-sumario-autocomplete').hide();
}

function onSuggestionPickAvanzadaJurisFallo(element) {
  $('#tema-jurisprudencia-fallo').val($(element).text());
  $('#tema-jurisprudencia-fallo-autocomplete').hide();
}

function onSuggestionPickRefinarBusqueda(element) {
  var textoIngresado = $(element).text().replace(/ /g, '?');
  $('#refinar-busqueda-inputfocus-autocomplete').hide();
  if (queryObject.rawQuery) {
    console.log('Refinado sobre una query preexistente...');
    var preexistentQuery = queryObject.rawQuery;
    queryObject.setRawQuery(
      '(' + preexistentQuery + ')' + ' AND (tema:' + textoIngresado + ')',
    );
  } else {
    console.log('Refinando sin query preexistente...');
    queryObject.setRawQuery('tema:' + textoIngresado);
  }
  console.log('Query final: ' + queryObject.rawQuery);
  location.href = queryObject.buildRefinarQuery();
}

function parseSuggetionsToHtml(container, items, category) {
  var suggestions = container.find('.suggester-suggestions');

  container
    .find('.suggester-category-template')
    .clone()
    .removeClass('suggester-category-template')
    .addClass('cloned')
    .appendTo(suggestions)
    .show()
    .find('.topcategory')
    .html(category);

  for (var i = 0; i < items.length; i++) {
    container
      .find('.suggester-item-template')
      .clone()
      .removeClass('suggester-item-template')
      .addClass('cloned')
      .appendTo(suggestions)
      .show()
      .html(items[i].suggestion);
  }
}
