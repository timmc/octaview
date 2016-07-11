var app = {
  descriptors: null,
  descriptorsUrl: '/descriptors.json'
};

function collectElements() {
  var elems = [];
  // Mark node IDs as seen or not seen (but at least referenced) so we can
  // fill in missing node IDs at the end.
  var seenNodes = {};

  $.each(app.descriptors.services, function(index, svc) {
    var sid = svc.id;
    if(typeof sid != 'string') {
      console.error("Invalid service id at position " + index + ":", sid);
      return;
    }
    if(seenNodes[sid]) {
      console.error("Duplicate service id:", sid);
      return;
    }
    elems.push({
      group: "nodes",
      data: {id: sid}
    });
    seenNodes[sid] = true;

    $.each(svc.dependencies, function(_j, dep) {
      var tid = dep.on;
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

function setupCytoscape() {
  app.cy = cytoscape({
    container: document.getElementById('cytoscape-container'),
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

function init() {
  setupCytoscape();
  $.ajax({
    method: 'get',
    url: app.descriptorsUrl,
    dataType: 'json',
    success: function recvinit(data, _status, _xhr) {
      app.descriptors = data;
      app.cy.add(collectElements()).layout({name: 'breadthfirst'});
    },
    error: function recvfail(_xhr, textStatus, errorThrown) {
      console.error(textStatus, errorThrown + "");
    }
  });
}

$(init);
