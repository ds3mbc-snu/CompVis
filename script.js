document.addEventListener('DOMContentLoaded', () => {
    // --- Page Navigation ---
    const pageContents = document.querySelectorAll('.page-content');
    const navButtons = document.querySelectorAll('.nav-button, .back-button');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPage = button.getAttribute('data-page');
            pageContents.forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(targetPage).classList.add('active');
        });
    });

    // --- Factory function to create a visualizer instance ---
    const createVisualizerInstance = (name) => {
        const prefix = name ? `${name}-` : '';
        const id = (base) => `${prefix}${base}`;

        let nodeCounter = 1;
        let currentTool = 'select';
        let currentUndirectedRule = 'comp';
        let firstNode = null;

        // --- Get DOM Elements ---
        const toolButtons = document.querySelectorAll(`#${id('toolbar')} .tool-button`);
        const ruleButtons = document.querySelectorAll(`#${id('rule-selection-toolbar')} .rule-button`);
        const leftContainer = document.getElementById(id('left-panel'));
        const rightContainer = document.getElementById(id('right-panel'));
        const toolDescriptionDisplay = document.getElementById(id('tool-description-display'));
        const ruleDescriptionDisplay = document.getElementById(id('rule-description-display'));
        const mStepControls = document.getElementById(id('m-step-controls'));
        const pCompControls = document.getElementById(id('p-comp-controls'));
        const mStepInput = document.getElementById(id('m-step-input'));
        const pCompInput = document.getElementById(id('p-comp-input'));
        const importFileInput = document.getElementById(id('import-file-input'));

        // Check if containers exist before creating networks
        if (!leftContainer || !rightContainer) {
            return; // Don't initialize if the page structure isn't there
        }

        // --- vis.js Networks ---
        const leftNodes = new vis.DataSet();
        const leftEdges = new vis.DataSet();
        const undirectedNodes = new vis.DataSet();
        const undirectedEdges = new vis.DataSet();

        const leftNetwork = new vis.Network(leftContainer, { nodes: leftNodes, edges: leftEdges }, {
            nodes: { shape: 'dot', size: 10, color: { background: '#ffdd00', border: '#c3a900' } },
            physics: { enabled: false },
            interaction: { dragNodes: true }
        });
        const rightNetwork = new vis.Network(rightContainer, { nodes: undirectedNodes, edges: undirectedEdges }, {
            nodes: { shape: 'dot', size: 10, color: { background: '#99ccff', border: '#66a3ff' } },
            interaction: { dragNodes: false, zoomView: false, dragView: false },
            physics: { enabled: false }
        });

        // --- Rule Definitions & Descriptions ---
        const rules = {
            'comp': (nodes, edges) => {
                undirectedNodes.clear();
                undirectedEdges.clear();
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
                        const outA = outNeighbors.get(nodeAId) || new Set();
                        const outB = outNeighbors.get(nodeBId) || new Set();
                        for (const neighbor of outA) {
                            if (outB.has(neighbor)) {
                                const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                                if (!undirectedEdges.get(edgeId)) {
                                    undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                                }
                                break;
                            }
                        }
                    }
                }
            },
            'p-comp': (nodes, edges, p) => {
                undirectedNodes.clear();
                undirectedEdges.clear();
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
                        const outA = outNeighbors.get(nodeAId) || new Set();
                        const outB = outNeighbors.get(nodeBId) || new Set();
                        let commonCount = 0;
                        for (const neighbor of outA) {
                            if (outB.has(neighbor)) commonCount++;
                        }
                        if (commonCount >= p) {
                            const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                            if (!undirectedEdges.get(edgeId)) {
                                undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                            }
                        }
                    }
                }
            },
            'ce': (nodes, edges) => {
                undirectedNodes.clear();
                undirectedEdges.clear();
                nodes.forEach(node => undirectedNodes.add(node));
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
                        const inA = inNeighbors.get(nodeAId) || new Set();
                        const inB = inNeighbors.get(nodeBId) || new Set();
                        for (const neighbor of inA) {
                            if (inB.has(neighbor)) {
                                const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                                if (!undirectedEdges.get(edgeId)) {
                                    undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                                }
                                break;
                            }
                        }
                    }
                }
            },
            'cce': (nodes, edges) => {
                undirectedNodes.clear();
                undirectedEdges.clear();
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
                        let hasCommonOut = false;
                        const outA = outNeighbors.get(nodeAId) || new Set();
                        const outB = outNeighbors.get(nodeBId) || new Set();
                        for (const neighbor of outA) { if (outB.has(neighbor)) { hasCommonOut = true; break; } }
                        let hasCommonIn = false;
                        const inA = inNeighbors.get(nodeAId) || new Set();
                        const inB = inNeighbors.get(nodeBId) || new Set();
                        for (const neighbor of inA) { if (inB.has(neighbor)) { hasCommonIn = true; break; } }
                        if (hasCommonIn && hasCommonOut) {
                            const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                            if (!undirectedEdges.get(edgeId)) {
                                undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                            }
                        }
                    }
                }
            },
            'niche': (nodes, edges) => {
                undirectedNodes.clear();
                undirectedEdges.clear();
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
                        let hasCommonOut = false;
                        const outA = outNeighbors.get(nodeAId) || new Set();
                        const outB = outNeighbors.get(nodeBId) || new Set();
                        for (const neighbor of outA) { if (outB.has(neighbor)) { hasCommonOut = true; break; } }
                        let hasCommonIn = false;
                        const inA = inNeighbors.get(nodeAId) || new Set();
                        const inB = inNeighbors.get(nodeBId) || new Set();
                        for (const neighbor of inA) { if (inB.has(neighbor)) { hasCommonIn = true; break; } }
                        if (hasCommonIn || hasCommonOut) {
                            const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                            if (!undirectedEdges.get(edgeId)) {
                                undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                            }
                        }
                    }
                }
            },
            'phy': (nodes, edges) => {
                undirectedNodes.clear();
                undirectedEdges.clear();
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
                        let hasCommonOut = false;
                        const outA = outNeighbors.get(nodeAId) || new Set();
                        const outB = outNeighbors.get(nodeBId) || new Set();
                        for (const neighbor of outA) { if (outB.has(neighbor)) { hasCommonOut = true; break; } }
                        let hasDirectArc = false;
                        edges.forEach(edge => {
                            if ((edge.from === nodeAId && edge.to === nodeBId) || (edge.from === nodeBId && edge.to === nodeAId)) {
                                hasDirectArc = true;
                            }
                        });
                        if (hasCommonOut || hasDirectArc) {
                            const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                            if (!undirectedEdges.get(edgeId)) {
                                undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                            }
                        }
                    }
                }
            },
            'm-step': (nodes, edges, m) => {
                undirectedNodes.clear();
                undirectedEdges.clear();
                nodes.forEach(node => undirectedNodes.add(node));
                const adj = new Map();
                edges.forEach(edge => {
                    if (!adj.has(edge.from)) adj.set(edge.from, new Set());
                    adj.get(edge.from).add(edge.to);
                });
                function findReachableNodes(startNode, steps) {
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
                        const reachableA = findReachableNodes(nodeAId, m);
                        const reachableB = findReachableNodes(nodeBId, m);
                        for (const node of reachableA) {
                            if (reachableB.has(node)) {
                                const edgeId = `graph-${Math.min(nodeAId, nodeBId)}-${Math.max(nodeAId, nodeBId)}`;
                                if (!undirectedEdges.get(edgeId)) {
                                    undirectedEdges.add({ id: edgeId, from: nodeAId, to: nodeBId });
                                }
                                break;
                            }
                        }
                    }
                }
            }
        };

        const toolDescriptions = {
            'select': 'Select and drag vertices and arcs.',
            'add-node': 'Create a new vertex at the clicked position.',
            'add-edge': 'Click two vertices to create an arc.',
            'generate-random': 'Generate a random acyclic digraph.',
            'generate-tournament': 'Generate a (multipartite) tournament.',
            'generate-sequence': 'Generate a circulant digraph from a sequence.',
            'delete': 'Click a vertex or arc to delete it.',
            'clear': 'Clear all graph data.',
            'import': 'Load graph data from a JSON file.',
            'export': 'Export current graph data to a JSON file.'
        };

        const ruleDescriptions = {
            'comp': 'Competition Graph: Connects two vertices if they have a common prey.',
            'p-comp': 'p-Competition Graph: Connects two vertices if they have p or more common prey.',
            'ce': 'Common-Enemy Graph: Connects two vertices if they have a common predator.',
            'cce': 'CCE Graph: Connects vertices if they have both a common prey and predator.',
            'niche': 'Niche Graph: Connects vertices if they have a common prey OR predator.',
            'phy': 'Phylogeny Graph: Connects vertices if they compete OR an arc exists between them.',
            '(1,2)-step': '(1,2)-step Competition Graph.',
            'm-step': 'm-step Competition Graph.'
        };

        const updateUndirectedGraphDisplay = () => {
            const currentNodes = leftNodes.get();
            const currentEdges = leftEdges.get();
            if (rules[currentUndirectedRule]) {
                 if (currentUndirectedRule === 'm-step') {
                    const m = parseInt(mStepInput.value, 10);
                    rules[currentUndirectedRule](currentNodes, currentEdges, m);
                } else if (currentUndirectedRule === 'p-comp') {
                    const p = parseInt(pCompInput.value, 10);
                    rules[currentUndirectedRule](currentNodes, currentEdges, p);
                } else {
                    rules[currentUndirectedRule](currentNodes, currentEdges);
                }
                rightNetwork.fit();
            }
        };

        const updateToolDescription = (toolId) => { toolDescriptionDisplay.textContent = toolDescriptions[toolId.replace(`${prefix}`, '')] || ''; };
        const updateRuleDescription = (ruleId) => { ruleDescriptionDisplay.textContent = ruleDescriptions[ruleId] || ''; };

        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                const toolId = button.id.replace(`${prefix}`, '');
                if (toolId === 'clear-tool') {
                    if (confirm("Are you sure you want to clear all graph data?")) {
                        leftNodes.clear();
                        leftEdges.clear();
                        nodeCounter = 1;
                    }
                    return;
                }
                if (toolId === 'import-button') {
                    importFileInput.click();
                    return;
                }
                if (toolId === 'export-button') {
                    const data = {
                        nodes: leftNodes.get(),
                        edges: leftEdges.get(),
                        rule: currentUndirectedRule
                    };
                    const jsonStr = JSON.stringify(data, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'graph-export.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    return;
                }
                if (toolId === 'generate-random-button') {
                    generateRandomGraph();
                    return;
                }
                if (toolId === 'generate-tournament-button') {
                    generateTournament();
                    return;
                }
                if (toolId === 'generate-sequence-button') {
                    const nStr = prompt("Enter the number of vertices (n):");
                    if (nStr === null) return;
                    const n = parseInt(nStr, 10);
                    if (isNaN(n) || n <= 0) return alert("Invalid number of vertices.");

                    const seqStr = prompt("Enter the sequence as comma-separated numbers (e.g., 1,3,4):");
                    if (seqStr === null) return;
                    const sequence = seqStr.split(',').map(s => parseInt(s.trim(), 10));
                    if (sequence.some(isNaN) || sequence.some(s => s <= 0)) return alert('Invalid sequence. Please use positive, comma-separated numbers.');

                    generateSequenceGraph(n, sequence);
                    return;
                }

                document.querySelectorAll(`#${id('toolbar')} .tool-button`).forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = toolId.replace('-tool', '');
                updateToolDescription(currentTool);
            });
        });

        ruleButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll(`#${id('rule-selection-toolbar')} .rule-button`).forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentUndirectedRule = button.id.replace(`${id('rule')}-`, '').replace('-button', '');
                updateRuleDescription(currentUndirectedRule);
                if (mStepControls) mStepControls.style.display = currentUndirectedRule === 'm-step' ? 'inline-block' : 'none';
                if (pCompControls) pCompControls.style.display = currentUndirectedRule === 'p-comp' ? 'inline-block' : 'none';
                updateUndirectedGraphDisplay();
            });
        });

        leftNetwork.on('click', (params) => {
            if (currentTool === 'add-node' && params.nodes.length === 0 && params.edges.length === 0) {
                leftNodes.add({ id: new Date().getTime(), label: `v${nodeCounter++}`, x: params.pointer.canvas.x, y: params.pointer.canvas.y });
            } else if (currentTool === 'add-edge' && params.nodes.length > 0) {
                const clickedNodeId = params.nodes[0];
                if (firstNode === null) {
                    firstNode = clickedNodeId;
                } else {
                    if (firstNode !== clickedNodeId) leftEdges.add({ from: firstNode, to: clickedNodeId, arrows: 'to' });
                    firstNode = null;
                }
            } else if (currentTool === 'delete') {
                if (params.nodes.length > 0) leftNodes.remove({ id: params.nodes[0] });
                if (params.edges.length > 0) leftEdges.remove({ id: params.edges[0] });
            }
        });

        leftNodes.on('*', () => updateUndirectedGraphDisplay());
        leftEdges.on('*', () => updateUndirectedGraphDisplay());
        leftNodes.on('add', (e, p) => undirectedNodes.add(leftNodes.get(p.items)));
        leftNodes.on('remove', (e, p) => undirectedNodes.remove(p.items));

        if (pCompInput) pCompInput.addEventListener('change', updateUndirectedGraphDisplay);

        if (importFileInput) {
            importFileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    if (file.name.endsWith('.json')) {
                        importFromJSON(content);
                    } else if (file.name.endsWith('.csv')) {
                        importFromCSV(content);
                    } else {
                        alert('Unsupported file type. Please select a .json or .csv file.');
                    }
                    importFileInput.value = ''; // Reset file input
                };
                reader.readAsText(file);
            });
        }

        const importFromJSON = (jsonStr) => {
            try {
                const data = JSON.parse(jsonStr);
                leftNodes.clear();
                leftEdges.clear();
                leftNodes.add(data.nodes || []);
                leftEdges.add(data.edges || []);
                if (data.rule) {
                    const ruleButton = document.getElementById(id(`rule-${data.rule}-button`));
                    if (ruleButton) ruleButton.click();
                }
                leftNetwork.fit();
            } catch (error) {
                alert("Invalid JSON file.");
                console.error("Error parsing JSON file:", error);
            }
        };

        const importFromCSV = (csvStr) => {
            try {
                const matrix = csvStr.trim().split('\n').map(row => row.split(',').map(val => parseInt(val.trim(), 10)));
                
                // Validation
                const n = matrix.length;
                if (n === 0) throw new Error("CSV is empty.");
                if (!matrix.every(row => row.length === n && row.every(val => !isNaN(val)))) {
                    throw new Error("CSV must be a square matrix of numbers.");
                }

                leftNodes.clear();
                leftEdges.clear();
                nodeCounter = 1;
                const newNodes = [];
                const newEdges = [];
                const radius = leftContainer.clientWidth / 3;

                // Create nodes in a circle (clockwise from positive x-axis)
                for (let i = 0; i < n; i++) {
                    const angle = - (i / n) * 2 * Math.PI; // Negative for clockwise
                    newNodes.push({ id: i, label: `v${i}`, x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
                }

                // Create arcs from matrix
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        if (matrix[i][j] === 1) {
                            newEdges.push({ from: i, to: j, arrows: 'to' });
                        }
                    }
                }

                leftNodes.add(newNodes);
                leftEdges.add(newEdges);
                leftNetwork.fit();

            } catch (error) {
                alert(`Error processing CSV file: ${error.message}`);
                console.error("Error processing CSV file:", error);
            }
        };

        const generateRandomGraph = () => {
            const numNodesStr = prompt("Enter the number of vertices:", "5");
            if (numNodesStr === null) return;
            const numNodes = parseInt(numNodesStr, 10);
            if (isNaN(numNodes) || numNodes <= 0) return alert("Invalid number.");
            leftNodes.clear();
            leftEdges.clear();
            const newNodes = [];
            const radius = leftContainer.clientWidth / 3;
            for (let i = 0; i < numNodes; i++) {
                const angle = (i / numNodes) * 2 * Math.PI;
                newNodes.push({ id: i, label: `v${i+1}`, x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
            }
            leftNodes.add(newNodes);
            leftNetwork.fit();
        };

        const generateSequenceGraph = (n, sequence) => {
            leftNodes.clear();
            leftEdges.clear();
            nodeCounter = 1;
            const newNodes = [];
            const newEdges = [];
            const radius = leftContainer.clientWidth / 3;

            // Create nodes in a circle
            for (let i = 0; i < n; i++) {
                const angle = (i / n) * 2 * Math.PI;
                newNodes.push({ id: i, label: `v${i}`, x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
            }

            // Create arcs based on the sequence
            for (let i = 0; i < n; i++) {
                sequence.forEach(a_j => {
                    const targetNodeId = (i + a_j) % n;
                    newEdges.push({ from: i, to: targetNodeId, arrows: 'to' });
                });
            }

            leftNodes.add(newNodes);
            leftEdges.add(newEdges);
            leftNetwork.fit();
        };

        const generateTournament = () => {
            const input = prompt("Enter partition sizes (e.g., '10' or '3,4,2'):");
            if (input === null) return;
            const partitions = input.split(',').map(s => parseInt(s.trim(), 10));
            if (partitions.some(isNaN) || partitions.some(s => s <= 0)) return alert('Invalid input.');

            leftNodes.clear();
            leftEdges.clear();
            nodeCounter = 1;
            const newNodes = [];
            const newEdges = [];
            const canvasWidth = leftContainer.clientWidth;
            const canvasHeight = leftContainer.clientHeight;
            const mainRadius = Math.min(canvasWidth, canvasHeight) / 2.5;
            let totalNodes = partitions.reduce((a, b) => a + b, 0);
            let currentNodeId = 0;

            if (partitions.length === 1) {
                for (let i = 0; i < partitions[0]; i++) {
                    const angle = (i / totalNodes) * 2 * Math.PI;
                    newNodes.push({ id: currentNodeId++, label: `v${nodeCounter++}`, x: canvasWidth/2 + mainRadius * Math.cos(angle), y: canvasHeight/2 + mainRadius * Math.sin(angle), partition: 0 });
                }
            } else {
                const partitionAngles = partitions.map(size => (size / totalNodes) * 2 * Math.PI);
                let currentAngle = 0;
                partitions.forEach((size, i) => {
                    const partitionCenterAngle = currentAngle + partitionAngles[i] / 2;
                    for (let j = 0; j < size; j++) {
                        const angle = partitionCenterAngle + (j - (size - 1) / 2) * (Math.PI / 18);
                        newNodes.push({ id: currentNodeId++, label: `v${nodeCounter++}`, x: canvasWidth/2 + mainRadius * Math.cos(angle), y: canvasHeight/2 + mainRadius * Math.sin(angle), partition: i });
                    }
                    currentAngle += partitionAngles[i];
                });
            }

            for (let i = 0; i < newNodes.length; i++) {
                for (let j = i + 1; j < newNodes.length; j++) {
                    const nodeA = newNodes[i];
                    const nodeB = newNodes[j];
                    // For standard tournament, connect all pairs.
                    // For multipartite, connect only pairs in different partitions.
                    if (partitions.length === 1 || nodeA.partition !== nodeB.partition) {
                        if (Math.random() < 0.5) {
                            newEdges.push({ from: nodeA.id, to: nodeB.id, arrows: 'to' });
                        } else {
                            newEdges.push({ from: nodeB.id, to: nodeA.id, arrows: 'to' });
                        }
                    }
                }
            }
            leftNodes.add(newNodes);
            leftEdges.add(newEdges);
            leftNetwork.fit();
        };

        // Set initial descriptions
        if (toolDescriptionDisplay) updateToolDescription(currentTool);
        if (ruleDescriptionDisplay) updateRuleDescription(currentUndirectedRule);

        // Set defaults for competitive page
        if (name === 'competitive') {
            // Set the default rule to p-comp for the competitive instance
            currentUndirectedRule = 'p-comp';
            // Update the UI to reflect this default state
            const pCompButton = document.getElementById(id('rule-p-comp-button'));
            if(pCompButton) {
                // De-activate other buttons if any were active by default in HTML
                document.querySelectorAll(`#${id('rule-selection-toolbar')} .rule-button`).forEach(btn => btn.classList.remove('active'));
                pCompButton.classList.add('active');
            }
            if (pCompControls) pCompControls.style.display = 'inline-block';
            updateRuleDescription(currentUndirectedRule);
        }
    };

    // --- Create Instances ---
    createVisualizerInstance(''); // For the main visualizer page
    createVisualizerInstance('competitive'); // For the competitive tool page

});
