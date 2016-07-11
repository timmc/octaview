var app = {
  descriptors: null,
  descriptorsUrl: '/descriptors.json'
};

function collectElements() {
  var elems = [];
  // Mark node IDs as seen or not seen (but at least referenced) so we can
  // fill in missing node IDs at the end.
  var seenNodes = {};

  $.each(app.descriptors.services, function(_i, svc) {
    elems.push({
      group: "nodes",
      data: {id: svc.id}
    });
    seenNodes[svc.id] = true;

    $.each(svc.dependencies, function(_j, dep) {
      elems.push({
        group: "edges",
        data: {
          source: svc.id,
          target: dep.on
        }
      });
      seenNodes[dep.on] = seenNodes[dep.on] || false;
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

function init() {
  $.get(app.descriptorsUrl, function recvinit(data, _status, _xhr) {
    app.descriptors = data;
    cytoscape({
      container: document.getElementById('cytoscape-container'),
      elements: collectElements(),
      style: [
        {selector: 'node', style:{content:'data(id)'}}
      ]
    });
  });
}

$(init);
