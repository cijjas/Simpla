/*!
 * Este objeto representa los datos para realizar una sentencia de busqueda. Puede generarse a partir
 * del location de la ventana actual y puede construir una url.
 * Los datos de una busqueda son (entre [] se encuentra la identificacion usada en la url):
 *     [q] query: una sentencia de texto que luego es adaptada para convertirse en una sentencia de busqueda.
 *     [r] rawQuery: una sentencia de busquda que pasa directo
 *     [o] offset: posicion del primer documento a recuperar
 *     [p] pageSize: cantidad de resultados por pagina
 *     [f] facets: facetas para filtrar y sumarizar
 *     [s] sortBy: criterio de ordenamiento
 *     [v] viewType: tipo de vista
 *
 * Crear una instancia var queryObject = new QueryObject();
 * Procesar la query de entrada queryObject.parseQuery();
 * Para cambiar un valor de query, rawQuery, offset o pageSize,
 * acceder directamente a la propiedad queryObject.query = 'blah'
 * Para agregar o cambiar una faceta queryObject.putFacet('Fecha/2012', 10, 1)
 * agrega la faceta Fecha con drill down en anio 2012 hasta 10 elementos y un nivel de profundidad.
 * Para obtener el string para generar una url queryObject.buildQuery()
 */

function QueryObject() {
  var self = this;

  function getUrlParams() {
    var args = {};
    var pathName = $(location).attr('pathname');
    var url = $(location).attr('pathname');

    if (pathName == '/buscador-avanzado') {
      url = $(location).attr('search');
    } else {
      if (pathName != '/busqueda') {
        var urlSearch = $(location).attr('search');
        if (urlSearch.indexOf('f=Total') == -1) {
          var aux = lookQueryFor(pathName);
          if (aux) {
            url = aux;
          }
        } else {
          url = $(location).attr('search');
        }
      }
    }

    if (pathName == '/resultados.jsp') {
      url = $(location).attr('search');
      if (url.indexOf('b=avanzada') != -1) {
        url = decodeURIComponent($(location).attr('search'));
      }
    }

    $.each(url.replace('?', '').split('&'), function (index, pair) {
      pair = pair.split('=');
      args[pair[0]] = pair[1] ? unescape(pair[1]) : true;
    });

    return args;
  }

  this.pathNamesFunctions = {
    '/buscador/constituciones': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Ley/Constitución');
      aux.putFacet('Estado de Vigencia/Vigente, de alcance general');
      aux.sortBy = '';
    },
    '/tratados-internacionales': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Ley/Tratado');
      aux.putFacet(
        'Tema/Derecho internacional/derecho internacional público/derecho de los tratados/tratados internacionales[2,1]',
      );
    },
    '/buscador/codigos': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Ley/Código');
      aux.putFacet('Estado de Vigencia/Vigente, de alcance general');
      aux.sortBy = '';
    },
    '/buscador/leyes-nacionales-vigentes': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Ley');
      aux.putFacet('Jurisdicción/Nacional');
      aux.putFacet('Estado de Vigencia/Vigente, de alcance general');
    },
    '/buscador/leyes-provinciales-vigentes': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Ley');
      aux.putFacet('Jurisdicción/Local');
      aux.putFacet('Estado de Vigencia/Vigente, de alcance general');
    },
    '/buscador/nuevas-leyes-sancionadas': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Ley');
      //Ver el tema ultimos 6 meses
      aux.rawQuery = formatRango(); //'fecha-rango:[' + dateTo + ' TO ' + dateFrom +']';
    },
    '/buscador/leyes-vetadas': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Ley');
      aux.putFacet('Jurisdicción/Nacional');
      aux.putFacet('Estado de Vigencia/Vetada');
    },

    '/buscador/decretos-nacionales-vigentes': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Decreto');
      aux.putFacet('Jurisdicción/Nacional');
      aux.putFacet('Estado de Vigencia/Vigente, de alcance general');
    },
    '/buscador/normas-internacionales': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Ley');
      aux.putFacet('Jurisdicción/Internacional');
      aux.putFacet('Estado de Vigencia/Vigente, de alcance general');
    },
    '/buscador/decretos-reglamentarios': function (aux) {
      //aux.putFacet('Tema/Derecho administrativo/acto administrativo/acto administrativo de alcance general/reglamentos/decreto reglamentario[2,1]');
      aux.putFacet('Tipo de Documento/Legislación/Decreto');
    },
    '/buscador/dnu': function (aux) {
      aux.putFacet('Tipo de Documento/Legislación/Decreto');
      aux.putFacet('Jurisdicción/Nacional');
      aux.rawQuery = 'tema:decreto?de?necesidad?y?urgencia';
    },
    '/buscador/resoluciones-afip': function (aux) {
      aux.putFacet('Organismo/AFIP');
    },
    '/buscador/resoluciones-igj': function (aux) {
      aux.putFacet('Organismo/IGJ');
    },
    //				'/buscador/resoluciones-oa': function(aux){
    //					aux.putFacet('Tipo de Documento/Legislación/Resolución');
    //					aux.putFacet('Organismo/OA');
    //				},
    '/buscador/resoluciones-aabe': function (aux) {
      aux.putFacet('Organismo/AABE');
    },
    '/buscador/normativa-comunitaria': function (aux) {
      //aux.putFacet('Tipo de Documento/Legislación/Resolución/Resolución Mercosur');
      aux.putFacet('Tipo de Documento/Legislación');
      aux.rawQuery = '(organismo:CMC) OR (organismo:GMC)';
    },
    '/buscador/jurisprudencia-corte-suprema': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tribunal/CORTE SUPREMA DE JUSTICIA DE LA NACION');
    },
    '/buscador/jurisprudencia-tribunal-etica': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tribunal/TRIBUNAL DE CONDUCTA');
    },
    '/buscador/jurisprudencia-nacional': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Jurisdicción/Nacional');
    },
    '/buscador/jurisprudencia-federal': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Jurisdicción/Federal');
    },
    '/buscador/jurisprudencia-provincial': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Jurisdicción/Local');
    },
    '/buscador/jurisprudencia-internacional': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Jurisdicción/Internacional');
    },
    '/buscador/jurisprudencia-derecho-constitucional': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tema/Derecho constitucional[3,1]');
    },
    '/buscador/jurisprudencia-derecho-civil': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tema/Derecho civil[3,1]');
    },
    '/buscador/jurisprudencia-derecho-laboral': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tema/Derecho laboral[3,1]');
    },
    '/buscador/jurisprudencia-derecho-penal': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tema/Derecho penal[3,1]');
    },
    '/buscador/jurisprudencia-derecho-comercial': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tema/Derecho comercial[3,1]');
    },
    '/buscador/jurisprudencia-derecho-administrativo': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tema/Derecho administrativo[3,1]');
    },
    '/buscador/jurisprudencia-derecho-procesal': function (aux) {
      aux.putFacet('Tipo de Documento/Jurisprudencia');
      aux.putFacet('Tema/Derecho procesal[3,1]');
    },
    '/buscador/dictamenes-inadi': function (aux) {
      aux.putFacet('Tipo de Documento/Dictamen/INADI');
    },
    '/buscador/dictamenes-mpf': function (aux) {
      aux.putFacet('Tipo de Documento/Dictamen/Ministerio Público Fiscal');
    },
    '/buscador/dictamenes': function (aux) {
      aux.putFacet('Tipo de Documento/Dictamen/PTN');
    },
    //				'/buscador/dictamenes-oa': function(aux){
    //					aux.putFacet('Tipo de Documento/Dictamen/OA');
    //				},
    '/buscador/dictamenes-aaip': function (aux) {
      aux.putFacet('Tipo de Documento/Dictamen/AAIP');
    },
    '/biblioteca-digital': function (aux) {
      //BIBLIOTECA
      aux.putFacet('Publicación/Biblioteca digital');
    },
    '/biblioteca-digital/catalogo': function (aux) {
      var search = $(location).attr('search');
      if (search.indexOf('coleccion') != -1) {
        var n = search.indexOf('?coleccion=');
        var sub = search.substring(n + 11, search.length);

        aux.putFacet('Colección temática/' + decodeURIComponent(sub));
      }
      aux.putFacet('Publicación/Biblioteca Digital');
    },

    '/biblioteca-digital/colecciones/patrimonio-historico': function (aux) {
      aux.putFacet('Colección temática/Patrimonio histórico');
      aux.putFacet('Publicación/Biblioteca Digital');
    },
    '/biblioteca-digital/colecciones/antecedentes-derecho-argentino': function (
      aux,
    ) {
      aux.putFacet('Colección temática/Antecedentes del derecho argentino');
      aux.putFacet('Publicación/Biblioteca Digital');
    },
    '/biblioteca-digital/colecciones/cuestiones-derecho-internacional':
      function (aux) {
        aux.putFacet('Colección temática/Cuestiones de Derecho Internacional');
        aux.putFacet('Publicación/Biblioteca Digital');
      },

    '/buscador/doctrina-derecho-administrativo': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho administrativo[3,1]');
    },

    '/buscador/doctrina-derecho-civil': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho civil[3,1]');
    },
    '/buscador/doctrina-derecho-comercial': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho comercial[3,1]');
    },
    '/buscador/doctrina-derecho-constitucional': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho constitucional[3,1]');
    },
    '/buscador/doctrina-derecho-familia': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho civil/relaciones de familia[2,1]');
    },
    '/buscador/doctrina-derecho-internacional': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho internacional[3,1]');
    },
    '/buscador/doctrina-derecho-laboral': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho laboral[3,1]');
    },
    '/buscador/doctrina-derecho-penal': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho penal[3,1]');
    },
    '/buscador/doctrina-derecho-procesal': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho procesal[3,1]');
    },
    '/buscador/doctrina-seguridad-social': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Seguridad social[3,1]');
    },
    '/buscador/doctrina-derecho-tributario-y-aduanero': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.putFacet('Tema/Derecho tributario y aduanero[3,1]');
    },
    '/buscador/ultima-doctrina-ingresada': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.rawQuery = formatRango();
    },
    '/buscador/novedades': function (aux) {
      aux.putFacet('Publicación/Novedad');
    },
    '/buscador/ediciones-libros': function (aux) {
      aux.putFacet('Publicación/Ediciones SAIJ/Libro');
    },
    '/buscador/doctrinas-especiales': function (aux) {
      aux.putFacet('Tipo de Documento/Doctrina');
      aux.rawQuery = 'tema:código?civil?y?comercial';
    },
  };

  function lookQueryFor(pathName) {
    if (self.pathNamesFunctions[pathName]) {
      var aux = new QueryObject().makeDefault();
      // Ordenamiento por fecha para todas las busquedas de la TOC Infojus
      aux.sortBy = 'fecha-rango|DESC';
      self.pathNamesFunctions[pathName](aux);
      var query = aux.buildQuery();
      query = query.substring(query.indexOf('?') + 1);
      return query;
    } else {
      return null;
    }

    return pathNamesMap[pathName];
  }

  function extractFacets(urlParams) {
    var facets = {};
    $.each(
      urlParams.f ? urlParams.f.split('|') : [],
      function (index, facetTxt) {
        var parts = facetTxt.split('[');
        var categories = parts[0].split('/');
        var offsetTxt = parts[1]
          ? parts[1].substring(0, parts[1].length - 1).split(',')
          : '';
        facets[categories[0]] = {
          root: categories[0],
          categories: categories,
          siblings: offsetTxt ? offsetTxt[0] : undefined,
          depth: offsetTxt ? offsetTxt[1] : undefined,
        };
      },
    );
    return facets;
  }

  this.facets = {};
  this.offset = 0;
  this.pageSize = 25;

  this.parseQuery = function () {
    var urlParams = getUrlParams();

    if (urlParams.q !== undefined) this.query = urlParams.q;
    if (urlParams.r !== undefined) this.rawQuery = urlParams.r;
    if (urlParams.o !== undefined) this.offset = urlParams.o * 1;
    if (urlParams.p !== undefined) this.pageSize = urlParams.p * 1;
    if (urlParams.f !== undefined) this.facets = extractFacets(urlParams);
    if (urlParams.s !== undefined) this.sortBy = urlParams.s;
    if (urlParams.v !== undefined) this.viewType = urlParams.v;

    return this;
  };

  this.setQuery = function (query) {
    this.query = query;
    return this;
  };

  this.setRawQuery = function (rawQuery) {
    this.rawQuery = rawQuery;
    return this;
  };

  this.setOffset = function (offset) {
    this.offset = offset;
    return this;
  };

  this.setPageSize = function (pageSize) {
    this.pageSize = pageSize;
    return this;
  };

  this.setFacets = function (facets) {
    this.facets = facets;
    return this;
  };

  this.setSortBy = function (sortBy) {
    this.sortBy = sortBy;
    return this;
  };

  this.setViewType = function (viewType) {
    this.viewType = viewType;
    return this;
  };

  this.clone = function () {
    var clone = new QueryObject();
    clone.query = this.query;
    clone.rawQuery = this.rawQuery;
    clone.offset = this.offset;
    clone.pageSize = this.pageSize;
    clone.facets = {};
    for (var key in this.facets) {
      var facet = this.facets[key];
      var facetClone = {};
      for (var prop in facet) facetClone[prop] = facet[prop];
      clone.facets[key] = facetClone;
    }
    clone.sortBy = this.sortBy;
    clone.viewType = this.viewType;
    return clone;
  };

  this.facetsAsParam = function () {
    var queryFacets = '';
    for (var key in this.facets) {
      var facet = this.facets[key];
      queryFacets +=
        '|' +
        facet.categories.join('/') +
        (facet.siblings ? '[' + facet.siblings + ',' + facet.depth + ']' : '');
    }
    queryFacets = queryFacets ? queryFacets.substring(1) : '';
    return queryFacets;
  };

  this.buildQuery = function () {
    var queryFacets = '';
    for (var key in this.facets) {
      var facet = this.facets[key];
      queryFacets +=
        '|' +
        facet.categories.join('/') +
        (facet.siblings ? '[' + facet.siblings + ',' + facet.depth + ']' : '');
    }
    queryFacets = queryFacets ? queryFacets.substring(1) : '';
    if ($(location).attr('pathname') == '/biblioteca-digital/catalogo') {
      var queryUrl =
        '/biblioteca-digital/catalogo?' +
        (
          (this.query ? '&q=' + escape(this.query) : '') +
          (this.rawQuery ? '&r=' + escape(this.rawQuery) : '') +
          '&o=' +
          this.offset +
          '&p=' +
          this.pageSize +
          (queryFacets ? '&f=' + escape(queryFacets) : '') +
          (this.sortBy ? '&s=' + this.sortBy : '') +
          (this.viewType ? '&v=' + this.viewType : '')
        ).substring(1);
    } else {
      var queryUrl =
        '/resultados.jsp?' +
        (
          (this.query ? '&q=' + escape(this.query) : '') +
          (this.rawQuery ? '&r=' + escape(this.rawQuery) : '') +
          '&o=' +
          this.offset +
          '&p=' +
          this.pageSize +
          (queryFacets ? '&f=' + escape(queryFacets) : '') +
          (this.sortBy ? '&s=' + this.sortBy : '') +
          (this.viewType ? '&v=' + this.viewType : '')
        ).substring(1);
    }
    return queryUrl;
  };

  this.buildRefinarQuery = function () {
    var queryFacets = '';
    for (var key in this.facets) {
      var facet = this.facets[key];
      queryFacets +=
        '|' +
        facet.categories.join('/') +
        (facet.siblings ? '[' + facet.siblings + ',' + facet.depth + ']' : '');
    }
    queryFacets = queryFacets ? queryFacets.substring(1) : '';

    var queryUrl =
      '/resultados.jsp?' +
      (
        (this.query ? '&q=' + escape(this.query) : '') +
        (this.rawQuery ? '&r=' + escape(this.rawQuery) : '') +
        '&o=' +
        0 +
        '&p=' +
        this.pageSize +
        (queryFacets ? '&f=' + escape(queryFacets) : '') +
        (this.sortBy ? '&s=' + this.sortBy : '') +
        (this.viewType ? '&v=' + this.viewType : '')
      ).substring(1);

    return queryUrl;
  };

  this.buildBasicQuery = function () {
    var queryFacets = '';
    for (var key in this.facets) {
      var facet = this.facets[key];
      queryFacets +=
        '|' +
        facet.categories.join('/') +
        (facet.siblings ? '[' + facet.siblings + ',' + facet.depth + ']' : '');
    }
    queryFacets = queryFacets ? queryFacets.substring(1) : '';

    var queryUrl =
      '/resultados.jsp?' +
      (
        (this.query ? '&q=' + escape(this.query) : '') +
        (this.rawQuery ? '&r=' + escape(this.rawQuery) : '') +
        '&o=' +
        this.offset +
        '&p=' +
        this.pageSize +
        (queryFacets ? '&f=' + escape(queryFacets) : '') +
        (this.sortBy ? '&s=' + this.sortBy : '') +
        (this.viewType ? '&v=' + this.viewType : '')
      ).substring(1);

    return queryUrl;
  };

  this.putFacet = function (categoryPath, siblings, depth) {
    var categories = categoryPath.split('/');
    var name = categories[0];
    if (siblings === undefined) {
      siblins = 5;
      depth = 1;
    }
    this.facets[name] = {
      root: name,
      categories: categories,
      siblings: siblings ? siblings : undefined,
      depth: depth ? depth : undefined,
    };
    return this;
  };

  this.trimFacet = function (category, size) {
    this.facets[category].categories = this.facets[category].categories.slice(
      0,
      size,
    );
    return this;
  };

  function parseoExtraccion(url) {
    var args = {};
    $.each(url.replace('?', '').split('&'), function (index, pair) {
      pair = pair.split('=');
      args[pair[0]] = pair[1] ? unescape(pair[1]) : true;
    });

    return extractFacets(args);
  }

  this.makeFacetas = function (url) {
    this.facets = parseoExtraccion(url);
    this.offset = 0;
    this.pageSize = 25;
    this.sortBy = '';
    this.viewType = 'colapsada';
    return this;
  };

  this.makeDefault = function () {
    this.putFacet('Total')
      .putFacet('Fecha')
      .putFacet('Estado de Vigencia', 5, 1)
      .putFacet('Tema', 5, 1)
      .putFacet('Organismo', 5, 1)
      .putFacet('Autor', 5, 1)
      .putFacet('Jurisdicción', 5, 1)
      .putFacet('Organismo', 5, 1)
      .putFacet('Tribunal', 5, 1)
      .putFacet('Publicación', 5, 1)
      .putFacet('Colección temática', 5, 1)
      .putFacet('Tipo de Documento');
    this.offset = 0;
    this.pageSize = 25;
    this.sortBy = '';
    this.viewType = 'colapsada';
    return this;
  };

  this.makeRawQuery = function () {
    this.putFacet('Total');
    this.offset = 0;
    this.pageSize = 500;
    return this;
  };

  this.getDataForAjax = function () {
    var data = {};

    if (this.query !== undefined) data.q = this.query;
    if (this.rawQuery !== undefined) data.r = this.rawQuery;
    if (this.offset !== undefined) data.o = this.offset;
    if (this.pageSize !== undefined) data.p = this.pageSize;
    if (this.facets !== undefined) data.f = this.facetsAsParam();
    if (this.sortBy !== undefined) data.s = this.sortBy;
    if (this.viewType !== undefined) data.v = this.viewType;

    return data;
  };

  this.hasFacet = function (facetPath) {
    for (var key in this.facets) {
      if (this.facets[key].categories.join('/').indexOf(facetPath) == 0) {
        return true;
      }
    }
    return false;
  };

  this.doQuery = function () {
    var result = {};
    $.ajax({
      async: false,
      data: self.getDataForAjax(),
      url: '/busqueda',
      success: function (data) {
        result = data;
      },
      error: function (jqXHR, textStatus, errorThrown) {
        throw {
          jqXHR: jqXHR,
          textStatus: textStatus,
          errorThrows: errorThrown,
        };
      },
    });

    return result;
  };
}
