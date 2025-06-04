import React, {
	memo,
} from "react";
import {
	Handle,
	Position,
	type NodeProps,
} from "reactflow";

function TerrainNode({
	data,
}: NodeProps) {
	return (
		<div className="custom-node terrain">
			<Handle
				type="target"
				position={
					Position.Top
				}
				className="custom-handle"
			/>
			<div className="title">
				🏔️ {data.label}
			</div>
			<div>
				Type: Ground
			</div>
			<div>Solid: Yes</div>
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
	TerrainNode
);
