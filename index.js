const mapboxgl = require('mapbox-gl');
const React = require('react')
const ReactDOM = require('react-dom')

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
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#fff"
      }
    },
    {
      "id": "osm-circle",
      "source": "osm",
      "type": "circle",
      "paint": {
          'circle-color': '#000',
          'circle-radius': 2
      }
    },
    {
      "id": "osm-line",
      "source": "osm",
      "type": "line",
      "paint": {
          'line-color': '#000',
          'line-width': 2
      }
    },
    {
      "id": "osm-fill",
      "source": "osm",
      "type": "fill",
      "paint": {
          'fill-color': '#f0f'
      }
    }
  ]
};
// var all = context.intersects(map.extent()) 


    var App = React.createClass({
        featuresToGeoJSON(entities) {
            var context = this.props.context;
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
        },
        getInitialState() {
            return  {
                active: false,
                map: undefined,
                features: []
            };
        },
        componentDidMount: function() {
            this.props.context.on('change.idupwards', (e) => {
                this.setState({ geojson: this.featuresToGeoJSON(this.props.context.graph().base().entities) });
            });
            this.props.context.history().on('change.idupwards', (e) => {
                this.setState({ geojson: this.featuresToGeoJSON(this.props.context.graph().base().entities) });
            });
        },
        componentDidUpdate() {
            var state = this.state;
            if (this.state.active && this.state.geojson && this.mapElement) {
                if (this.map && this.map.getSource('osm')) {
                    this.map.getSource('osm').setData(this.state.geojson);
                } else {
                    this.map = new mapboxgl.Map({
                        container: this.mapElement,
                        style: empty,
                    });
                    this.map.fitBounds([
                        this.props.context.map().extent()[0],
                        this.props.context.map().extent()[1]
                    ]);
                    console.log(this.state.geojson);
                    this.map.on('load', () => {
                        this.map.getSource('osm').setData(this.state.geojson);
                    });
                }
            }
        },
        toggle: function() {
            this.setState({
                active: !this.state.active
            });
        },
        render: function () {
            var state = this.state;
            return <div className='map-control'>
                <button tabIndex='-1' style={{color:'white'}} onClick={this.toggle}>
                    3D
                </button>
                {state.active ?
                    <div className='help-wrap map-overlay fillL col5 content'>
                        <div style={{height:500}} ref={elem => { this.mapElement = elem }}></div>
                    </div> : null}
                </div>;
        }
    });

id.ui().pluginRegisterControl({
    handler: function(context) {
        return function(selection) {
            ReactDOM.render(<App context={context} />, selection.node());
        };
    },
    buttonClass: 'hi'
});
