(function(){

/**
 * Application state data.
 */
var app = {
  // Map of service IDs to service maps
  services: {},
  // Interaction modes
  mode: {
    // Current mode ID, never null (even/especially at init)
    selected: 'explore',
    // State for each mode
    state: {
      explore: {
        focal: null
      },
      paths: {
        focal: null,
        other: null
      }
    }
  }
};

/**
 * Respond to a user's request for a mode-switch.
 */
function performModeSwitch(fromModeId, toModeId) {
  if (fromModeId) {
    (modeInfo[fromModeId].onExit || $.noop)();
  }
  app.mode.selected = toModeId;
  $('#mode-tip').text(modeInfo[toModeId].desc);
  (modeInfo[toModeId].onEnter || $.noop)();
}

/**
 * Default names for service links when no name is specified.
 */
var defaultLinkNames = {
  'doc': 'Documentation',
  'source': 'Source code',
  'monitor': 'Monitoring/metrics'
}

/**
 * Given a link map, produce the best name available (fall back to defaults.)
 */
function linkName(link) {
  return link.name || defaultLinkNames[link.type] || '[some sort of information]';
}

/**
 * Show a service's info in the sidebar, given a service ID.
 */
function showServiceInfo(sid) {
  var svc = app.services[sid] || {};

  var $info = $('#service-info');
  $info.empty();

  $('<h2>').text(svc.name || sid)
  .appendTo($info);

  $('<p>').addClass('desc').text(svc.desc || '(no description)')
  .appendTo($info);

  var $links = $('<ul>');
  $.each(svc.links, function(_i, link) {
    $('<a>').attr('href', link.url).text(linkName(link))
    .wrap('<li>').parent().addClass('ltype-'+link.type)
    .appendTo($links)
  });
  $links.appendTo($info);

  var $attrs = $('<dl>');
  $.each(svc.attrs, function(key, value) {
    if (typeof value === 'string' && value !== '') {
      $('<dt>').text(key).appendTo($attrs);
      $('<dd>').text(value).appendTo($attrs);
    }
  });
  $attrs.appendTo($info);

  $info.removeClass('hidden');
}

/**
 * Hide service info panel.
 */
function hideServiceInfo() {
  $('#service-info').addClass('hidden');
}

/**
 * Redisplay the UI from explore mode state.
 */
function explore_redisplay(state) {
  app.cy.$('node').removeClass('explore-focal');
  if (state.focal) {
    app.cy.$('#'+state.focal).addClass('explore-focal');
    showServiceInfo(state.focal);
  } else {
    hideServiceInfo();
  }
}

/**
 * Redisplay the UI from paths mode state.
 */
function paths_redisplay(state) {
  app.cy.$('node').removeClass('paths-focal');
  app.cy.$('node').removeClass('paths-other');
  app.cy.$('*').removeClass('paths-between');
  if (state.focal) {
    app.cy.$('#' + state.focal).addClass('paths-focal');
    if (state.other) {
      app.cy.$('#' + state.other).addClass('paths-other');
      app.cy.$('*').dijkstra({root:'#'+state.focal, directed: true})
      .pathTo('#'+state.other).addClass('paths-between');
    }
  }
}

/**
 * React when user clicks on a service in paths mode.
 */
function paths_onTap(sid) {
  var state = app.mode.state.paths;
  if (sid === state.focal) { // unfocus all
    state.focal = null;
    state.other = null;
  } else if (sid == state.other) { // unfocus "other" node
    // Assume we have a focal
    state.other = null;
  } else { // An uninvolved node!
    if (state.focal) { // switch to new "other"
      state.other = sid;
    } else {
      state.focal = sid;
      state.other = null; // init, just in case
    }
  }
  paths_redisplay(state);
}

/**
 * Modal interaction specs, by id:
 * - name: Short name of mode
 * - desc: One-line description of mode
 * - onGraphLayout: Setup function that is called when a new graph is loaded,
 *   or null
 * - onEnter: Function that is called when mode is entered, or null
 * - onExit: Function that is called when mode is exited, or null
 *
 * Awkwardly, all modes are always listening to various events, so their
 * listeners have to have guard clauses switched on the current mode id.
 */
var modeInfo = {
  explore: {
    name: 'Explore',
    desc: 'Inspect individual services by clicking on them',
    onGraphLayout: function() {
      app.cy.on('tap', 'node', function(evt) {
        if (app.mode.selected !== 'explore') return;
        var state = app.mode.state.explore;
        state.focal = evt.cyTarget.id();
        explore_redisplay(state);
      })
    },
    onEnter: function() {
      explore_redisplay(app.mode.state.explore);
    },
    onExit: function() {
      explore_redisplay({});
    }
  },
  paths: {
    name: 'Pathfinder',
    desc: 'Discover *one* path between two services (click first on focal service, then successively on other services)',
    onGraphLayout: function() {
      app.cy.on('tap', 'node', function(evt) {
        if (app.mode.selected !== 'paths') return;
        paths_onTap(evt.cyTarget.id());
      });
    },
    // Restore UI from state
    onEnter: function() {
      paths_redisplay(app.mode.state.paths);
    },
    // Clear UI with default state
    onExit: function() {
      paths_redisplay({});
    }
  }
}

/**
 * Given the service map, produce a collection of Cytoscape elements to graph.
 */
function collectCytoElements(serviceMap) {
  var elems = [];
  // Mark node IDs as seen or not seen (but at least referenced) so we can
  // fill in missing node IDs at the end.
  var seenNodes = {};

  $.each(serviceMap, function(sid, svc) {
    elems.push({
      group: "nodes",
      data: {id: sid}
    });
    seenNodes[sid] = true;

    $.each(svc.dependencies, function(_j, dep) {
      var tid = dep.id;
      elems.push({
        group: "edges",
        data: {
          source: sid,
          target: tid
        }
      });
      seenNodes[tid] = seenNodes[tid] || false;
    });
  });

  // Fix up missing nodes and warn in console
  $.each(seenNodes, function(id, defined) {
    if (defined) return;
    console.warn("Service referenced but not defined:", id);
    elems.push({
      group: "nodes",
      data: {id: id},
      classes: 'missing-ref'
    });
  });
  return elems;
}

/**
 * Given an API name and the response data, print any errors to the console.
 */
function reportApiErrors(apiName, respData) {
  if (respData.errors.length > 0) {
    console.warn("Some errors when calling " + apiName + " api");
    $.each(respData.errors, function(_i, err){
      console.warn(err);
    });
  }
}

/**
 * Load new data and redisplay it.
 */
function refreshData() {
  $.ajax({
    method: 'get',
    url: 'api/services',
    dataType: 'json',
    success: function recvinit(data, _status, _xhr) {
      reportApiErrors("services", data);
      app.services = {};
      $.each(data.services, function(index, svc) {
        var sid = svc.id;
        if(typeof sid != 'string' || sid === '') {
          console.error("Invalid service id at position " + index + ":", sid);
          return;
        }
        if(app.services[sid]) {
          console.error("Duplicate service id:", sid);
          return;
        }
        app.services[sid] = svc;
      })
      app.cy.remove('*');
      app.cy.add(collectCytoElements(app.services)).layout({name: 'dagre'});
      $.each(modeInfo, function(modeId, modeInfo) {
        (modeInfo.onGraphLayout || $.noop)();
      });
    },
    error: function recvfail(_xhr, textStatus, errorThrown) {
      console.error(textStatus, errorThrown + "");
    }
  });
}

/**
 * Initialize cytoscape -- call only once.
 */
function initCytoscape() {
  app.cy = cytoscape({
    container: $('#cytoscape-container'),
    userZoomingEnabled: false, // too choppy, set params anyhow
    minZoom: 1/8,
    maxZoom: 2,
    style: [{
      selector: 'node',
      style: {
        content:'data(id)',
        'background-color': '#aaa'
      }
    }, {
      selector: 'node:selected',
      style: {
        'background-color': '#aaa' // don't show selection by default
      }
    }, {
      selector: 'edge',
      style: {
        'line-color': '#aaa',
        'curve-style': 'bezier',
        'target-arrow-color': '#aaa',
        'target-arrow-shape': 'triangle'
      }
    }, {
      selector: 'edge:selected',
      style: {
        'line-color': '#aaa', // don't show selection by default
        'target-arrow-color': '#aaa'
      }
    },
    // mode: explore
    {
      selector: 'node.explore-focal',
      style: {
        'background-color': 'blue'
      }
    },
    // mode: paths
    {
      selector: 'edge.paths-between',
      style: {
        'line-color': '#0dc',
        'target-arrow-color': '#0dc'
      }
    }, {
      selector: 'node.paths-between',
      style: {'background-color': '#0dc'}
    }, {
      selector: 'node.paths-focal',
      style: {
        'background-color': 'blue'
      }
    }, {
      selector: 'node.paths-other',
      style: {
        'background-color': 'green'
      }
    }]
  });
}

function initModeSelector() {
  var $modeSel = $('#mode-selector');
  $.each(modeInfo, function(id, info) {
    var $radio = $('<input>')
    .attr({type: 'radio',
           name: 'mode',
           checked: id === app.mode.selected})
    .change(function(e) {
      performModeSwitch(app.mode.selected, id);
      $(e.target).blur();
    });

    var $label = $('<label>')
    .addClass('mode')
    .attr('title', info.desc)
    .append($radio)
    .append(document.createTextNode(info.name));

    $modeSel.append($label);
  })
}

/**
 * Initialize application -- call only once.
 */
function init() {
  initModeSelector();
  initCytoscape();
  refreshData();
  performModeSwitch(null, 'explore');
}

// Attach API references for debugging
app.dbgfns = {};
$.each(
  [performModeSwitch, linkName, showServiceInfo, hideServiceInfo,
   explore_redisplay, paths_redisplay, collectCytoElements, reportApiErrors,
   refreshData, initCytoscape, initModeSelector, init],
  function attach(_i, f) {
    app.dbgfns[f.name] = f;
  }
);
window.octaview = app;

$(init);

})();
