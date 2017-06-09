"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LayerSolver = function () {
    function LayerSolver() {
        _classCallCheck(this, LayerSolver);

        this._graph = {};
    }

    _createClass(LayerSolver, [{
        key: "_addLayer",
        value: function _addLayer(name, value) {
            var _this = this;

            if (this._graph.hasOwnProperty(name)) {
                throw new Error("An index with the name " + name + " already exists.");
            }

            this._graph[name] = value;

            return {
                name: name,
                isAbove: function isAbove(index) {
                    _this._graph[name].above[index.name] = true;
                },
                isBelow: function isBelow(index) {
                    _this._graph[index.name].above[name] = true;
                }
            };
        }
    }, {
        key: "addLayer",
        value: function addLayer(name) {
            return this._addLayer(name, {
                name: name,
                above: {},
                index: -Infinity,
                isStatic: false
            });
        }
    }, {
        key: "addStaticLayer",
        value: function addStaticLayer(name, index) {
            return this._addLayer(name, {
                name: name,
                above: {},
                index: index,
                isStatic: true
            });
        }
    }, {
        key: "_getGraphCopy",
        value: function _getGraphCopy() {
            var _this2 = this;

            // The graph probably has values like -Infinity in it, so we can't make
            // a copy just using JSON.parse(JSON.stringify()).
            var copy = {};

            Object.keys(this._graph).forEach(function (name) {
                // Copy each layer in the graph
                copy[name] = _extends({}, _this2._graph[name], {
                    // And deeply copy the nested `above` property.
                    above: _extends({}, _this2._graph[name].above)
                });
            });

            return copy;
        }
    }, {
        key: "solve",
        value: function solve() {
            // Topologically-sort the indices. Original algorithm
            // here: https://en.wikipedia.org/wiki/Topological_sorting#Kahn.27s_algorithm

            // Instead of actually generating the topological sort, we keep
            // track of the index of each of the nodes in the `.index` property
            // as we iterate through them.

            // We're going to be mutating the `index` and `above` properties in the
            // graph, so make a copy of it beforehand.
            var graph = this._getGraphCopy();

            // A list of all of the layers' names
            var allLayerNames = Object.keys(graph);

            // An object with keys of the names of layers that haven't been put in
            // order yet. This is used to determine if there are cycles in the
            // graph.
            var remainingLayers = {};
            allLayerNames.forEach(function (layerName) {
                remainingLayers[layerName] = true;
            });

            // A list of layers that are below all of the remaining vertices
            // to traverse. "Below" specifically means that it has no layers
            // that it is marked as "above". We pull from here when choosing the
            // next layer to order.
            var lowestLayerNames = allLayerNames.filter(function (layerName) {
                return Object.keys(graph[layerName].above).length === 0;
            });

            // The resulting z-indices of the layers.
            var solution = {};

            // Continue until there are no more layers that are below
            // all of the other layers.

            var _loop = function _loop() {
                // Pull a layer out of the graph.
                var layerName = lowestLayerNames.pop();
                delete remainingLayers[layerName];

                // If this dynamic layer hasn't been initialized yet, we set its
                // z-index to the minimum value, 1.
                if (!graph[layerName].isStatic && graph[layerName].index === -Infinity) {
                    graph[layerName].index = 1;
                }
                var index = graph[layerName].index;
                solution[layerName] = index;

                // For each of the other layers in the graph,
                allLayerNames.forEach(function (otherLayerName) {
                    // If the current layer is marked as being below the other
                    // layer,
                    if (layerName in graph[otherLayerName].above) {
                        // Remove that link, since by this point we statically know
                        // the index of the current layer.
                        delete graph[otherLayerName].above[layerName];

                        if (graph[otherLayerName].isStatic && graph[otherLayerName].index <= index) {
                            // TODO(emily): Say what the two static indices are!
                            throw new Error("A static layer is conflicting with another " + "static layer or the minimum layer value (1).");
                        }

                        // and if the other layer isn't static (and thus has a
                        // dynamically calculated index)
                        if (!graph[otherLayerName].isStatic) {
                            // Update the other layer's index to be at least 1
                            // more than the current layer's index, so that it will
                            // appear above it on the page.
                            graph[otherLayerName].index = Math.max(graph[otherLayerName].index, index + 1);
                        }

                        // If our link was the last "above" connection the other
                        // layer had to the graph, it is now among the lowest
                        // layers in the graph, so add its name to the list of
                        // lowest names.
                        if (Object.keys(graph[otherLayerName].above).length === 0) {
                            lowestLayerNames.push(otherLayerName);
                        }
                    }
                });
            };

            while (lowestLayerNames.length > 0) {
                _loop();
            }

            // If we didn't reach all of the layers in our traversal, there must be
            // a cycle of "above" links. In that case, we can't find a solution, so
            // we bail out.
            if (Object.keys(remainingLayers).length > 0) {
                // TODO(emily): Show what the cycle is (or one of the cycles, if
                // there are multiple).
                throw new Error("Cycle detected!");
            }

            return solution;
        }
    }]);

    return LayerSolver;
}(); /**
      * Library for generating z-indices from declarative constraints.
      */


// Library for generating indices.


exports.default = LayerSolver;