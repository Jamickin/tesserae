// Add this import at the top of your App.tsx
import { GameEngine } from "./GameEngine";
import { useState, useEffect } from "react";

// Define GameNode and GameEdge types to avoid conflict with React Flow's Node type
type GameNode = {
	id: string;
	type: string;
	x: number;
	y: number;
	properties?: Record<string, unknown>;
	active?: boolean;
};

type GameEdge = {
	id: string;
	source: string;
	target: string;
	properties?: Record<string, unknown>;
};

const GameDisplay: React.FC<{
	nodes: GameNode[];
	edges: GameEdge[];
	onClose: () => void;
}> = ({
	nodes,
	edges,
	onClose,
}) => {
	const [gameEngine] =
		useState(
			() =>
				new GameEngine(
					nodes,
					edges
				)
		);
	const [
		gameState,
		setGameState,
	] = useState(() =>
		gameEngine.getGameState()
	);
	const [
		keysPressed,
		setKeysPressed,
	] = useState<
		Record<string, boolean>
	>({});

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
				e.preventDefault();
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

	// Game loop
	useEffect(() => {
		let lastTime =
			performance.now();
		let animationId: number;

		const gameLoop = (
			currentTime: number
		) => {
			const deltaTime =
				currentTime -
				lastTime;
			lastTime =
				currentTime;

			// Update game engine
			gameEngine.update(
				deltaTime,
				keysPressed
			);

			// Update React state
			setGameState({
				...gameEngine.getGameState(),
			});

			// Check for game over
			if (
				gameEngine.isGameOver()
			) {
				alert(
					"Game Over! Player health reached 0."
				);
				gameEngine.reset(
					nodes,
					edges
				);
			}

			animationId =
				requestAnimationFrame(
					gameLoop
				);
		};

		animationId =
			requestAnimationFrame(
				gameLoop
			);

		return () => {
			cancelAnimationFrame(
				animationId
			);
		};
	}, [
		keysPressed,
		gameEngine,
		nodes,
		edges,
	]);

	// Get active game objects for rendering
	const activeGameObjects =
		gameEngine.getActiveGameObjects();
	const player =
		gameEngine.getPlayer();
	const worldBounds =
		gameState.worldBounds;

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
					<p>
						Health:{" "}
						{
							player.health
						}
						/
						{
							player.maxHealth
						}
					</p>
					<p>
						Speed:{" "}
						{
							player.speed
						}
					</p>
					<p>
						Inventory:{" "}
						{
							player
								.inventory
								.length
						}{" "}
						items
					</p>
					{player.invincible && (
						<p
							style={{
								color: "yellow",
							}}
						>
							INVINCIBLE!
						</p>
					)}
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
					width: `${worldBounds.width}px`,
					height: `${worldBounds.height}px`,
					position:
						"relative",
					overflow:
						"hidden",
					margin:
						"0 auto",
					border:
						worldBounds.boundary ===
						"solid"
							? "2px solid red"
							: "none",
					background:
						"#222",
				}}
			>
				{/* Render terrain objects */}
				{activeGameObjects
					.filter(
						(obj) =>
							obj.type ===
							"terrain"
					)
					.map((obj) => {
						const terrainProps =
							obj.properties as any;
						let terrainColor =
							"#8B4513"; // Default brown

						switch (
							terrainProps.type
						) {
							case "ground":
								terrainColor =
									"#8B4513";
								break;
							case "platform":
								terrainColor =
									"#555555";
								break;
							case "water":
								terrainColor =
									"#0000FF";
								break;
							case "lava":
								terrainColor =
									"#FF4500";
								break;
						}

						return (
							<div
								key={
									obj.id
								}
								className="game-terrain"
								style={{
									position:
										"absolute",
									left: `${
										obj.x -
										50
									}px`,
									top: `${
										obj.y -
										50
									}px`,
									width: "100px",
									height:
										"100px",
									backgroundColor:
										terrainColor,
									borderRadius:
										terrainProps.type ===
										"platform"
											? "0"
											: "5px",
									opacity:
										obj.active
											? 1
											: 0.5,
								}}
							/>
						);
					})}

				{/* Render other game objects */}
				{activeGameObjects
					.filter(
						(obj) =>
							obj.type !==
							"terrain"
					)
					.map((obj) => {
						let icon =
							"❓";
						let className = `game-node game-node-${obj.type}`;

						switch (
							obj.type
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
									obj.id
								}
								className={
									className
								}
								style={{
									position:
										"absolute",
									left: `${obj.x}px`,
									top: `${obj.y}px`,
									transform:
										"translate(-50%, -50%)",
									opacity:
										obj.active
											? 1
											: 0.3,
								}}
							>
								{icon}{" "}
								{
									obj.type
								}
							</div>
						);
					})}

				{/* Render player */}
				<div
					className="game-node game-node-player"
					style={{
						position:
							"absolute",
						left: `${player.x}px`,
						top: `${player.y}px`,
						transform:
							"translate(-50%, -50%)",
						opacity:
							player.invincible
								? 0.7
								: 1,
						animation:
							player.invincible
								? "blink 0.5s infinite"
								: "none",
					}}
				>
					👤 Player
				</div>

				{/* Health bar */}
				<div
					style={{
						position:
							"absolute",
						top: "10px",
						left: "10px",
						background:
							"rgba(0,0,0,0.7)",
						padding:
							"10px",
						borderRadius:
							"5px",
						color: "white",
					}}
				>
					<div>
						Health:{" "}
						{
							player.health
						}
						/
						{
							player.maxHealth
						}
					</div>
					<div
						style={{
							width: "200px",
							height:
								"10px",
							background:
								"#333",
							marginTop:
								"5px",
							borderRadius:
								"5px",
							overflow:
								"hidden",
						}}
					>
						<div
							style={{
								width: `${
									(player.health /
										player.maxHealth) *
									100
								}%`,
								height:
									"100%",
								background:
									player.health >
									50
										? "#4CAF50"
										: player.health >
										  25
										? "#FF9800"
										: "#F44336",
								transition:
									"width 0.3s ease",
							}}
						/>
					</div>
				</div>

				{/* Game over overlay */}
				{gameEngine.isGameOver() && (
					<div
						style={{
							position:
								"absolute",
							top: "50%",
							left: "50%",
							transform:
								"translate(-50%, -50%)",
							background:
								"rgba(0,0,0,0.8)",
							color: "white",
							padding:
								"20px",
							borderRadius:
								"10px",
							textAlign:
								"center",
						}}
					>
						<h3>
							Game
							Over!
						</h3>
						<p>
							Your
							health
							reached 0
						</p>
						<button
							onClick={() =>
								gameEngine.reset(
									nodes,
									edges
								)
							}
						>
							Restart
						</button>
					</div>
				)}
			</div>

			<style jsx>{`
			<style>{`
				@keyframes blink {
					0%,
					50% {
						opacity: 0.7;
					}
					51%,
					100% {
						opacity: 0.3;
					}
				}
			`}</style>
		</div>
	);
};
