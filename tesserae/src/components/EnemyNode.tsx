import React, {
	memo,
} from "react";
import {
	Handle,
	Position,
	type NodeProps,
} from "reactflow";

function EnemyNode({
	data,
}: NodeProps) {
	return (
		<div className="custom-node enemy">
			<Handle
				type="target"
				position={
					Position.Top
				}
				className="custom-handle"
			/>
			<div className="title">
				👹 {data.label}
			</div>
			<div>Health: 50</div>
			<div>Damage: 10</div>
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
	EnemyNode
);
