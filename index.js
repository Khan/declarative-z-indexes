/**
 * Library for generating z-indices from declarative constraints.
 */
// @flow

// Library for generating indices.
type Layer = {
    name: string,
    isAbove(layer: Layer): void,
    isBelow(layer: Layer): void,
};

type GraphValue = {
    name: string,
    above: {[name: string]: true},
    index: number,
    isStatic: boolean,
};

type Graph = {[name: string]: GraphValue};

export default class LayerSolver {
    _graph: Graph = {};

    _addLayer(name: string, value: GraphValue): Layer {
        if (this._graph.hasOwnProperty(name)) {
            throw new Error(
                `An index with the name ${name} already exists.`);
        }

        this._graph[name] = value;

        return {
            name,
            isAbove: (index: Layer) => {
                this._graph[name].above[index.name] = true;
            },
            isBelow: (index: Layer) => {
                this._graph[index.name].above[name] = true;
            },
        };
    }

    addLayer(name: string): Layer {
        return this._addLayer(name, {
            name,
            above: {},
            index: -Infinity,
            isStatic: false,
        });
    }

    addStaticLayer(name: string, index: number): Layer {
        return this._addLayer(name, {
            name,
            above: {},
            index,
            isStatic: true,
        });
    }

    _getGraphCopy(): Graph {
        // The graph probably has values like -Infinity in it, so we can't make
        // a copy just using JSON.parse(JSON.stringify()).
        const copy = {};

        Object.keys(this._graph).forEach(name => {
            // Copy each layer in the graph
            copy[name] = {
                ...this._graph[name],
                // And deeply copy the nested `above` property.
                above: {
                    ...this._graph[name].above,
                },
            };
        });

        return copy;
    }

    solve(): {[layer: string]: number} {
        // Topologically-sort the indices. Original algorithm
        // here: https://en.wikipedia.org/wiki/Topological_sorting#Kahn.27s_algorithm

        // Instead of actually generating the topological sort, we keep
        // track of the index of each of the nodes in the `.index` property
        // as we iterate through them.

        // We're going to be mutating the `index` and `above` properties in the
        // graph, so make a copy of it beforehand.
        const graph = this._getGraphCopy();

        // A list of all of the layers' names
        const allLayerNames = Object.keys(graph);

        // An object with keys of the names of layers that haven't been put in
        // order yet. This is used to determine if there are cycles in the
        // graph.
        const remainingLayers = {};
        allLayerNames.forEach(layerName => {
            remainingLayers[layerName] = true;
        });

        // A list of layers that are below all of the remaining vertices
        // to traverse. "Below" specifically means that it has no layers
        // that it is marked as "above". We pull from here when choosing the
        // next layer to order.
        const lowestLayerNames = allLayerNames.filter(layerName => {
            return Object.keys(graph[layerName].above).length === 0;
        });

        // The resulting z-indices of the layers.
        const solution = {};

        // Continue until there are no more layers that are below
        // all of the other layers.
        while (lowestLayerNames.length > 0) {
            // Pull a layer out of the graph.
            const layerName = lowestLayerNames.pop();
            delete remainingLayers[layerName];

            // If this dynamic layer hasn't been initialized yet, we set its
            // z-index to the minimum value, 1.
            if (
                !graph[layerName].isStatic &&
                graph[layerName].index === -Infinity
            ) {
                graph[layerName].index = 1;
            }
            const index: number = graph[layerName].index;
            solution[layerName] = index;

            // For each of the other layers in the graph,
            allLayerNames.forEach(otherLayerName => {
                // If the current layer is marked as being below the other
                // layer,
                if (layerName in graph[otherLayerName].above) {
                    // Remove that link, since by this point we statically know
                    // the index of the current layer.
                    delete graph[otherLayerName].above[layerName];

                    if (
                        graph[otherLayerName].isStatic &&
                        graph[otherLayerName].index <= index
                    ) {
                        // TODO(emily): Say what the two static indices are!
                        throw new Error(
                            "A static layer is conflicting with another " +
                            "static layer or the minimum layer value (1).");
                    }

                    // and if the other layer isn't static (and thus has a
                    // dynamically calculated index)
                    if (!graph[otherLayerName].isStatic) {
                        // Update the other layer's index to be at least 1
                        // more than the current layer's index, so that it will
                        // appear above it on the page.
                        graph[otherLayerName].index = Math.max(
                            graph[otherLayerName].index,
                            index + 1);
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
}
