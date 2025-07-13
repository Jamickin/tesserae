// tesserae/src/GameEngine.ts
import type {
	Node,
	Edge,
} from "reactflow";

// Import the property types from your App.tsx
interface PlayerProperties {
	health: number;
	speed: number;
	canJump: boolean;
	movementType:
		| "xOnly"
		| "xyAxis";
	spawnX: number;
	spawnY: number;
}

interface EnemyProperties {
	health: number;
	damage: number;
	behavior:
		| "patrol"
		| "chase"
		| "stationary";
	detectionRange?: number;
	patrolDistance?: number;
	patrolDirection?: number;
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
		| "wrap";
	width: number;
	height: number;
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
		| "activate"
		| "destroy";
	value?: number;
}

type NodeProperties =
	| PlayerProperties
	| EnemyProperties
	| TerrainProperties
	| ItemProperties
	| TriggerProperties;

export interface GameState {
	player: {
		x: number;
		y: number;
		health: number;
		maxHealth: number;
		speed: number;
		baseSpeed: number; // Store original speed
		inventory: string[];
		effects: GameEffect[];
		invincible: boolean;
		invincibleUntil: number;
		movementType:
			| "xOnly"
			| "xyAxis";
	};
	gameObjects: Map<
		string,
		GameObject
	>;
	activeConnections: Connection[];
	worldBounds: {
		width: number;
		height: number;
		boundary:
			| "none"
			| "solid"
			| "wrap";
	};
	gameTime: number;
}

export interface GameObject {
	id: string;
	type: string;
	x: number;
	y: number;
	originalX: number;
	originalY: number;
	properties: NodeProperties;
	active: boolean;
	collisionRadius: number;
	lastActivated?: number;
}

export interface Connection {
	id: string;
	source: string;
	target: string;
	type: string;
	effect: string;
	properties: EdgeProperties;
}

export interface GameEffect {
	type: string;
	value: number;
	duration?: number;
	timeRemaining?: number;
}

export class GameEngine {
	private gameState: GameState;

	constructor(
		nodes: Node[],
		edges: Edge[]
	) {
		this.gameState =
			this.initializeGameState(
				nodes,
				edges
			);
	}

	private initializeGameState(
		nodes: Node[],
		edges: Edge[]
	): GameState {
		const playerNode =
			nodes.find(
				(n) =>
					n.type ===
					"player"
			);
		const terrainNode =
			nodes.find(
				(n) =>
					n.type ===
					"terrain"
			);

		const gameObjects =
			new Map<
				string,
				GameObject
			>();

		// Convert nodes to game objects (exclude player)
		nodes.forEach(
			(node) => {
				if (
					node.type !==
						"player" &&
					node.data
						?.properties
				) {
					gameObjects.set(
						node.id,
						{
							id: node.id,
							type:
								node.type ||
								"unknown",
							x: node
								.position
								.x,
							y: node
								.position
								.y,
							originalX:
								node
									.position
									.x,
							originalY:
								node
									.position
									.y,
							properties:
								{
									...node
										.data
										.properties,
								} as NodeProperties,
							active:
								true,
							collisionRadius:
								this.getCollisionRadius(
									node.type ||
										"unknown"
								),
						}
					);
				}
			}
		);

		// Convert edges to connections with proper type safety
		const activeConnections: Connection[] =
			edges
				.filter(
					(edge) =>
						edge.data
							?.properties
				)
				.map((edge) => ({
					id: edge.id,
					source:
						edge.source,
					target:
						edge.target,
					type:
						edge.data
							?.properties
							?.type ||
						"default",
					effect:
						edge.data
							?.properties
							?.effect ||
						"none",
					properties: {
						...edge.data
							.properties,
					} as EdgeProperties,
				}));

		// Get player properties with defaults
		const playerProps =
			playerNode?.data
				?.properties as
				| PlayerProperties
				| undefined;
		const terrainProps =
			terrainNode?.data
				?.properties as
				| TerrainProperties
				| undefined;

		const baseSpeed =
			playerProps?.speed ||
			5;

		return {
			player: {
				x:
					playerProps?.spawnX ||
					400,
				y:
					playerProps?.spawnY ||
					300,
				health:
					playerProps?.health ||
					100,
				maxHealth:
					playerProps?.health ||
					100,
				speed: baseSpeed,
				baseSpeed:
					baseSpeed,
				inventory: [],
				effects: [],
				invincible: false,
				invincibleUntil: 0,
				movementType:
					playerProps?.movementType ||
					"xyAxis",
			},
			gameObjects,
			activeConnections,
			worldBounds: {
				width:
					terrainProps?.width ||
					800,
				height:
					terrainProps?.height ||
					600,
				boundary:
					terrainProps?.worldBoundary ||
					"solid",
			},
			gameTime: 0,
		};
	}

	private getCollisionRadius(
		type: string
	): number {
		const radii: Record<
			string,
			number
		> = {
			enemy: 30,
			item: 20,
			trigger: 40,
			terrain: 50,
		};
		return (
			radii[type] || 25
		);
	}

	public update(
		deltaTime: number,
		keysPressed: Record<
			string,
			boolean
		>
	) {
		this.gameState.gameTime +=
			deltaTime;

		this.updatePlayerMovement(
			keysPressed,
			deltaTime
		);
		this.updatePlayerEffects(
			deltaTime
		);
		this.updateEnemyAI(
			deltaTime
		);
		this.checkCollisions();
		this.updateInvincibility();
	}

	private updatePlayerMovement(
		keysPressed: Record<
			string,
			boolean
		>,
		deltaTime: number
	) {
		let dx = 0,
			dy = 0;

		// Frame-rate independent movement
		const frameAdjustedSpeed =
			this.gameState.player
				.speed *
			(deltaTime / 16.67); // 16.67ms = 60fps baseline

		if (keysPressed["a"])
			dx -=
				frameAdjustedSpeed;
		if (keysPressed["d"])
			dx +=
				frameAdjustedSpeed;

		// Only allow Y movement if movementType allows it
		if (
			this.gameState.player
				.movementType ===
			"xyAxis"
		) {
			if (keysPressed["w"])
				dy -=
					frameAdjustedSpeed;
			if (keysPressed["s"])
				dy +=
					frameAdjustedSpeed;
		}

		// Apply movement with boundary checking
		let newX =
			this.gameState.player
				.x + dx;
		let newY =
			this.gameState.player
				.y + dy;

		// Handle world boundaries
		switch (
			this.gameState
				.worldBounds
				.boundary
		) {
			case "solid":
				newX = Math.max(
					20,
					Math.min(
						newX,
						this
							.gameState
							.worldBounds
							.width -
							20
					)
				);
				newY = Math.max(
					20,
					Math.min(
						newY,
						this
							.gameState
							.worldBounds
							.height -
							20
					)
				);
				break;
			case "wrap":
				if (newX < 0)
					newX =
						this
							.gameState
							.worldBounds
							.width;
				if (
					newX >
					this.gameState
						.worldBounds
						.width
				)
					newX = 0;
				if (newY < 0)
					newY =
						this
							.gameState
							.worldBounds
							.height;
				if (
					newY >
					this.gameState
						.worldBounds
						.height
				)
					newY = 0;
				break;
			case "none":
				// No boundaries
				break;
		}

		this.gameState.player.x =
			newX;
		this.gameState.player.y =
			newY;
	}

	private updatePlayerEffects(
		deltaTime: number
	) {
		// Update effect timers
		this.gameState.player.effects =
			this.gameState.player.effects.filter(
				(effect) => {
					if (
						effect.timeRemaining !==
						undefined
					) {
						effect.timeRemaining -=
							deltaTime;
						return (
							effect.timeRemaining >
							0
						);
					}
					return true;
				}
			);

		// Calculate speed effects
		const speedEffects =
			this.gameState.player.effects.filter(
				(e) =>
					e.type ===
					"speed"
			);
		let totalSpeedBonus = 0;
		speedEffects.forEach(
			(effect) => {
				totalSpeedBonus +=
					effect.value;
			}
		);

		// Update player speed (reset to base speed plus bonuses)
		this.gameState.player.speed =
			this.gameState.player
				.baseSpeed +
			totalSpeedBonus;
	}

	private updateEnemyAI(
		deltaTime: number
	) {
		this.gameState.gameObjects.forEach(
			(obj) => {
				if (
					obj.type ===
						"enemy" &&
					obj.active
				) {
					const enemyProps =
						obj.properties as EnemyProperties;
					switch (
						enemyProps.behavior
					) {
						case "chase":
							this.chasePlayer(
								obj,
								deltaTime
							);
							break;
						case "patrol":
							this.patrolBehavior(
								obj,
								deltaTime
							);
							break;
						case "stationary":
							// Do nothing
							break;
					}
				}
			}
		);
	}

	private chasePlayer(
		enemy: GameObject,
		deltaTime: number
	) {
		const enemyProps =
			enemy.properties as EnemyProperties;
		const dx =
			this.gameState.player
				.x - enemy.x;
		const dy =
			this.gameState.player
				.y - enemy.y;
		const distance =
			Math.sqrt(
				dx * dx + dy * dy
			);

		const detectionRange =
			enemyProps.detectionRange ||
			150;

		if (
			distance > 5 &&
			distance <
				detectionRange
		) {
			const speed = 2; // Default enemy speed (pixels per millisecond)
			const frameAdjustedSpeed =
				speed *
				(deltaTime /
					16.67); // 16.67ms = 60fps baseline
			enemy.x +=
				(dx / distance) *
				frameAdjustedSpeed;
			enemy.y +=
				(dy / distance) *
				frameAdjustedSpeed;
		}
	}

	private patrolBehavior(
		enemy: GameObject,
		deltaTime: number
	) {
		const enemyProps =
			enemy.properties as EnemyProperties;

		if (
			!enemyProps.patrolDirection
		) {
			enemyProps.patrolDirection = 1;
		}

		const speed = 1; // Default patrol speed (pixels per millisecond)
		const patrolDistance =
			enemyProps.patrolDistance ||
			100;

		// Make movement frame-rate independent using deltaTime
		enemy.x +=
			enemyProps.patrolDirection *
			speed *
			(deltaTime / 16.67); // 16.67ms = 60fps baseline

		if (
			Math.abs(
				enemy.x -
					enemy.originalX
			) > patrolDistance
		) {
			enemyProps.patrolDirection *=
				-1;
		}
	}

	private checkCollisions() {
		const playerX =
			this.gameState.player
				.x;
		const playerY =
			this.gameState.player
				.y;
		const playerRadius = 20;

		this.gameState.gameObjects.forEach(
			(obj) => {
				if (!obj.active)
					return;

				const distance =
					Math.sqrt(
						Math.pow(
							playerX -
								obj.x,
							2
						) +
							Math.pow(
								playerY -
									obj.y,
								2
							)
					);

				// Check for collision
				if (
					distance <
					playerRadius +
						obj.collisionRadius
				) {
					this.handleCollision(
						obj
					);
				}

				// Check for proximity triggers
				if (
					obj.type ===
					"trigger"
				) {
					const triggerProps =
						obj.properties as TriggerProperties;
					if (
						triggerProps.activation ===
						"proximity"
					) {
						const triggerRadius =
							triggerProps.radius ||
							50;
						if (
							distance <
							triggerRadius
						) {
							this.handleProximityTrigger(
								obj
							);
						}
					}
				}
			}
		);
	}

	private handleCollision(
		obj: GameObject
	) {
		// Prevent multiple activations per frame
		const now = Date.now();
		if (
			obj.lastActivated &&
			now -
				obj.lastActivated <
				100
		) {
			return;
		}
		obj.lastActivated = now;

		// Find and execute connections
		this.executeConnectionsForObject(
			obj.id,
			"collision"
		);

		// Handle direct object effects
		switch (obj.type) {
			case "item":
				this.handleItemPickup(
					obj
				);
				break;
			case "enemy":
				this.handleEnemyCollision(
					obj
				);
				break;
		}
	}

	private handleProximityTrigger(
		trigger: GameObject
	) {
		const triggerProps =
			trigger.properties as TriggerProperties;

		// Prevent spam activation
		const now = Date.now();
		if (
			trigger.lastActivated &&
			now -
				trigger.lastActivated <
				1000
		) {
			return;
		}
		trigger.lastActivated =
			now;

		this.executeConnectionsForObject(
			trigger.id,
			"proximity"
		);

		if (
			triggerProps.oneTime
		) {
			trigger.active =
				false;
		}
	}

	private executeConnectionsForObject(
		objectId: string,
		triggerType: string
	) {
		const relevantConnections =
			this.gameState.activeConnections.filter(
				(conn) =>
					conn.source ===
						objectId ||
					conn.target ===
						objectId
			);

		relevantConnections.forEach(
			(conn) => {
				// Check if connection type matches trigger
				if (
					(conn.type ===
						"collision" &&
						triggerType ===
							"collision") ||
					(conn.type ===
						"trigger" &&
						triggerType ===
							"proximity") ||
					conn.type ===
						"default"
				) {
					this.executeConnection(
						conn
					);
				}
			}
		);
	}

	private executeConnection(
		connection: Connection
	) {
		switch (
			connection.effect
		) {
			case "damage":
				this.damagePlayer(
					connection
						.properties
						.value || 10
				);
				break;
			case "heal":
				this.healPlayer(
					connection
						.properties
						.value || 20
				);
				break;
			case "teleport":
				this.teleportPlayer(
					connection
				);
				break;
			case "activate":
				this.toggleTarget(
					connection.target
				);
				break;
			case "destroy":
				this.destroyTarget(
					connection.target
				);
				break;
		}
	}

	private damagePlayer(
		damage: number
	) {
		if (
			this.gameState.player
				.invincible
		)
			return;

		this.gameState.player.health =
			Math.max(
				0,
				this.gameState
					.player
					.health -
					damage
			);

		// Make player temporarily invincible
		this.gameState.player.invincible =
			true;
		this.gameState.player.invincibleUntil =
			Date.now() + 1000; // 1 second
	}

	private healPlayer(
		healing: number
	) {
		this.gameState.player.health =
			Math.min(
				this.gameState
					.player
					.maxHealth,
				this.gameState
					.player
					.health +
					healing
			);
	}

	private teleportPlayer(
		connection: Connection
	) {
		const target =
			this.gameState.gameObjects.get(
				connection.target
			);
		if (target) {
			this.gameState.player.x =
				target.x;
			this.gameState.player.y =
				target.y;
		}
	}

	private toggleTarget(
		targetId: string
	) {
		const target =
			this.gameState.gameObjects.get(
				targetId
			);
		if (target) {
			target.active =
				!target.active;
		}
	}

	private destroyTarget(
		targetId: string
	) {
		const target =
			this.gameState.gameObjects.get(
				targetId
			);
		if (target) {
			target.active =
				false;
		}
	}

	private handleItemPickup(
		item: GameObject
	) {
		const itemProps =
			item.properties as ItemProperties;
		if (
			!itemProps.pickupable
		)
			return;

		// Add to inventory
		this.gameState.player.inventory.push(
			item.id
		);

		// Apply item effect
		switch (
			itemProps.effect
		) {
			case "health":
				this.healPlayer(
					itemProps.value ||
						20
				);
				break;
			case "speed":
				this.gameState.player.effects.push(
					{
						type: "speed",
						value:
							itemProps.value ||
							2,
						duration: 5000,
						timeRemaining: 5000,
					}
				);
				break;
			case "invincible":
				this.gameState.player.invincible =
					true;
				this.gameState.player.invincibleUntil =
					Date.now() +
					(itemProps.value ||
						3000);
				break;
		}

		// Remove item
		item.active = false;
	}

	private handleEnemyCollision(
		enemy: GameObject
	) {
		const enemyProps =
			enemy.properties as EnemyProperties;
		this.damagePlayer(
			enemyProps.damage ||
				10
		);
	}

	private updateInvincibility() {
		if (
			this.gameState.player
				.invincible &&
			Date.now() >
				this.gameState
					.player
					.invincibleUntil
		) {
			this.gameState.player.invincible =
				false;
		}
	}

	public getGameState(): GameState {
		return this.gameState;
	}

	public getPlayer() {
		return this.gameState
			.player;
	}

	public getGameObjects() {
		return Array.from(
			this.gameState.gameObjects.values()
		);
	}

	public getActiveGameObjects() {
		return Array.from(
			this.gameState.gameObjects.values()
		).filter(
			(obj) => obj.active
		);
	}

	public reset(
		nodes: Node[],
		edges: Edge[]
	) {
		this.gameState =
			this.initializeGameState(
				nodes,
				edges
			);
	}

	public isGameOver(): boolean {
		return (
			this.gameState.player
				.health <= 0
		);
	}
}
