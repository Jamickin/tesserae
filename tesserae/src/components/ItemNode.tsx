import React, {
	memo,
} from "react";
import {
	Handle,
	Position,
	type NodeProps,
} from "reactflow";

function ItemNode({
	data,
}: NodeProps) {
	return (
		<div className="custom-node item">
			<Handle
				type="target"
				position={
					Position.Top
				}
				className="custom-handle"
			/>
			<div className="title">
				🎁 {data.label}
			</div>
			<div>
				Can Pick Up: Yes
			</div>
			<div>
				Effect: None
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

export default memo(ItemNode);
