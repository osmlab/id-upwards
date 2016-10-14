const mapboxgl = require('mapbox-gl');
const React = require('react')
const ReactDOM = require('react-dom')

mapboxgl.accessToken = 'pk.eyJ1IjoidG1jdyIsImEiOiJIZmRUQjRBIn0.lRARalfaGHnPdRcc-7QZYQ';

var empty = {
  "version": 8,
  "name": "Empty",
  "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    "sources": {
        osm: {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        }
    },
  "layers": [
    {
        'id': 'background',
        'type': 'background',
        'layout': {},
        'paint': {
            'background-color': '#333'
        }
    },
    {
        'id': '3D Buildings',
        'type': 'fill',
        'source': 'osm',
        'layout': {},
        'paint': {
            'fill-extrude-height': { 'stops': [[0, 0], [1000, 1000]], 'property': 'height' },
            'fill-extrude-base': { 'stops': [[0, 0], [1000, 1000]], 'property': 'min_height' },
            'fill-color': '#ffffff'
        }
    }
  ]
};

var Map = React.createClass({
    componentDidMount() {
        this.map = new mapboxgl.Map({
            container: this.mapElement,
            pitch: 30,
            style: empty,
        });
        
        this.map.fitBounds(this.props.bounds);
        this.map.on('load', () => {
            this.map.setLight({
                'anchor': 'viewport',
                'color': '#ff00ff',
                'position': [1, 200, 30],
                'intensity': 0.3
            });
            this.map.getSource('osm').setData(this.props.geojson);
        });
    },
    componentDidUpdate() {
        this.map.getSource('osm').setData(this.props.geojson);
        this.map.fitBounds(this.props.bounds);
    },
    render: function() {
            return <div
                style={{height:300,width:300}}
        ref={elem => { this.mapElement = elem; }}></div>;
    }
});

var App = React.createClass({
    featuresToGeoJSON() {
        var context = this.props.context;
        var map = context.map();
        var entities = context.intersects(map.extent()) 
        var features = [];
        for (var id in entities) {
            try {
                var gj = entities[id].asGeoJSON(context.graph());
                if (gj.type !== 'Polygon') continue;
                if (entities[id].tags.building !== 'yes') continue;
                features.push({
                    type: 'Feature',
                    properties: {
                        extrude: true,
                        min_height: entities[id].tags.min_height ? parseFloat(entities[id].tags.min_height) : 0,
                        height: parseFloat(entities[id].tags.height)
                    },
                    geometry: gj
                });
            } catch(e) {
                console.error(e);
            }
        }
        this.setState({
           geojson: {
                type: 'FeatureCollection',
                features: features
           }
        });
    },
    getInitialState() {
        return  {
            active: false,
            features: []
        };
    },
    componentDidMount: function() {
        this.setState({
            bounds: [
                this.props.context.map().extent()[0],
                this.props.context.map().extent()[1]
            ]
        });
        this.props.context.on('change.idupwards', (e) => {
            this.featuresToGeoJSON();
        });
        this.props.context.history().on('change.idupwards', (e) => {
            this.featuresToGeoJSON();
        });
        this.props.context.map().on('move.idupwards', () => {
            this.setState({
                bounds: [
                    this.props.context.map().extent()[0],
                    this.props.context.map().extent()[1]
                ]
            });
        });
    },
    toggle: function() {
        this.setState({
            active: !this.state.active
        });
    },
    render: function () {
        var state = this.state;
        return <div className='map-control'>
            {state.active ?
                <div style={{ zIndex: -1,
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    right: 0,
                    bottom: 0
                }} className='content'>
                    <Map bounds={this.state.bounds} geojson={this.state.geojson} />
                </div> : null}
            <button tabIndex='-1' style={{color:'white'}} onClick={this.toggle}>
                3D
            </button>
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
