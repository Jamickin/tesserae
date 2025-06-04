import React, {
	memo,
} from "react";
import {
	Handle,
	Position,
	type NodeProps,
} from "reactflow";

function PlayerNode({
	data,
}: NodeProps) {
	return (
		<div className="custom-node player">
			<Handle
				type="target"
				position={
					Position.Top
				}
				className="custom-handle"
			/>
			<div className="title">
				👤 {data.label}
			</div>
			<div>
				Health:{" "}
				{data.properties
					?.health ||
					100}
			</div>
			<div>
				Speed:{" "}
				{data.properties
					?.speed || 5}
			</div>
			<div>
				Movement:{" "}
				{data.properties
					?.movementType ===
				"xOnly"
					? "X-axis only"
					: "X and Y axes"}
			</div>
			<Handle
				type="source"
				position={
					Position.Bottom
				}
				className="custom-handle"
			/>
		</div>
	);
}

export default memo(
	PlayerNode
);
