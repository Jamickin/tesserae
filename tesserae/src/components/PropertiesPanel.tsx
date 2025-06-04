import React from "react";
import {
	type Node,
	type Edge,
} from "reactflow";

interface PropertiesPanelProps {
	selectedNode: Node | null;
	selectedEdge: Edge | null;
	onNodePropertyChange: (
		nodeId: string,
		property: string,
		value: unknown
	) => void;
	onEdgePropertyChange: (
		edgeId: string,
		property: string,
		value: unknown
	) => void;
}

const PropertiesPanel: React.FC<
	PropertiesPanelProps
> = ({
	selectedNode,
	selectedEdge,
	onNodePropertyChange,
	onEdgePropertyChange,
}) => {
	if (
		!selectedNode &&
		!selectedEdge
	) {
		return (
			<div className="properties-panel">
				<h3>
					Properties
				</h3>
				<p>
					Select a node
					or connection
					to view
					properties
				</p>
			</div>
		);
	}

	if (selectedNode) {
		const nodeType =
			selectedNode.type ||
			"default";
		const properties =
			selectedNode.data
				.properties || {};

		return (
			<div className="properties-panel">
				<h3>
					{
						selectedNode
							.data
							.label
					}{" "}
					Properties
				</h3>

				{nodeType ===
					"player" && (
					<>
						{/* Existing player properties */}
						<div className="property-group">
							<label>
								Health:
							</label>
							<input
								type="number"
								value={
									properties.health
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"health",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Speed:
							</label>
							<input
								type="number"
								value={
									properties.speed
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"speed",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Can
								Jump:
							</label>
							<input
								type="checkbox"
								checked={
									properties.canJump
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"canJump",
										e
											.target
											.checked
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Movement
								Type:
							</label>
							<select
								value={
									properties.movementType
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"movementType",
										e
											.target
											.value
									)
								}
							>
								<option value="xOnly">
									X-axis
									only
									(side
									to
									side)
								</option>
								<option value="xyAxis">
									X
									and
									Y
									axes
									(full
									movement)
								</option>
							</select>
						</div>
						<div className="property-group">
							<label>
								Spawn
								Position
								X:
							</label>
							<input
								type="number"
								value={
									properties.spawnX
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"spawnX",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Spawn
								Position
								Y:
							</label>
							<input
								type="number"
								value={
									properties.spawnY
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"spawnY",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
					</>
				)}

				{nodeType ===
					"enemy" && (
					<>
						<div className="property-group">
							<label>
								Health:
							</label>
							<input
								type="number"
								value={
									properties.health
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"health",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Damage:
							</label>
							<input
								type="number"
								value={
									properties.damage
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"damage",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Behavior:
							</label>
							<select
								value={
									properties.behavior
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"behavior",
										e
											.target
											.value
									)
								}
							>
								<option value="patrol">
									Patrol
								</option>
								<option value="chase">
									Chase
									Player
								</option>
								<option value="stationary">
									Stationary
								</option>
							</select>
						</div>
					</>
				)}

				{nodeType ===
					"terrain" && (
					<>
						<div className="property-group">
							<label>
								Type:
							</label>
							<select
								value={
									properties.type
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"type",
										e
											.target
											.value
									)
								}
							>
								<option value="ground">
									Ground
								</option>
								<option value="platform">
									Platform
								</option>
								<option value="water">
									Water
								</option>
								<option value="lava">
									Lava
								</option>
							</select>
						</div>
						<div className="property-group">
							<label>
								Solid:
							</label>
							<input
								type="checkbox"
								checked={
									properties.solid
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"solid",
										e
											.target
											.checked
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Friction:
							</label>
							<input
								type="range"
								min="0"
								max="1"
								step="0.1"
								value={
									properties.friction
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"friction",
										parseFloat(
											e
												.target
												.value
										)
									)
								}
							/>
							<span>
								{
									properties.friction
								}
							</span>
						</div>
						<div className="property-group">
							<label>
								World
								Boundary:
							</label>
							<select
								value={
									properties.worldBoundary
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"worldBoundary",
										e
											.target
											.value
									)
								}
							>
								<option value="none">
									No
									Boundaries
								</option>
								<option value="solid">
									Solid
									Boundaries
								</option>
								<option value="wrap">
									Wrap
									Around
								</option>
							</select>
						</div>
						<div className="property-group">
							<label>
								World
								Width:
							</label>
							<input
								type="number"
								value={
									properties.width
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"width",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								World
								Height:
							</label>
							<input
								type="number"
								value={
									properties.height
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"height",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
					</>
				)}

				{nodeType ===
					"item" && (
					<>
						<div className="property-group">
							<label>
								Pickupable:
							</label>
							<input
								type="checkbox"
								checked={
									properties.pickupable
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"pickupable",
										e
											.target
											.checked
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Effect:
							</label>
							<select
								value={
									properties.effect
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"effect",
										e
											.target
											.value
									)
								}
							>
								<option value="none">
									None
								</option>
								<option value="health">
									Health
									+20
								</option>
								<option value="speed">
									Speed
									+2
								</option>
								<option value="jump">
									Jump
									Height
									+1
								</option>
								<option value="invincible">
									Temporary
									Invincibility
								</option>
							</select>
						</div>
						<div className="property-group">
							<label>
								Value:
							</label>
							<input
								type="number"
								value={
									properties.value
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"value",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
					</>
				)}

				{nodeType ===
					"trigger" && (
					<>
						<div className="property-group">
							<label>
								Activation:
							</label>
							<select
								value={
									properties.activation
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"activation",
										e
											.target
											.value
									)
								}
							>
								<option value="proximity">
									Proximity
								</option>
								<option value="interact">
									Interact
								</option>
								<option value="timed">
									Timed
								</option>
							</select>
						</div>
						<div className="property-group">
							<label>
								One-Time
								Only:
							</label>
							<input
								type="checkbox"
								checked={
									properties.oneTime
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"oneTime",
										e
											.target
											.checked
									)
								}
							/>
						</div>
						<div className="property-group">
							<label>
								Radius
								(if
								proximity):
							</label>
							<input
								type="number"
								value={
									properties.radius
								}
								onChange={(
									e
								) =>
									onNodePropertyChange(
										selectedNode.id,
										"radius",
										parseInt(
											e
												.target
												.value
										)
									)
								}
							/>
						</div>
					</>
				)}
			</div>
		);
	}

	if (selectedEdge) {
		const edgeData =
			selectedEdge.data || {
				properties: {
					type: "default",
					effect: "none",
				},
			};

		return (
			<div className="properties-panel">
				<h3>
					Connection
					Properties
				</h3>
				<div className="property-group">
					<label>
						Type:
					</label>
					<select
						value={
							edgeData
								.properties
								.type
						}
						onChange={(
							e
						) =>
							onEdgePropertyChange(
								selectedEdge.id,
								"type",
								e
									.target
									.value
							)
						}
					>
						<option value="default">
							Default
						</option>
						<option value="trigger">
							Trigger
						</option>
						<option value="collision">
							Collision
						</option>
						<option value="pickup">
							Pickup
						</option>
					</select>
				</div>
				<div className="property-group">
					<label>
						Effect:
					</label>
					<select
						value={
							edgeData
								.properties
								.effect
						}
						onChange={(
							e
						) =>
							onEdgePropertyChange(
								selectedEdge.id,
								"effect",
								e
									.target
									.value
							)
						}
					>
						<option value="none">
							None
						</option>
						<option value="damage">
							Damage
						</option>
						<option value="heal">
							Heal
						</option>
						<option value="teleport">
							Teleport
						</option>
						<option value="activate">
							Activate
						</option>
					</select>
				</div>
			</div>
		);
	}

	return null;
};

export default PropertiesPanel;
