const mapboxgl = require('mapbox-gl');
const choo = require('choo')
const html = require('choo/html')

mapboxgl.accessToken = 'pk.eyJ1IjoidG1jdyIsImEiOiJIZmRUQjRBIn0.lRARalfaGHnPdRcc-7QZYQ';

var empty = {
  "version": 8,
  "name": "Empty",
  "metadata": {
    "mapbox:autocomposite": true
  },
  "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    "sources": {
        osm: {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        }
    },
  "layers": [
    {
      "id": "osm",
      "source": "osm",
      "type": "line",
      "paint": {
      }
    },
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "rgba(0,0,0,0)"
      }
    }
  ]
};
// var all = context.intersects(map.extent()) 

function startApp(context, node) {
    const app = choo();

    function featuresToGeoJSON(entities) {
        var features = [];
        for (var id in entities) {
            if (id[0] === 'n' && context.graph().parentWays(entities[id]).length) continue;
            try {
                var gj = entities[id].asGeoJSON(context.graph());
                if (gj.type === 'FeatureCollection') continue;
                features.push({
                    type: 'Feature',
                    properties: {},
                    geometry: gj
                });
            } catch(e) {
                console.error(e);
            }
        }
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    app.model({
      state: {
          active: false,
          map: undefined,
          features: []
      },
      subscriptions: [
          (send, done) => {
              context.on('change.idupwards', function(e) {
                  send('geojson', {
                      geojson: featuresToGeoJSON(context.graph().base().entities)
                  }, () => {
                      done()
                  });
              });
          },
          (send, done) => {
              context.history().on('change.idupwards', function(e) {
                  send('geojson', { geojson: featuresToGeoJSON(context.graph().base().entities) }, () => {
                      done()
                  });
              });
          }
      ],
      reducers: {
        toggle: (data, state) => ({ active: !state.active }),
        geojson: (data, state) => ({ geojson: data.geojson }),
        map: (data, state) => ({ map: data.map })
      }
    });

    const mainView = (state, prev, send) => {

        function drawMap(elem) {
            setTimeout(function() {
        if (state.active) {
        var map;
        if (state.map) {
          map = state.map;
              map.getSource('osm').setData(state.geojson);
        } else {
          map = new mapboxgl.Map({
              container: 'id-upwards-map',
              style: empty
          });
          map.on('load', function() {
              map.getSource('osm').setData(state.geojson);
          });
          send('map', { map: map });
        }
        }
            }, 10);
        }

        return html`
          <div class='map-control'>
            <button tabindex='-1' style='color:white' onclick=${(e) => send('toggle')}>
              3D
            </button>
            ${state.active ? html`
            <div class='help-wrap map-overlay fillL col5 content'>
              <div onload=${drawMap} style='height:500px;' id='id-upwards-map'></div>
            </div>` : ``}
          </div>
        `;
    };

    app.router((route) => [
      route('/', mainView)
    ]);

    const tree = app.start();
    node.appendChild(tree);
}

id.ui().pluginRegisterControl({
    handler: function(context) {
        return function(selection) {
            startApp(context, selection.node());
        };
    },
    buttonClass: 'hi'
});
