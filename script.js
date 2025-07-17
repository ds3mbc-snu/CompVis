document.addEventListener('DOMContentLoaded', () => {
    // --- DOM & State ---
    const toolButtons = document.querySelectorAll('.tool-button');
    let currentTool = 'select'; // Default tool
    let nodeCounter = 1;

    // --- LEFT PANEL ---
    const leftNodes = new vis.DataSet();
    const leftEdges = new vis.DataSet(); // Declare leftEdges here
    const leftOptions = {
        nodes: {
            shape: 'dot',
            size: 10,
            color: { background: '#ffdd00', border: '#c3a900' }
        },
        physics: { enabled: false }, // Disable physics for manual positioning
        interaction: { dragNodes: true } // Enable node dragging
    };
    const leftContainer = document.getElementById('left-panel');
    const leftData = { nodes: leftNodes, edges: leftEdges }; // Link edges to network
    const leftNetwork = new vis.Network(leftContainer, leftData, leftOptions);

    // --- UNDIRECTED GRAPH DATA (Memory Only) ---
    const undirectedNodes = new vis.DataSet();
    const undirectedEdges = new vis.DataSet();
    const directedEdgeCounts = new Map(); // Map<string, number> to track directed edges between normalized pairs

    function logUndirectedGraphState() {
        console.log(`Undirected graph data updated: ${undirectedNodes.length} nodes, ${undirectedEdges.length} edges`);
    }

    // --- UNDIRECTED GRAPH RULES ---
    const rules = {};
    let currentUndirectedRule = 'comp'; // Default rule

    // Rule: COMP - Common Out-Neighbor
    function generateCOMPUndirectedGraph(nodes, edges) {
        undirectedNodes.clear();
        undirectedEdges.clear();
        directedEdgeCounts.clear();

        // Copy all nodes to the undirected graph
        nodes.forEach(node => undirectedNodes.add(node));

        // Build adjacency list for out-neighbors
        const outNeighbors = new Map(); // Map<nodeId, Set<outNeighborId>>
        edges.forEach(edge => {
            if (!outNeighbors.has(edge.from)) {
                outNeighbors.set(edge.from, new Set());
            }
            outNeighbors.get(edge.from).add(edge.to);
        });

        // Find common out-neighbors for all pairs of nodes
        const nodeIds = nodes.map(node => node.id);
        for (let i = 0; i < nodeIds.length; i++) {
            for (let j = i + 1; j < nodeIds.length; j++) {
                const nodeAId = nodeIds[i];
                const nodeBId = nodeIds[j];

                const outA = outNeighbors.get(nodeAId) || new Set();
                const outB = outNeighbors.get(nodeBId) || new Set();

                // Check for common out-neighbors
                let hasCommonOutNeighbor = false;
                for (const neighbor of outA) {
                    if (outB.has(neighbor)) {
                        hasCommonOutNeighbor = true;
                        break;
                    }
                }

                if (hasCommonOutNeighbor) {
                    // Add undirected edge if not already present
                    const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                    if (!undirectedEdges.get(edgeId)) {
                        undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                    }
                }
            }
        }
    }

    // Rule: CE - Common In-Neighbor
    function generateCEUndirectedGraph(nodes, edges) {
        undirectedNodes.clear();
        undirectedEdges.clear();
        directedEdgeCounts.clear();

        nodes.forEach(node => undirectedNodes.add(node));

        const inNeighbors = new Map(); // Map<nodeId, Set<inNeighborId>>
        edges.forEach(edge => {
            if (!inNeighbors.has(edge.to)) {
                inNeighbors.set(edge.to, new Set());
            }
            inNeighbors.get(edge.to).add(edge.from);
        });

        const nodeIds = nodes.map(node => node.id);
        for (let i = 0; i < nodeIds.length; i++) {
            for (let j = i + 1; j < nodeIds.length; j++) {
                const nodeAId = nodeIds[i];
                const nodeBId = nodeIds[j];

                const inA = inNeighbors.get(nodeAId) || new Set();
                const inB = inNeighbors.get(nodeBId) || new Set();

                let hasCommonInNeighbor = false;
                for (const neighbor of inA) {
                    if (inB.has(neighbor)) {
                        hasCommonInNeighbor = true;
                        break;
                    }
                }

                if (hasCommonInNeighbor) {
                    const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                    if (!undirectedEdges.get(edgeId)) {
                        undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                    }
                }
            }
        }
    }

    // Rule: CCE - COMP and CE
    function generateCCEUndirectedGraph(nodes, edges) {
        undirectedNodes.clear();
        undirectedEdges.clear();
        directedEdgeCounts.clear();

        nodes.forEach(node => undirectedNodes.add(node));

        const outNeighbors = new Map();
        edges.forEach(edge => {
            if (!outNeighbors.has(edge.from)) outNeighbors.set(edge.from, new Set());
            outNeighbors.get(edge.from).add(edge.to);
        });

        const inNeighbors = new Map();
        edges.forEach(edge => {
            if (!inNeighbors.has(edge.to)) inNeighbors.set(edge.to, new Set());
            inNeighbors.get(edge.to).add(edge.from);
        });

        const nodeIds = nodes.map(node => node.id);
        for (let i = 0; i < nodeIds.length; i++) {
            for (let j = i + 1; j < nodeIds.length; j++) {
                const nodeAId = nodeIds[i];
                const nodeBId = nodeIds[j];

                const outA = outNeighbors.get(nodeAId) || new Set();
                const outB = outNeighbors.get(nodeBId) || new Set();
                let hasCommonOutNeighbor = false;
                for (const neighbor of outA) {
                    if (outB.has(neighbor)) { hasCommonOutNeighbor = true; break; }
                }

                const inA = inNeighbors.get(nodeAId) || new Set();
                const inB = inNeighbors.get(nodeBId) || new Set();
                let hasCommonInNeighbor = false;
                for (const neighbor of inA) {
                    if (inB.has(neighbor)) { hasCommonInNeighbor = true; break; }
                }

                if (hasCommonOutNeighbor && hasCommonInNeighbor) {
                    const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                    if (!undirectedEdges.get(edgeId)) {
                        undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                    }
                }
            }
        }
    }

    // Rule: NICHE - COMP or CE
    function generateNICHEUndirectedGraph(nodes, edges) {
        undirectedNodes.clear();
        undirectedEdges.clear();
        directedEdgeCounts.clear();

        nodes.forEach(node => undirectedNodes.add(node));

        const outNeighbors = new Map();
        edges.forEach(edge => {
            if (!outNeighbors.has(edge.from)) outNeighbors.set(edge.from, new Set());
            outNeighbors.get(edge.from).add(edge.to);
        });

        const inNeighbors = new Map();
        edges.forEach(edge => {
            if (!inNeighbors.has(edge.to)) inNeighbors.set(edge.to, new Set());
            inNeighbors.get(edge.to).add(edge.from);
        });

        const nodeIds = nodes.map(node => node.id);
        for (let i = 0; i < nodeIds.length; i++) {
            for (let j = i + 1; j < nodeIds.length; j++) {
                const nodeAId = nodeIds[i];
                const nodeBId = nodeIds[j];

                const outA = outNeighbors.get(nodeAId) || new Set();
                const outB = outNeighbors.get(nodeBId) || new Set();
                let hasCommonOutNeighbor = false;
                for (const neighbor of outA) {
                    if (outB.has(neighbor)) { hasCommonOutNeighbor = true; break; }
                }

                const inA = inNeighbors.get(nodeAId) || new Set();
                const inB = inNeighbors.get(nodeBId) || new Set();
                let hasCommonInNeighbor = false;
                for (const neighbor of inA) {
                    if (inB.has(neighbor)) { hasCommonInNeighbor = true; break; }
                }

                if (hasCommonOutNeighbor || hasCommonInNeighbor) {
                    const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                    if (!undirectedEdges.get(edgeId)) {
                        undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                    }
                }
            }
        }
    }

    // Rule: PHY - COMP or Direct Arc
    function generatePHYUndirectedGraph(nodes, edges) {
        undirectedNodes.clear();
        undirectedEdges.clear();
        directedEdgeCounts.clear();

        nodes.forEach(node => undirectedNodes.add(node));

        const outNeighbors = new Map();
        edges.forEach(edge => {
            if (!outNeighbors.has(edge.from)) outNeighbors.set(edge.from, new Set());
            outNeighbors.get(edge.from).add(edge.to);
        });

        const nodeIds = nodes.map(node => node.id);
        for (let i = 0; i < nodeIds.length; i++) {
            for (let j = i + 1; j < nodeIds.length; j++) {
                const nodeAId = nodeIds[i];
                const nodeBId = nodeIds[j];

                // Check for COMP condition
                const outA = outNeighbors.get(nodeAId) || new Set();
                const outB = outNeighbors.get(nodeBId) || new Set();
                let hasCommonOutNeighbor = false;
                for (const neighbor of outA) {
                    if (outB.has(neighbor)) {
                        hasCommonOutNeighbor = true;
                        break;
                    }
                }

                // Check for direct arc condition
                let hasDirectArc = false;
                edges.forEach(edge => {
                    if ((edge.from === nodeAId && edge.to === nodeBId) || (edge.from === nodeBId && edge.to === nodeAId)) {
                        hasDirectArc = true;
                    }
                });

                if (hasCommonOutNeighbor || hasDirectArc) {
                    const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                    if (!undirectedEdges.get(edgeId)) {
                        undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                    }
                }
            }
        }
    }

    // Rule: (1,2)-STEP
    function generateOneTwoStepGraph(nodes, edges) {
        undirectedNodes.clear();
        undirectedEdges.clear();
        directedEdgeCounts.clear();

        nodes.forEach(node => undirectedNodes.add(node));

        const adj = new Map(); // Adjacency list for out-neighbors
        const revAdj = new Map(); // Adjacency list for in-neighbors
        edges.forEach(edge => {
            if (!adj.has(edge.from)) adj.set(edge.from, new Set());
            adj.get(edge.from).add(edge.to);

            if (!revAdj.has(edge.to)) revAdj.set(edge.to, new Set());
            revAdj.get(edge.to).add(edge.from);
        });

        // Helper to find paths of length 1 or 2, avoiding specific nodes
        function findPaths(startNode, targetNode, maxLength, avoidNodes) {
            const paths = [];
            const queue = [[startNode, [startNode]]]; // [currentNode, path]

            while (queue.length > 0) {
                const [currentNode, path] = queue.shift();

                if (path.length - 1 > maxLength) continue;

                if (currentNode === targetNode && path.length - 1 > 0) {
                    paths.push(path);
                    continue;
                }

                const neighbors = adj.get(currentNode) || new Set();
                for (const neighbor of neighbors) {
                    if (!avoidNodes.includes(neighbor) && !path.includes(neighbor)) {
                        queue.push([neighbor, [...path, neighbor]]);
                    }
                }
            }
            return paths;
        }

        // Helper to check if a path of given length exists
        function hasPath(startNode, endNode, length, avoidNodes, currentAdj) {
            if (length === 1) {
                return (currentAdj.get(startNode) || new Set()).has(endNode);
            } else if (length === 2) {
                const intermediateNodes = currentAdj.get(startNode) || new Set();
                for (const intermediate of intermediateNodes) {
                    if (!avoidNodes.includes(intermediate) && (currentAdj.get(intermediate) || new Set()).has(endNode)) {
                        return true;
                    }
                }
            }
            return false;
        }

        const nodeIds = nodes.map(node => node.id);
        for (let i = 0; i < nodeIds.length; i++) {
            for (let j = i + 1; j < nodeIds.length; j++) {
                const nodeAId = nodeIds[i];
                const nodeBId = nodeIds[j];

                // Skip if A and B are the same node
                if (nodeAId === nodeBId) continue;

                // Check condition 1: (x -> z, y -> z or y -> w -> z)
                // x = nodeAId, y = nodeBId
                for (const zId of nodeIds) {
                    if (zId === nodeAId || zId === nodeBId) continue; // z must be different from x and y

                    const cond1_part1 = hasPath(nodeAId, zId, 1, [nodeBId], adj); // x -> z (length 1, avoiding y)
                    const cond1_part2 = hasPath(nodeBId, zId, 1, [nodeAId], adj) || hasPath(nodeBId, zId, 2, [nodeAId], adj); // y -> z (length 1 or 2, avoiding x)

                    if (cond1_part1 && cond1_part2) {
                        const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                        if (!undirectedEdges.get(edgeId)) {
                            undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                        }
                    }
                }

                // Check condition 2: (x -> z or x -> w -> z, y -> z)
                // x = nodeAId, y = nodeBId
                for (const zId of nodeIds) {
                    if (zId === nodeAId || zId === nodeBId) continue; // z must be different from x and y

                    const cond2_part1 = hasPath(nodeAId, zId, 1, [nodeBId], adj) || hasPath(nodeAId, zId, 2, [nodeBId], adj); // x -> z (length 1 or 2, avoiding y)
                    const cond2_part2 = hasPath(nodeBId, zId, 1, [nodeAId], adj); // y -> z (length 1, avoiding x)

                    if (cond2_part1 && cond2_part2) {
                        const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                        if (!undirectedEdges.get(edgeId)) {
                            undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                        }
                    }
                }
            }
        }
    }

    // Rule: m-STEP
    function generateMStepGraph(nodes, edges, m) {
        undirectedNodes.clear();
        undirectedEdges.clear();
        directedEdgeCounts.clear();

        nodes.forEach(node => undirectedNodes.add(node));

        // Build adjacency list for efficient path finding
        const adj = new Map(); // Map<nodeId, Set<outNeighborId>>
        edges.forEach(edge => {
            if (!adj.has(edge.from)) adj.set(edge.from, new Set());
            adj.get(edge.from).add(edge.to);
        });

        // Function to find all nodes reachable from startNode in m steps
        function findReachableNodes(startNode, steps) {
            let reachable = new Set();
            let currentLevel = new Set([startNode]);

            for (let i = 0; i < steps; i++) {
                let nextLevel = new Set();
                for (const node of currentLevel) {
                    const neighbors = adj.get(node);
                    if (neighbors) {
                        neighbors.forEach(neighbor => nextLevel.add(neighbor));
                    }
                }
                currentLevel = nextLevel;
                if (currentLevel.size === 0) break;
            }
            return currentLevel;
        }

        const nodeIds = nodes.map(node => node.id);
        for (let i = 0; i < nodeIds.length; i++) {
            for (let j = i + 1; j < nodeIds.length; j++) {
                const nodeAId = nodeIds[i];
                const nodeBId = nodeIds[j];

                const reachableFromA = findReachableNodes(nodeAId, m);
                const reachableFromB = findReachableNodes(nodeBId, m);

                let hasCommonReachableNode = false;
                for (const node of reachableFromA) {
                    if (reachableFromB.has(node)) {
                        hasCommonReachableNode = true;
                        break;
                    }
                }

                if (hasCommonReachableNode) {
                    const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                    if (!undirectedEdges.get(edgeId)) {
                        undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                    }
                }
            }
        }
    }

    rules['comp'] = generateCOMPUndirectedGraph;
    rules['ce'] = generateCEUndirectedGraph;
    rules['cce'] = generateCCEUndirectedGraph;
    rules['niche'] = generateNICHEUndirectedGraph;
    rules['phy'] = generatePHYUndirectedGraph;
    rules['one-two-step'] = generateOneTwoStepGraph;
    rules['m-step'] = generateMStepGraph;

    // Function to update the undirected graph based on the current rule
    function updateUndirectedGraphDisplay() {
        const currentNodes = leftNodes.get();
        const currentEdges = leftEdges.get();
        if (currentUndirectedRule === 'm-step') {
            const m = parseInt(mStepInput.value, 10);
            rules[currentUndirectedRule](currentNodes, currentEdges, m);
        } else {
            rules[currentUndirectedRule](currentNodes, currentEdges);
        }
        logUndirectedGraphState();
    }

    // --- RIGHT PANEL ---
    const rightNodes = new vis.DataSet();
    const rightOptions = {
        nodes: {
            shape: 'dot',
            size: 10,
            color: { background: '#99ccff', border: '#66a3ff' }
        },
        interaction: { dragNodes: false, zoomView: false, dragView: false },
        physics: { enabled: false } // Disable physics for right panel
    };
    const rightContainer = document.getElementById('right-panel');
    const rightData = { nodes: undirectedNodes, edges: undirectedEdges };
    const rightNetwork = new vis.Network(rightContainer, rightData, rightOptions);

    // 1. Tool selection
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button style
            toolButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            // Update current tool state
            currentTool = button.id.replace('-tool', '');
            console.log(`Tool changed to: ${currentTool}`);

            // Activate vis.js specific modes
            if (currentTool === 'add-node') {
                // No specific vis.js mode for add-node, handled by click event
            } else if (currentTool === 'select') {
                leftNetwork.disableEditMode(); // Enable default interaction
            } else {
                leftNetwork.disableEditMode(); // Disable any active edit modes for other tools
            }
        });
    });

    const mStepControls = document.getElementById('m-step-controls');
    const mStepInput = document.getElementById('m-step-input');

    // 2. Rule selection
    const ruleButtons = document.querySelectorAll('.rule-button');
    ruleButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button style
            ruleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            // Update current rule state
            currentUndirectedRule = button.id.replace('rule-', '').replace('-button', '').toLowerCase();
            console.log(`Rule changed to: ${currentUndirectedRule}`);

            // Show/hide m-STEP controls
            if (currentUndirectedRule === 'm-step') {
                mStepControls.style.display = 'inline-block';
            } else {
                mStepControls.style.display = 'none';
            }

            updateUndirectedGraphDisplay(); // Update undirected graph with new rule
        });
    });

    // Listen for changes in the m-step input
    mStepInput.addEventListener('change', () => {
        if (currentUndirectedRule === 'm-step') {
            updateUndirectedGraphDisplay();
        }
    });

    // 2. Handle clicks on LEFT panel based on currentTool
    let firstNode = null; // For arc creation

    leftNetwork.on('click', (params) => {
        if (currentTool === 'add-node') {
            // Add node logic
            if (params.nodes.length === 0 && params.edges.length === 0) {
                const nodeId = new Date().getTime();
                leftNodes.add({
                    id: nodeId,
                    label: `v${nodeCounter++}`,
                    x: params.pointer.canvas.x,
                    y: params.pointer.canvas.y
                });
            }
        } else if (currentTool === 'add-edge') {
            // Arc creation logic
            if (params.nodes.length > 0) {
                const clickedNodeId = params.nodes[0];
                console.log(`[Add-Edge] Node clicked: ${clickedNodeId}. Current firstNode: ${firstNode}`);
                if (firstNode === null) {
                    firstNode = clickedNodeId;
                    console.log(`[Add-Edge] First node set: ${firstNode}`);
                } else {
                    // Check if an edge already exists between these two nodes
                    const existingEdges = leftEdges.get({
                        filter: function (edge) {
                            return (edge.from === firstNode && edge.to === clickedNodeId) ||
                                   (edge.from === clickedNodeId && edge.to === firstNode);
                        }
                    });
                    const edgeExists = existingEdges.length > 0;
                    console.log(`[Add-Edge] Edge from ${firstNode} to ${clickedNodeId} already exists? ${edgeExists}`);

                    if (firstNode !== clickedNodeId && !edgeExists) {
                        const edgeId = `edge-${firstNode}-${clickedNodeId}-${new Date().getTime()}`; // Ensure unique ID
                        leftEdges.add({
                            id: edgeId,
                            from: firstNode,
                            to: clickedNodeId,
                            arrows: 'to'
                        });
                        console.log(`[Add-Edge] Successfully added arc: ${edgeId}`);
                    } else if (firstNode === clickedNodeId) {
                        console.log(`[Add-Edge] Cannot create arc to the same node: ${firstNode}`);
                    } else if (edgeExists) {
                        console.log(`[Add-Edge] Arc already exists between ${firstNode} and ${clickedNodeId}.`);
                    }
                    firstNode = null; // Reset for next arc
                }
            }
        } else if (currentTool === 'delete') {
            // Delete logic
            if (params.nodes.length > 0) {
                leftNodes.remove({ id: params.nodes[0] });
                console.log(`[Delete] Node ${params.nodes[0]} deleted.`);
            } else if (params.edges.length > 0) {
                leftEdges.remove({ id: params.edges[0] });
                console.log(`[Delete] Edge ${params.edges[0]} deleted.`);
            }
        }
    });

    // After drawing, ensure no node is selected to prevent immediate drag
    leftNetwork.on('afterDrawing', (ctx) => {
        if (currentTool === 'add-node') {
            const selectedNodes = leftNetwork.getSelectedNodes();
            if (selectedNodes.length > 0) {
                leftNetwork.unselectAll();
            }
        }
    });

    // Sync node creation from LEFT to RIGHT
    leftNodes.on('add', (event, properties) => {
        console.log('Syncing node ADD to right panel');
        const addedNodes = leftNodes.get(properties.items);
        rightNodes.add(addedNodes);
        updateUndirectedGraphDisplay(); // Update undirected graph
    });

    // Sync node position from LEFT to RIGHT on drag end
    leftNetwork.on('dragEnd', (params) => {
        if (params.nodes.length > 0) {
            const draggedNodeId = params.nodes[0];
            const nodePosition = leftNetwork.getPositions([draggedNodeId]);
            const x = nodePosition[draggedNodeId].x;
            const y = nodePosition[draggedNodeId].y;

            // Update the position in the main (left) dataset.
            leftNodes.update({
                id: draggedNodeId,
                x: x,
                y: y
            });

            // Now, regenerate the right-side graph. It will use the updated
            // positions from the main dataset.
            updateUndirectedGraphDisplay();
        }
    });

    // Sync node deletion from LEFT to RIGHT
    leftNodes.on('remove', (event, properties) => {
        console.log('Syncing node REMOVE to right panel');
        rightNodes.remove(properties.items);
        updateUndirectedGraphDisplay(); // Update undirected graph
    });

    // Sync edge creation/deletion/update from LEFT to UNDIRECTED
    leftEdges.on('add', (event, properties) => {
        updateUndirectedGraphDisplay();
    });
    leftEdges.on('remove', (event, properties) => {
        updateUndirectedGraphDisplay();
    });
    leftEdges.on('update', (event, properties) => {
        updateUndirectedGraphDisplay();
    });

    // --- Clear Button ---    
    const clearButton = document.getElementById('clear-tool');
    clearButton.addEventListener('click', () => {
        if (confirm("정말로 모든 그래프를 초기화하시겠습니까?")) {
            leftNodes.clear();
            leftEdges.clear();
            undirectedNodes.clear();
            undirectedEdges.clear();
            nodeCounter = 1;
            console.log("Graphs cleared.");
        }
    });

    // --- Import/Export Buttons ---
    const importButton = document.getElementById('import-button');
    const exportButton = document.getElementById('export-button');
    const importFileInput = document.getElementById('import-file-input');

    // --- Random Graph Generation Button ---
    const generateRandomButton = document.getElementById('generate-random-button');

    generateRandomButton.addEventListener('click', () => {
        const numNodesStr = prompt("생성할 꼭짓점의 개수를 입력하세요 (양의 정수):", "5");
        if (numNodesStr === null) return; // User cancelled

        const numNodes = parseInt(numNodesStr, 10);

        if (isNaN(numNodes) || numNodes <= 0 || !Number.isInteger(numNodes)) {
            alert("유효한 양의 정수를 입력해주세요.");
            return;
        }

        // Clear existing graphs
        leftNodes.clear();
        leftEdges.clear();
        undirectedNodes.clear();
        undirectedEdges.clear();
        nodeCounter = 1; // Reset node counter

        // Generate nodes
        const newNodes = [];
        const canvasWidth = leftContainer.clientWidth;
        const canvasHeight = leftContainer.clientHeight;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = Math.min(canvasWidth, canvasHeight) / 3; // Adjust radius as needed

        for (let i = 0; i < numNodes; i++) {
            const nodeId = new Date().getTime() + i; // Ensure unique ID
            // Calculate angle: start at top (PI/2) and go counter-clockwise
            const angle = Math.PI / 2 + (i * 2 * Math.PI / numNodes);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY - radius * Math.sin(angle); // Invert y-axis for counter-clockwise visual

            newNodes.push({
                id: nodeId,
                label: `v${nodeCounter++}`,
                x: x,
                y: y
            });
        }
        leftNodes.add(newNodes);

        // Generate acyclic directed edges (i -> j only if i < j)
        const newEdges = [];
        const nodeIds = newNodes.map(node => node.id);
        const edgeProbability = 0.5;

        for (let i = 0; i < numNodes; i++) {
            for (let j = i + 1; j < numNodes; j++) {
                if (Math.random() < edgeProbability) {
                    newEdges.push({
                        from: nodeIds[i],
                        to: nodeIds[j],
                        arrows: 'to'
                    });
                }
            }
        }
        leftEdges.add(newEdges);

        updateUndirectedGraphDisplay(); // Update right panel
        leftNetwork.fit(); // Fit the graph to the view
        rightNetwork.fit(); // Fit the right graph to the view
        console.log(`Generated random graph with ${numNodes} nodes.`);
    });

    exportButton.addEventListener('click', () => {
        if (confirm("현재 그래프 데이터를 JSON 파일로 내보내시겠습니까?")) {
            const data = {
                nodes: leftNodes.get(),
                edges: leftEdges.get(),
                rule: currentUndirectedRule
            };

            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'graph-data.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    });

    importButton.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Clear existing data
                leftNodes.clear();
                leftEdges.clear();

                // Load new data
                leftNodes.add(data.nodes);
                leftEdges.add(data.edges);

                // Set the rule
                const ruleButton = document.getElementById(`rule-${data.rule}-button`);
                if (ruleButton) {
                    ruleButton.click();
                }

                // Reset the file input
                importFileInput.value = '';

            } catch (error) {
                console.error("Error parsing JSON file:", error);
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    });

    console.log("Script loaded with basic vertex creation.");
});