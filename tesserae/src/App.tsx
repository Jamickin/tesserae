import {
	useState,
	useRef,
	useCallback,
	useEffect,
} from "react";
import ReactFlow, {
	ReactFlowProvider,
	addEdge,
	useNodesState,
	useEdgesState,
	Controls,
	type Connection,
	type Node,
	Background,
	type ReactFlowInstance,
	BackgroundVariant,
	type Edge,
	MarkerType,
	Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import PlayerNode from "./components/PlayerNode";
import EnemyNode from "./components/EnemyNode";
import TerrainNode from "./components/TerrainNode";
import ItemNode from "./components/ItemNode";
import CustomEdge from "./components/CustomEdge";
import PropertiesPanel from "./components/PropertiesPanel";
import TriggerNode from "./components/TriggerNode";

// Define property types for each node type
interface PlayerProperties {
	health: number;
	speed: number;
	canJump: boolean;
	movementType:
		| "xOnly"
		| "xyAxis"; // New property
	spawnX: number; // New property
	spawnY: number; // New property
}

interface EnemyProperties {
	health: number;
	damage: number;
	behavior:
		| "patrol"
		| "chase"
		| "stationary";
}

interface TerrainProperties {
	type:
		| "ground"
		| "platform"
		| "water"
		| "lava";
	solid: boolean;
	friction: number;
	worldBoundary:
		| "none"
		| "solid"
		| "wrap"; // New property
	width: number; // World width
	height: number; // World height
}

interface ItemProperties {
	pickupable: boolean;
	effect:
		| "none"
		| "health"
		| "speed"
		| "jump"
		| "invincible";
	value: number;
}

interface TriggerProperties {
	activation:
		| "proximity"
		| "interact"
		| "timed";
	oneTime: boolean;
	radius: number;
}

// Define edge property types
interface EdgeProperties {
	type:
		| "default"
		| "trigger"
		| "collision"
		| "pickup";
	effect:
		| "none"
		| "damage"
		| "heal"
		| "teleport"
		| "activate";
}

// Union type for all node properties
type NodeProperties =
	| PlayerProperties
	| EnemyProperties
	| TerrainProperties
	| ItemProperties
	| TriggerProperties;
// Register our custom node types
const nodeTypes = {
	player: PlayerNode,
	enemy: EnemyNode,
	terrain: TerrainNode,
	item: ItemNode,
	trigger: TriggerNode,
};

// Register our custom edge types
const edgeTypes = {
	custom: CustomEdge,
};

// Define default properties for each node type
const getDefaultPropertiesForType =
	(
		type: string
	): NodeProperties => {
		switch (type) {
			case "player":
				return {
					health: 100,
					speed: 5,
					canJump: true,
					movementType:
						"xyAxis", // Default to full movement
					spawnX: 400, // Default to center of screen
					spawnY: 300, // Default to center of screen
				} as PlayerProperties;
			case "enemy":
				return {
					health: 50,
					damage: 10,
					behavior:
						"patrol",
				} as EnemyProperties;
			case "terrain":
				return {
					type: "ground",
					solid: true,
					friction: 0.8,
					worldBoundary:
						"solid", // Default to solid boundaries
					width: 800, // Default width
					height: 600, // Default height
				} as TerrainProperties;
			case "item":
				return {
					pickupable:
						true,
					effect: "none",
					value: 0,
				} as ItemProperties;
			case "trigger":
				return {
					activation:
						"proximity",
					oneTime: false,
					radius: 3,
				} as TriggerProperties;
			default:
				return {
					activation:
						"proximity",
					oneTime: false,
					radius: 3,
				} as TriggerProperties; // Default to trigger properties
		}
	};

// Define the sidebar where we'll keep our game pieces
const Sidebar = () => {
	const onDragStart = (
		event: React.DragEvent,
		nodeType: string
	) => {
		event.dataTransfer.setData(
			"application/reactflow",
			nodeType
		);
		event.dataTransfer.effectAllowed =
			"move";
	};

	return (
		<aside>
			<div className="description">
				Drag these onto
				the canvas to
				build your game!
			</div>
			<div
				className="dndnode player"
				onDragStart={(
					event
				) =>
					onDragStart(
						event,
						"player"
					)
				}
				draggable
			>
				Player
			</div>
			<div
				className="dndnode enemy"
				onDragStart={(
					event
				) =>
					onDragStart(
						event,
						"enemy"
					)
				}
				draggable
			>
				Enemy
			</div>
			<div
				className="dndnode terrain"
				onDragStart={(
					event
				) =>
					onDragStart(
						event,
						"terrain"
					)
				}
				draggable
			>
				Terrain
			</div>
			<div
				className="dndnode item"
				onDragStart={(
					event
				) =>
					onDragStart(
						event,
						"item"
					)
				}
				draggable
			>
				Item
			</div>
			<div
				className="dndnode trigger"
				onDragStart={(
					event
				) =>
					onDragStart(
						event,
						"trigger"
					)
				}
				draggable
			>
				Trigger
			</div>
		</aside>
	);
};

const GameDisplay: React.FC<{
	nodes: Node[];
	edges: Edge[];
	onClose: () => void;
}> = ({
	nodes,
	edges,
	onClose,
}) => {
	// Find the player and terrain nodes
	const playerNode =
		nodes.find(
			(node) =>
				node.type ===
				"player"
		);
	const terrainNodes =
		nodes.filter(
			(node) =>
				node.type ===
				"terrain"
		);

	// Get world boundary settings from the first terrain node, or use defaults
	const firstTerrainNode =
		terrainNodes[0];
	const worldBoundary =
		firstTerrainNode?.data
			?.properties
			?.worldBoundary ||
		"none";
	const worldWidth =
		firstTerrainNode?.data
			?.properties
			?.width || 800;
	const worldHeight =
		firstTerrainNode?.data
			?.properties
			?.height || 600;

	// Get player spawn point or use defaults
	const spawnX =
		playerNode?.data
			?.properties
			?.spawnX ||
		worldWidth / 2;
	const spawnY =
		playerNode?.data
			?.properties
			?.spawnY ||
		worldHeight / 2;

	// Player position state (starting at spawn point)
	const [
		playerPosition,
		setPlayerPosition,
	] = useState({
		x: spawnX,
		y: spawnY,
	});

	// Track which keys are currently pressed
	const [
		keysPressed,
		setKeysPressed,
	] = useState<
		Record<string, boolean>
	>({});

	// Get player properties
	const playerSpeed =
		playerNode?.data
			?.properties
			?.speed || 5;
	const movementType =
		playerNode?.data
			?.properties
			?.movementType ||
		"xyAxis";

	// Handle key presses for movement
	useEffect(() => {
		const handleKeyDown = (
			e: KeyboardEvent
		) => {
			if (
				[
					"w",
					"a",
					"s",
					"d",
				].includes(
					e.key.toLowerCase()
				)
			) {
				setKeysPressed(
					(prev) => ({
						...prev,
						[e.key.toLowerCase()]:
							true,
					})
				);
				e.preventDefault(); // Prevent scrolling with WASD
			}
		};

		const handleKeyUp = (
			e: KeyboardEvent
		) => {
			if (
				[
					"w",
					"a",
					"s",
					"d",
				].includes(
					e.key.toLowerCase()
				)
			) {
				setKeysPressed(
					(prev) => ({
						...prev,
						[e.key.toLowerCase()]:
							false,
					})
				);
			}
		};

		window.addEventListener(
			"keydown",
			handleKeyDown
		);
		window.addEventListener(
			"keyup",
			handleKeyUp
		);

		return () => {
			window.removeEventListener(
				"keydown",
				handleKeyDown
			);
			window.removeEventListener(
				"keyup",
				handleKeyUp
			);
		};
	}, []);

	// Move the player based on keys pressed
	useEffect(() => {
		if (!playerNode) return;

		const movePlayer =
			() => {
				let dx = 0;
				let dy = 0;

				// Handle horizontal movement
				if (
					keysPressed[
						"a"
					]
				)
					dx -=
						playerSpeed;
				if (
					keysPressed[
						"d"
					]
				)
					dx +=
						playerSpeed;

				// Handle vertical movement (only if xyAxis mode is enabled)
				if (
					movementType ===
					"xyAxis"
				) {
					if (
						keysPressed[
							"w"
						]
					)
						dy -=
							playerSpeed;
					if (
						keysPressed[
							"s"
						]
					)
						dy +=
							playerSpeed;
				}

				if (
					dx !== 0 ||
					dy !== 0
				) {
					setPlayerPosition(
						(prev) => {
							let newX =
								prev.x +
								dx;
							let newY =
								prev.y +
								dy;

							// Handle world boundaries
							if (
								worldBoundary ===
								"solid"
							) {
								// Stop at the edges
								newX =
									Math.max(
										20,
										Math.min(
											newX,
											worldWidth -
												20
										)
									); // 20px buffer for player size
								newY =
									Math.max(
										20,
										Math.min(
											newY,
											worldHeight -
												20
										)
									);
							} else if (
								worldBoundary ===
								"wrap"
							) {
								// Wrap around
								if (
									newX <
									0
								)
									newX =
										worldWidth;
								if (
									newX >
									worldWidth
								)
									newX = 0;
								if (
									newY <
									0
								)
									newY =
										worldHeight;
								if (
									newY >
									worldHeight
								)
									newY = 0;
							}

							return {
								x: newX,
								y: newY,
							};
						}
					);
				}
			};

		const animationId =
			requestAnimationFrame(
				movePlayer
			);
		return () =>
			cancelAnimationFrame(
				animationId
			);
	}, [
		keysPressed,
		playerNode,
		playerSpeed,
		movementType,
		worldBoundary,
		worldWidth,
		worldHeight,
	]);

	return (
		<div className="game-display">
			<div className="game-header">
				<h2>
					Game Preview
				</h2>
				<div className="game-controls">
					<p>
						Controls:
						WASD to move
					</p>
					<button
						onClick={
							onClose
						}
					>
						Back to
						Editor
					</button>
				</div>
			</div>
			<div
				className="game-canvas"
				style={{
					width: `${worldWidth}px`,
					height: `${worldHeight}px`,
					position:
						"relative",
					overflow:
						"hidden",
					margin:
						"0 auto",
					border:
						worldBoundary ===
						"solid"
							? "2px solid red"
							: "none",
					background:
						"#222",
				}}
			>
				{/* Render terrain */}
				{terrainNodes.map(
					(node) => {
						const terrainType =
							node.data
								?.properties
								?.type ||
							"ground";

						let terrainColor =
							"#8B4513"; // Default brown
						switch (
							terrainType
						) {
							case "ground":
								terrainColor =
									"#8B4513";
								break; // Brown
							case "platform":
								terrainColor =
									"#555555";
								break; // Gray
							case "water":
								terrainColor =
									"#0000FF";
								break; // Blue
							case "lava":
								terrainColor =
									"#FF4500";
								break; // Red-orange
						}

						return (
							<div
								key={
									node.id
								}
								className="game-terrain"
								style={{
									position:
										"absolute",
									left: `${
										node
											.position
											.x -
										50
									}px`,
									top: `${
										node
											.position
											.y -
										50
									}px`,
									width: "100px",
									height:
										"100px",
									backgroundColor:
										terrainColor,
									borderRadius:
										terrainType ===
										"platform"
											? "0"
											: "5px",
								}}
							/>
						);
					}
				)}

				{/* Render other non-terrain, non-player nodes */}
				{nodes
					.filter(
						(node) =>
							node.type !==
								"player" &&
							node.type !==
								"terrain"
					)
					.map(
						(node) => {
							let icon =
								"❓";
							switch (
								node.type
							) {
								case "enemy":
									icon =
										"👹";
									break;
								case "item":
									icon =
										"🎁";
									break;
								case "trigger":
									icon =
										"⚡";
									break;
							}

							return (
								<div
									key={
										node.id
									}
									className={`game-node game-node-${node.type}`}
									style={{
										position:
											"absolute",
										left: `${node.position.x}px`,
										top: `${node.position.y}px`,
										transform:
											"translate(-50%, -50%)",
									}}
								>
									{
										icon
									}{" "}
									{
										node
											.data
											.label
									}
								</div>
							);
						}
					)}

				{/* Render player at calculated position */}
				{playerNode && (
					<div
						key={
							playerNode.id
						}
						className="game-node game-node-player"
						style={{
							position:
								"absolute",
							left: `${playerPosition.x}px`,
							top: `${playerPosition.y}px`,
							transform:
								"translate(-50%, -50%)",
							transition:
								"top 0.1s, left 0.1s", // Smooth movement
						}}
					>
						👤{" "}
						{
							playerNode
								.data
								.label
						}
					</div>
				)}

				{/* Add world boundary indicator if no terrain nodes */}
				{terrainNodes.length ===
					0 && (
					<div className="no-terrain-message">
						No terrain
						defined.
						Player can
						move freely.
					</div>
				)}
			</div>
		</div>
	);
};
// Our main app
function App() {
	const reactFlowWrapper =
		useRef<HTMLDivElement>(
			null
		);
	const [
		nodes,
		setNodes,
		onNodesChange,
	] = useNodesState([]);
	const [
		edges,
		setEdges,
		onEdgesChange,
	] = useEdgesState([]);
	const [
		reactFlowInstance,
		setReactFlowInstance,
	] =
		useState<ReactFlowInstance | null>(
			null
		);
	const [
		selectedNode,
		setSelectedNode,
	] = useState<Node | null>(
		null
	);
	const [
		selectedEdge,
		setSelectedEdge,
	] = useState<Edge | null>(
		null
	);
	const [
		isPlaying,
		setIsPlaying,
	] = useState(false);

	// When we connect two nodes
	const onConnect =
		useCallback(
			(
				params: Connection
			) => {
				// Create a new edge with default properties
				const newEdge = {
					...params,
					id: `e${params.source}-${params.target}`,
					type: "custom",
					markerEnd: {
						type: MarkerType.ArrowClosed,
					},
					data: {
						properties:
							{
								type: "default",
								effect:
									"none",
							} as EdgeProperties,
					},
				};

				setEdges((eds) =>
					addEdge(
						newEdge,
						eds
					)
				);
			},
			[setEdges]
		);

	// Handle node click to show properties
	const onNodeClick =
		useCallback(
			(
				event: React.MouseEvent,
				node: Node
			) => {
				setSelectedNode(
					node
				);
				setSelectedEdge(
					null
				);
			},
			[]
		);

	// Handle edge click to show properties
	const onEdgeClick =
		useCallback(
			(
				event: React.MouseEvent,
				edge: Edge
			) => {
				setSelectedEdge(
					edge
				);
				setSelectedNode(
					null
				);
			},
			[]
		);

	// Handle background click to deselect
	const onPaneClick =
		useCallback(() => {
			setSelectedNode(
				null
			);
			setSelectedEdge(
				null
			);
		}, []);

	// When we drag over the canvas
	const onDragOver =
		useCallback(
			(
				event: React.DragEvent
			) => {
				event.preventDefault();
				event.dataTransfer.dropEffect =
					"move";
			},
			[]
		);

	// When we drop a node onto the canvas
	const onDrop = useCallback(
		(
			event: React.DragEvent
		) => {
			event.preventDefault();

			const reactFlowBounds =
				reactFlowWrapper.current?.getBoundingClientRect();
			const type =
				event.dataTransfer.getData(
					"application/reactflow"
				);

			// check if the dropped element is valid
			if (
				typeof type ===
					"undefined" ||
				!type ||
				!reactFlowInstance ||
				!reactFlowBounds
			) {
				return;
			}

			const position =
				reactFlowInstance.project(
					{
						x:
							event.clientX -
							reactFlowBounds.left,
						y:
							event.clientY -
							reactFlowBounds.top,
					}
				);

			// create a new node with default properties for its type
			const newNode: Node =
				{
					id: `${type}-${
						nodes.length +
						1
					}`,
					type,
					position,
					data: {
						label: `${
							type
								.charAt(
									0
								)
								.toUpperCase() +
							type.slice(
								1
							)
						} ${
							nodes.length +
							1
						}`,
						properties:
							getDefaultPropertiesForType(
								type
							),
					},
				};

			setNodes((nds) =>
				nds.concat(
					newNode
				)
			);
		},
		[
			reactFlowInstance,
			nodes,
			setNodes,
		]
	);

	// Handle node property changes
	// Handle node property changes
	const handleNodePropertyChange =
		useCallback(
			(
				nodeId: string,
				property: string,
				value: unknown
			) => {
				setNodes((nds) =>
					nds.map(
						(node) => {
							if (
								node.id ===
								nodeId
							) {
								return {
									...node,
									data: {
										...node.data,
										properties:
											{
												...node
													.data
													.properties,
												[property]:
													value,
											},
									},
								};
							}
							return node;
						}
					)
				);
			},
			[setNodes]
		);

	// Handle edge property changes
	const handleEdgePropertyChange =
		useCallback(
			(
				edgeId: string,
				property: string,
				value: unknown
			) => {
				setEdges((eds) =>
					eds.map(
						(edge) => {
							if (
								edge.id ===
								edgeId
							) {
								return {
									...edge,
									data: {
										...edge.data,
										properties:
											{
												...edge
													.data
													?.properties,
												[property]:
													value,
											},
									},
								};
							}
							return edge;
						}
					)
				);
			},
			[setEdges]
		);

	// Toggle play mode
	const togglePlayMode =
		() => {
			setIsPlaying(
				!isPlaying
			);
		};

	// Add some additional styles
	const additionalStyles = `
    .game-display {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #333;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }
    
    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #222;
      color: white;
    }
    
    .game-canvas {
      flex: 1;
      position: relative;
      background: #111;
      overflow: hidden;
    }
    
    .game-node {
      position: absolute;
      padding: 10px;
      transform: translate(-50%, -50%);
      color: white;
      border-radius: 4px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .game-node-player {
      background: #ff0072;
    }
    
    .game-node-enemy {
      background: #ff8800;
    }
    
    .game-node-terrain {
      background: #00c49f;
    }
    
    .game-node-item {
      background: #0041d0;
    }
    
    .game-node-trigger {
      background: #8339c8;
    }
    
    .properties-panel {
      padding: 15px;
      background: #f7f7f7;
      border-left: 1px solid #ddd;
      overflow-y: auto;
      height: 100%;
    }
    
    .properties-panel h3 {
      margin-top: 0;
      margin-bottom: 15px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    
    .property-group {
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
    }
    
    .property-group label {
      font-weight: bold;
      margin-bottom: 3px;
      font-size: 12px;
    }
    
    .play-button {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 5;
      padding: 8px 16px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .play-button:hover {
      background: #45a049;
    }
    
    .dndnode.trigger {
      border-color: #8339c8;
      background: #f3e6ff;
    }
    
    .custom-node.trigger {
      background-color: #8339c8;
    }
  `;

	return (
		<>
			<style>
				{additionalStyles}
			</style>

			{isPlaying ? (
				<GameDisplay
					nodes={nodes}
					edges={edges}
					onClose={
						togglePlayMode
					}
				/>
			) : (
				<div className="dndflow">
					<ReactFlowProvider>
						<button
							className="play-button"
							onClick={
								togglePlayMode
							}
						>
							▶️ Play
							Game
						</button>
						<Sidebar />
						<div
							className="reactflow-wrapper"
							ref={
								reactFlowWrapper
							}
						>
							<ReactFlow
								nodes={
									nodes
								}
								edges={
									edges
								}
								onNodesChange={
									onNodesChange
								}
								onEdgesChange={
									onEdgesChange
								}
								onConnect={
									onConnect
								}
								onInit={(
									instance: ReactFlowInstance
								) =>
									setReactFlowInstance(
										instance
									)
								}
								onDrop={
									onDrop
								}
								onDragOver={
									onDragOver
								}
								onNodeClick={
									onNodeClick
								}
								onEdgeClick={
									onEdgeClick
								}
								onPaneClick={
									onPaneClick
								}
								nodeTypes={
									nodeTypes
								}
								edgeTypes={
									edgeTypes
								}
								fitView
							>
								<Controls />
								<Background
									variant={
										BackgroundVariant.Dots
									}
									gap={
										12
									}
									size={
										1
									}
								/>
								<Panel position="bottom-center">
									<div className="instructions">
										Drag
										nodes
										from
										the
										sidebar
										onto
										the
										canvas.
										Connect
										nodes
										by
										dragging
										between
										their
										handles.
									</div>
								</Panel>
							</ReactFlow>
						</div>
						<PropertiesPanel
							selectedNode={
								selectedNode
							}
							selectedEdge={
								selectedEdge
							}
							onNodePropertyChange={
								handleNodePropertyChange
							}
							onEdgePropertyChange={
								handleEdgePropertyChange
							}
						/>
					</ReactFlowProvider>
				</div>
			)}
		</>
	);
}

export default App;
