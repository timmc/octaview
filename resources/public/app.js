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
      explore: {}
    }
  }
};

/**
 * Modal interaction specs, by id:
 * - name: Short name of mode
 * - desc: One-line description of mode
 * - onGraphLayout: Setup function that is called when a new graph is loaded,
 *   or null
 * - onEnter: Function that is called when mode is entered, or null
 * - onExit: Function that is called when mode is exited, or null
 */
var modeInfo = {
  explore: {
    name: 'Explore',
    desc: 'Inspect individual services by clicking on them',
    onGraphLayout: function() {
      app.cy.on('tap', 'node', function(evt) {
        if (app.mode.selected !== 'explore') return;
        showServiceInfo(evt.cyTarget.id());
      })
    },
    onEnter: null,
    onExit: null
  }
}

/**
 * Respond to a user's request for a mode-switch.
 */
function performModeSwitch(fromModeId, toModeId) {
  if (fromModeId) {
    (modeInfo[fromModeId].onExit || $.noop)();
  }
  app.mode.selected = toModeId;
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
  var svc = app.services[sid];
  if (!svc) return;

  var $info = $('#service-info')
  $info.empty()

  $('<h2>').text(svc.name)
  .appendTo($info)

  $('<p>').addClass('desc').text(svc.desc || '(no description)')
  .appendTo($info)

  $('<p>').addClass('team').text('Team: ' + (svc.team || '(unknown)'))
  .appendTo($info)

  var $links = $('<ul>')
  $.each(svc.links, function linkit(_i, link) {
    $('<a>').attr('href', link.url).text(linkName(link))
    .wrap('<li>').parent().addClass('ltype-'+link.type)
    .appendTo($links)
  })
  $links.appendTo($info)

  $('#controls-tip').addClass('hidden')
  $info.removeClass('hidden')
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
      app.services = {}
      $.each(data.services, function(index, svc) {
        var sid = svc.id
        if(typeof sid != 'string') {
          console.error("Invalid service id at position " + index + ":", sid)
          return
        }
        if(app.services[sid]) {
          console.error("Duplicate service id:", sid)
          return
        }
        app.services[sid] = svc
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
        content:'data(id)'
      }
    }]
  });
}

/**
 * Initialize application -- call only once.
 */
function init() {
  initCytoscape();
  refreshData();
  performModeSwitch(null, 'explore');
}

$(init);
